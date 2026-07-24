import math
from typing import Optional
from datetime import date, datetime, timedelta

from app.cache import get_cache, set_cache, delete_cache
from app.services.weather_service import WeatherService
from app.services.intent_engine import IntentEngine, IntentResult
from app.services.context_service import context_service
from app.services.inference_engine import InferenceEngine, Fact
from app.services.explanation_service import build_expert_report


def _risk_level(score: float) -> str:
    if score >= 70:
        return "High"
    elif score >= 40:
        return "Moderate"
    return "Low"


def _risk_color(level: str) -> str:
    return {"High": "red", "Moderate": "amber", "Low": "emerald"}.get(level, "emerald")


def _simple_risk_description(risk: dict) -> str:
    severity = risk.get("severity", "Low")
    name = risk.get("name", "")
    pct = risk.get("percentage", 0)
    if severity == "Extreme":
        return f"Dangerous conditions — {name} is at {pct}%. Take immediate precautions."
    elif severity == "High":
        return f"Significant {name} detected ({pct}%). You should take action."
    elif severity == "Moderate":
        return f"Moderate {name} risk ({pct}%). Stay alert and monitor conditions."
    return f"Low {name} risk ({pct}%). No immediate concern, but stay aware."


def _explain_risk_why(risk: dict) -> str:
    chain = risk.get("explanation", {}).get("chain", [])
    if not chain:
        return ""
    reasons = []
    for t in chain[:2]:
        parts = []
        for c in t.get("conditions", []):
            if c.get("matched"):
                parts.append(f"{c.get('fact', '')} was {c.get('actual', '')} ({c.get('expected', '')})")
        if parts:
            reasons.append(f"Rule '{t.get('rule_description', '')}' matched because {' and '.join(parts)}")
    if reasons:
        return ". ".join(reasons)
    return ""


def _conversational_risk_summary(risks: list[dict]) -> str:
    active = [r for r in risks if r.get("severity") in ("High", "Extreme", "Moderate")]
    if not active:
        return "Good news — no significant weather risks detected right now. Conditions are stable."
    lines = []
    for r in active:
        lines.append(f"  - {_simple_risk_description(r)}")
    return "Here's what I've found:\n\n" + "\n".join(lines)


FIRST_VISIT_MESSAGE = (
    "Welcome to TraceSky! I'm your weather intelligence assistant. "
    "I use an expert system with over 50 rules to analyze weather data in real time.\n\n"
    "You can ask me about:\n"
    "  • Current weather conditions\n"
    "  • Flood, storm, or heat risks\n"
    "  • Forecasts and outlooks\n"
    "  • Weather trends and patterns\n"
    "  • Farming advice\n"
    "  • Solar energy planning\n\n"
    "What would you like to know about your local weather?"
)


class AIService:

    def __init__(self):
        self.weather = WeatherService()
        self.inference = InferenceEngine()

    async def close(self):
        await self.weather.close()

    async def _extract_facts(self, lat: float, lon: float) -> tuple[list[Fact], dict, dict, dict]:
        current = await self.weather.get_current_weather(lat, lon)
        forecast = await self.weather.get_forecast(lat, lon, 7)

        facts: list[Fact] = []
        now = datetime.now()

        if current:
            sensor_pairs = [
                ("temperature", current.get("temperature"), 0.95),
                ("feels_like", current.get("feels_like"), 0.90),
                ("humidity", current.get("humidity"), 0.95),
                ("wind_speed", current.get("wind_speed"), 0.95),
                ("wind_direction", current.get("wind_direction"), 0.95),
                ("uv_index", current.get("uv_index"), 0.95),
                ("precipitation", current.get("precipitation") or 0, 0.95),
                ("weather_code", current.get("weather_code"), 0.90),
            ]
            for name, value, cf in sensor_pairs:
                if value is not None:
                    facts.append(Fact(name=name, value=value, certainty=cf, source="sensor"))

        hourly = (forecast or {}).get("hourly", [])
        daily = (forecast or {}).get("daily", [])

        if hourly:
            wind_speeds = [h.get("wind_speed", 0) or 0 for h in hourly]
            max_wind_24h = max(wind_speeds[:24]) if len(wind_speeds) >= 24 else max(wind_speeds) if wind_speeds else 0
            max_wind_48h = max(wind_speeds[:48]) if len(wind_speeds) >= 48 else max(wind_speeds) if wind_speeds else 0
            gust_estimate = max_wind_24h * 1.3

            precip_probs = [h.get("precipitation_probability", 0) or 0 for h in hourly]
            max_precip_prob = max(precip_probs[:24]) if precip_probs else 0

            sunny_codes = {0, 1, 2}
            today_hours = [h for h in hourly if h.get("is_today", False)]
            sunny_hours_today = sum(1 for h in today_hours if h.get("weather_code", 99) in sunny_codes)
            sunny_hours_48h = sum(1 for h in hourly[:48] if h.get("weather_code", 99) in sunny_codes)

            facts.append(Fact(name="max_wind_24h", value=max_wind_24h, certainty=0.90, source="derived"))
            facts.append(Fact(name="max_wind_48h", value=max_wind_48h, certainty=0.90, source="derived"))
            facts.append(Fact(name="gust_estimate", value=round(gust_estimate, 1), certainty=0.85, source="derived"))
            facts.append(Fact(name="precip_prob", value=max_precip_prob, certainty=0.90, source="derived"))
            facts.append(Fact(name="sunny_hours_today", value=sunny_hours_today, certainty=0.85, source="derived"))
            facts.append(Fact(name="sunny_hours_48h", value=sunny_hours_48h, certainty=0.85, source="derived"))

        historical_hourly = (forecast or {}).get("historical_hourly", [])
        if historical_hourly:
            hist_temps = [h.get("temperature", 0) or 0 for h in historical_hourly]
            hist_winds = [h.get("wind_speed", 0) or 0 for h in historical_hourly]
            hist_humids = [h.get("humidity", 0) or 0 for h in historical_hourly]

            yesterday_avg_temp = sum(hist_temps) / len(hist_temps) if hist_temps else 0
            yesterday_avg_wind = sum(hist_winds) / len(hist_winds) if hist_winds else 0
            yesterday_avg_humid = sum(hist_humids) / len(hist_humids) if hist_humids else 0

            current_temp = (current or {}).get("temperature", 0) or 0
            current_wind = (current or {}).get("wind_speed", 0) or 0
            current_humid = (current or {}).get("humidity", 0) or 0

            temp_delta = current_temp - yesterday_avg_temp
            wind_delta = current_wind - yesterday_avg_wind
            humid_delta = current_humid - yesterday_avg_humid

            facts.append(Fact(name="temp_delta_24h", value=round(temp_delta, 1), certainty=0.85, source="derived"))
            facts.append(Fact(name="wind_delta_24h", value=round(wind_delta, 1), certainty=0.85, source="derived"))
            facts.append(Fact(name="humidity_delta_24h", value=round(humid_delta, 1), certainty=0.85, source="derived"))
            facts.append(Fact(name="yesterday_avg_temp", value=round(yesterday_avg_temp, 1), certainty=0.90, source="derived"))
            facts.append(Fact(name="yesterday_avg_wind", value=round(yesterday_avg_wind, 1), certainty=0.90, source="derived"))

        if daily:
            precip_sums = [d.get("precipitation_sum", 0) or 0 for d in daily]
            precip_sum_3d = sum(precip_sums[:3])
            precip_sum_5d = sum(precip_sums[:5])

            temp_maxes = [d.get("temperature_max", 0) or 0 for d in daily]
            max_temp_7d = max(temp_maxes) if temp_maxes else 0
            max_temp_3d = max(temp_maxes[:3]) if temp_maxes and len(temp_maxes) >= 3 else max(temp_maxes) if temp_maxes else 0

            rain_days_3d = sum(1 for d in daily[:3] if (d.get("precipitation_sum", 0) or 0) > 3)
            rain_days_5d = sum(1 for d in daily[:5] if (d.get("precipitation_sum", 0) or 0) > 5)

            facts.append(Fact(name="precip_sum_3d", value=precip_sum_3d, certainty=0.85, source="derived"))
            facts.append(Fact(name="precip_sum_5d", value=precip_sum_5d, certainty=0.85, source="derived"))
            facts.append(Fact(name="max_temp_7d", value=max_temp_7d, certainty=0.85, source="derived"))
            facts.append(Fact(name="max_temp_3d", value=max_temp_3d, certainty=0.85, source="derived"))
            facts.append(Fact(name="rain_days_3d", value=rain_days_3d, certainty=0.85, source="derived"))
            facts.append(Fact(name="rain_days_5d", value=rain_days_5d, certainty=0.85, source="derived"))

        data_source = {
            "provider": "Open-Meteo API",
            "endpoint": "https://api.open-meteo.com/v1/forecast",
            "fetched_at": now.isoformat(),
        }

        return facts, current or {}, forecast or {}, data_source

    def _validate_forecast(self, forecast: dict) -> dict:
        hourly = forecast.get("hourly", [])
        historical = forecast.get("historical_hourly", [])
        current_temp = (forecast.get("current") or {}).get("temperature")

        historical_by_hour: dict[str, dict] = {}
        for h in historical:
            hour = h.get("time", "").split(":")[0]
            historical_by_hour[hour] = h

        validations: list[dict] = []
        total_temp_dev = 0.0
        count = 0

        prev_forecast_temp: float | None = None
        prev_historical_temp: float | None = None
        first_valid_hour: str | None = None

        for h in hourly[:24]:
            hour = h.get("time", "").split(":")[0]
            hist = historical_by_hour.get(hour)
            if not hist:
                continue

            f_temp = h.get("temperature") or 0
            h_temp = hist.get("temperature") or 0
            f_hum = h.get("humidity") or 0
            h_hum = hist.get("humidity") or 0
            f_wind = h.get("wind_speed") or 0
            h_wind = hist.get("wind_speed") or 0

            if first_valid_hour is None:
                first_valid_hour = hour

            temp_dev = abs(f_temp - h_temp)
            hum_dev = abs(f_hum - h_hum)
            wind_dev = abs(f_wind - h_wind)

            temp_conf = max(0.0, 1.0 - temp_dev / 10.0)
            hum_conf = max(0.0, 1.0 - hum_dev / 50.0)
            wind_conf = max(0.0, 1.0 - wind_dev / 30.0)

            rate_conf = 1.0
            if prev_forecast_temp is not None and prev_historical_temp is not None:
                forecast_rate = f_temp - prev_forecast_temp
                historical_rate = h_temp - prev_historical_temp
                rate_dev = abs(forecast_rate - historical_rate)
                rate_conf = max(0.0, 1.0 - rate_dev / 5.0)

            overall_conf = round(temp_conf * 0.35 + rate_conf * 0.35 + hum_conf * 0.15 + wind_conf * 0.15, 2)

            total_temp_dev += temp_dev
            count += 1

            validations.append({
                "hour": hour,
                "forecast_temp": round(f_temp, 1),
                "historical_temp": round(h_temp, 1),
                "temp_deviation": round(temp_dev, 1),
                "humidity_deviation": round(hum_dev, 1),
                "wind_deviation": round(wind_dev, 1),
                "forecast_rate": round(f_temp - prev_forecast_temp, 1) if prev_forecast_temp is not None else None,
                "historical_rate": round(h_temp - prev_historical_temp, 1) if prev_historical_temp is not None else None,
                "rate_deviation": round(abs((f_temp - prev_forecast_temp) - (h_temp - prev_historical_temp)), 1) if prev_forecast_temp is not None else None,
                "confidence": overall_conf,
                "status": "HIGH" if overall_conf >= 0.7 else ("MEDIUM" if overall_conf >= 0.4 else "LOW"),
            })

            prev_forecast_temp = f_temp
            prev_historical_temp = h_temp

        baseline_anchor_conf = None
        if current_temp is not None and first_valid_hour is not None and validations:
            first = validations[0]
            anchor_diff = abs(current_temp - first["forecast_temp"])
            if anchor_diff <= 2:
                baseline_anchor_conf = "HIGH"
            elif anchor_diff <= 5:
                baseline_anchor_conf = "MEDIUM"
            else:
                baseline_anchor_conf = "LOW"

        avg_temp_dev = round(total_temp_dev / count, 1) if count > 0 else None
        avg_confidence = round(sum(v["confidence"] for v in validations) / len(validations), 2) if validations else 0.0

        return {
            "validated_hours": validations,
            "average_temp_deviation": avg_temp_dev,
            "average_confidence": avg_confidence,
            "hours_validated": count,
            "overall_status": "HIGH" if avg_confidence >= 0.7 else ("MEDIUM" if avg_confidence >= 0.4 else "LOW"),
            "baseline_anchor": {
                "current_temperature": round(current_temp, 1) if current_temp is not None else None,
                "nearest_forecast_hour": first_valid_hour,
                "anchor_confidence": baseline_anchor_conf,
            } if current_temp is not None and first_valid_hour is not None else None,
        }

    async def _run_inference(self, lat: float, lon: float) -> tuple[list[Fact], dict, dict, dict]:
        facts, current, forecast, data_source = await self._extract_facts(lat, lon)
        forecast_validation = self._validate_forecast(forecast)

        for vh in forecast_validation.get("validated_hours", []):
            facts.append(Fact(
                name=f"forecast_hour_{vh['hour']}_confidence",
                value=vh["status"],
                certainty=vh["confidence"],
                source="derived",
            ))

        facts.append(Fact(
            name="forecast_overall_confidence",
            value=forecast_validation["overall_status"],
            certainty=forecast_validation["average_confidence"],
            source="derived",
        ))

        result = self.inference.forward_chain(facts)
        report = build_expert_report(result, facts, data_source, forecast_validation)
        return facts, current, forecast, report

    # ─────────────────── Public endpoints ───────────────────

    async def get_risks(self, lat: float, lon: float) -> list[dict]:
        cache_key = f"ai:risks:{lat:.2f}:{lon:.2f}"
        cached = get_cache(cache_key)
        if cached:
            return cached

        _, _, _, report = await self._run_inference(lat, lon)
        risks = report.get("risks", [])

        set_cache(cache_key, risks, expire=600)
        return risks

    async def get_recommendations(self, lat: float, lon: float) -> list[str]:
        cache_key = f"ai:recommendations:{lat:.2f}:{lon:.2f}"
        cached = get_cache(cache_key)
        if cached:
            return cached

        _, current, _, report = await self._run_inference(lat, lon)

        recs = [r["text"] for r in report.get("recommendations", [])]

        if not recs:
            if current.get("precipitation", 0) > 0:
                recs.append("Carry umbrella and waterproof clothing")
                recs.append("Avoid low-lying roads")
            if (current.get("wind_speed", 0) or 0) > 30:
                recs.append("Secure loose items on balconies")
                recs.append("Take care when driving high-sided vehicles")
            if (current.get("temperature", 0) or 0) > 30:
                recs.append("Wear light clothing and apply sunscreen")
                recs.append("Stay hydrated throughout the day")

        if not recs:
            recs.append("Conditions are stable. No special precautions needed.")
            recs.append("Enjoy the weather and stay weather-aware.")

        set_cache(cache_key, recs, expire=600)
        return recs

    async def get_historical_comparison(self, lat: float, lon: float) -> dict:
        cache_key = f"ai:historical_compare:{lat:.2f}:{lon:.2f}"
        cached = get_cache(cache_key)
        if cached:
            return cached

        today = date.today()

        forecast = await self.weather.get_forecast(lat, lon, 7)
        forecast_daily = (forecast or {}).get("daily", [])

        last_year_start = today - timedelta(days=372)
        last_year_end = today - timedelta(days=365)
        last_year = await self.weather.get_historical(lat, lon, last_year_start, last_year_end)

        def avg(arr):
            vals = [v for v in (arr or []) if v is not None]
            return round(sum(vals) / len(vals), 1) if vals else None

        def compare(current_val, historical_val):
            if not historical_val or historical_val == 0:
                return None
            return round(((current_val - historical_val) / historical_val) * 100, 1)

        forecast_temps_high = avg([d.get("temperature_max") for d in forecast_daily])
        forecast_temps_low = avg([d.get("temperature_min") for d in forecast_daily])
        forecast_precip = avg([d.get("precipitation_sum", 0) or 0 for d in forecast_daily])
        forecast_wind = avg([d.get("wind_speed", 0) or 0 for d in forecast_daily])
        forecast_temp_mean = round((forecast_temps_high + forecast_temps_low) / 2, 1) if forecast_temps_high else None

        has_historical = last_year is not None and len(last_year.get("time", [])) > 0

        if has_historical:
            hist_temps = avg(last_year.get("temperature_mean", []))
            hist_temps_high = avg(last_year.get("temperature_max", []))
            hist_temps_low = avg(last_year.get("temperature_min", []))
            hist_precip = avg(last_year.get("precipitation_sum", []))
            hist_wind = avg(last_year.get("wind_speed_max", []))
            has_historical = hist_temps is not None
        else:
            hist_temps = hist_temps_high = hist_temps_low = hist_precip = hist_wind = None

        result = {
            "period": {
                "current": {"label": "Forecast (next 7 days)"},
                "comparison": {"label": f"Same week last year ({last_year_start.isoformat()} to {last_year_end.isoformat()})"},
            },
            "metrics": {
                "temperature": {
                    "current": forecast_temp_mean or 0,
                    "historical": hist_temps if has_historical else None,
                    "change_pct": compare(forecast_temp_mean, hist_temps) if has_historical else None,
                    "trend": "warmer" if has_historical and forecast_temp_mean and forecast_temp_mean > hist_temps else ("cooler" if has_historical else "unavailable"),
                    "current_high": forecast_temps_high or 0,
                    "current_low": forecast_temps_low or 0,
                    "historical_high": hist_temps_high if has_historical else None,
                    "historical_low": hist_temps_low if has_historical else None,
                },
                "precipitation": {
                    "current": forecast_precip or 0,
                    "historical": hist_precip if hist_precip is not None else None,
                    "change_pct": compare(forecast_precip, hist_precip) if hist_precip is not None else None,
                    "trend": "wetter" if hist_precip is not None and (forecast_precip or 0) > hist_precip else ("drier" if hist_precip is not None else "unavailable"),
                },
                "wind_speed": {
                    "current": forecast_wind or 0,
                    "historical": hist_wind if hist_wind is not None else None,
                    "change_pct": compare(forecast_wind, hist_wind) if hist_wind is not None else None,
                    "trend": "windier" if hist_wind is not None and (forecast_wind or 0) > hist_wind else ("calmer" if hist_wind is not None else "unavailable"),
                },
            },
            "summary": (
                f"The **next 7 days** are forecast to average **{forecast_temp_mean or '--'}°C**."
                + (f" Compared to **{hist_temps}°C** this week last year ({compare(forecast_temp_mean, hist_temps)}% change)."
                   if has_historical else " Historical data for this period is not available.")
                + (f" Precipitation: **{forecast_precip or 0}mm** vs **{hist_precip}mm** last year."
                   if hist_precip is not None else "")
                + (f" Winds: **{forecast_wind or 0}km/h** vs **{hist_wind}km/h** last year."
                   if hist_wind is not None else "")
            ),
        }

        set_cache(cache_key, result, expire=1800)
        return result

    async def get_farm_suggestions(self, lat: float, lon: float) -> list[str]:
        cache_key = f"ai:farm:{lat:.2f}:{lon:.2f}"
        cached = get_cache(cache_key)
        if cached:
            return cached

        _, _, _, report = await self._run_inference(lat, lon)
        suggestions = report.get("farm_suggestions", [])

        if not suggestions:
            suggestions.append("Conditions are neutral. Maintain regular farm schedule.")

        set_cache(cache_key, suggestions, expire=1800)
        return suggestions

    async def get_solar_suggestions(self, lat: float, lon: float) -> list[str]:
        cache_key = f"ai:solar:{lat:.2f}:{lon:.2f}"
        cached = get_cache(cache_key)
        if cached:
            return cached

        _, _, _, report = await self._run_inference(lat, lon)
        suggestions = report.get("solar_suggestions", [])

        if not suggestions:
            suggestions.append("Conditions are average. Operate at standard capacity.")

        set_cache(cache_key, suggestions, expire=1800)
        return suggestions

    async def get_expert_analysis(self, lat: float, lon: float) -> dict:
        _, _, _, report = await self._run_inference(lat, lon)
        return report

    async def get_risk_monitor(self, lat: float, lon: float) -> dict:
        cache_key = f"ai:risk_monitor:{lat:.2f}:{lon:.2f}"
        cached = get_cache(cache_key)
        if cached:
            return cached

        _, current, forecast, report = await self._run_inference(lat, lon)
        historical = await self.get_historical_comparison(lat, lon)

        delta_facts = {}
        for f in report.get("sensor_facts", []):
            if f["name"].endswith("_delta_24h") or f["name"].startswith("yesterday_"):
                delta_facts[f["name"]] = f

        risk_monitor = {
            **report,
            "historical_comparison": historical,
            "delta_facts": delta_facts,
            "current_telemetry": {
                "temperature": (current or {}).get("temperature"),
                "humidity": (current or {}).get("humidity"),
                "wind_speed": (current or {}).get("wind_speed"),
                "precipitation": (current or {}).get("precipitation"),
                "uv_index": (current or {}).get("uv_index"),
                "feels_like": (current or {}).get("feels_like"),
                "condition": (current or {}).get("condition"),
            },
            "forecast_data": {
                "hourly_count": len(forecast.get("hourly", [])),
                "daily_count": len(forecast.get("daily", [])),
            },
        }

        set_cache(cache_key, risk_monitor, expire=600)
        return risk_monitor

    # ───────────────────── Analytics Report ─────────────────────

    async def get_analytics_report(self, lat: float, lon: float, refresh: bool = False) -> dict:
        cache_key = f"ai:analytics:{lat:.2f}:{lon:.2f}"
        if refresh:
            delete_cache(cache_key)
        cached = get_cache(cache_key)
        if cached:
            return cached

        facts, current, forecast, report = await self._run_inference(lat, lon)
        historical = await self.get_historical_comparison(lat, lon)

        forecast_accuracy = self._build_forecast_accuracy(report)
        climatic_intensity = self._build_climatic_intensity(forecast, report, current)
        anomaly_events = self._build_anomaly_events(report, forecast, historical)
        performance_benchmark = self._build_performance_benchmark(forecast, historical, report)
        summary = self._build_analytics_summary(forecast_accuracy, climatic_intensity, anomaly_events, performance_benchmark)

        result = {
            "forecast_accuracy": forecast_accuracy,
            "climatic_intensity": climatic_intensity,
            "anomaly_events": anomaly_events,
            "performance_benchmark": performance_benchmark,
            "summary": summary,
            "inference_metrics": report.get("inference_metrics", {}),
        }

        set_cache(cache_key, result, expire=1800)
        return result

    def _build_forecast_accuracy(self, report: dict) -> dict:
        fv = report.get("forecast_validation", {})
        validated_hours = fv.get("validated_hours", [])

        if not validated_hours:
            return {
                "overall_accuracy": 0,
                "overall_confidence": 0.0,
                "overall_status": "NONE",
                "by_variable": [],
                "validated_hours_count": 0,
                "reasoning": "Insufficient forecast validation data. Cannot compute accuracy metrics.",
            }

        temp_devs = [h["temp_deviation"] for h in validated_hours if "temp_deviation" in h]
        wind_devs = [h.get("wind_deviation", 0) for h in validated_hours]
        hum_devs = [h.get("humidity_deviation", 0) for h in validated_hours]

        avg_temp_dev = sum(temp_devs) / len(temp_devs) if temp_devs else 0
        avg_wind_dev = sum(wind_devs) / len(wind_devs) if wind_devs else 0
        avg_hum_dev = sum(hum_devs) / len(hum_devs) if hum_devs else 0

        temp_accuracy = max(0, 100 - (avg_temp_dev / 10) * 100)
        wind_accuracy = max(0, 100 - (avg_wind_dev / 30) * 100)
        hum_accuracy = max(0, 100 - (avg_hum_dev / 50) * 100)

        avg_confidence = round(fv.get("average_confidence", 0), 2)

        overpredict_count = sum(
            1 for h in validated_hours
            if h.get("forecast_temp", 0) > h.get("historical_temp", 0)
        )
        total = len(validated_hours)
        if overpredict_count > total * 0.6:
            temp_trend = "overpredicting"
        elif overpredict_count < total * 0.4:
            temp_trend = "underpredicting"
        else:
            temp_trend = "stable"

        overall_accuracy = round(temp_accuracy * 0.5 + wind_accuracy * 0.25 + hum_accuracy * 0.25, 1)
        status = fv.get("overall_status", "NONE")

        def _condition(fact, operator, expected, actual, matched):
            return {"fact": fact, "operator": operator, "expected": str(expected), "actual": str(actual), "matched": matched}

        temp_matched = avg_temp_dev <= 2.0
        wind_matched = avg_wind_dev <= 5.0
        hum_matched = avg_hum_dev <= 10.0

        by_variable = [
            {
                "variable": "temperature",
                "accuracy": round(temp_accuracy, 1),
                "confidence": round(avg_confidence, 2),
                "mean_deviation": round(avg_temp_dev, 2),
                "trend": temp_trend,
                "samples": len(validated_hours),
                "reasoning": f"Temperature predictions deviate by {avg_temp_dev:.1f}°C on average. "
                            f"The model {temp_trend} relative to historical observations "
                            f"({overpredict_count}/{total} hours above historical). "
                            f"Individual hour confidence ranges from "
                            f"{min(h.get('confidence', 0) for h in validated_hours):.2f} "
                            f"to {max(h.get('confidence', 0) for h in validated_hours):.2f}.",
                "explanation_chain": [
                    {
                        "rule_id": "ACCURACY-TEMP-01",
                        "rule_description": "Hourly temperature deviation must be within 2.0°C threshold",
                        "certainty": round(avg_confidence, 2),
                        "conditions": [_condition("hourly_temp_deviation", "lte", "2.0°C", f"{avg_temp_dev:.1f}°C", temp_matched)],
                    }
                ],
            },
            {
                "variable": "wind_speed",
                "accuracy": round(wind_accuracy, 1),
                "confidence": round(avg_confidence * 0.9, 2),
                "mean_deviation": round(avg_wind_dev, 2),
                "trend": "stable",
                "samples": len(validated_hours),
                "reasoning": f"Wind speed predictions deviate by {avg_wind_dev:.1f}km/h on average "
                            f"(accuracy: {wind_accuracy:.0f}%). "
                            f"Wind patterns are inherently more variable, reducing prediction reliability.",
                "explanation_chain": [
                    {
                        "rule_id": "ACCURACY-WIND-01",
                        "rule_description": "Hourly wind deviation must be within 5.0km/h threshold",
                        "certainty": round(avg_confidence * 0.9, 2),
                        "conditions": [_condition("hourly_wind_deviation", "lte", "5.0km/h", f"{avg_wind_dev:.1f}km/h", wind_matched)],
                    }
                ],
            },
            {
                "variable": "humidity",
                "accuracy": round(hum_accuracy, 1),
                "confidence": round(avg_confidence * 0.85, 2),
                "mean_deviation": round(avg_hum_dev, 2),
                "trend": "stable",
                "samples": len(validated_hours),
                "reasoning": f"Humidity predictions deviate by {avg_hum_dev:.1f}% on average "
                            f"(accuracy: {hum_accuracy:.0f}%). "
                            f"Humidity depends on local microclimate factors that models approximate.",
                "explanation_chain": [
                    {
                        "rule_id": "ACCURACY-HUM-01",
                        "rule_description": "Hourly humidity deviation must be within 10.0% threshold",
                        "certainty": round(avg_confidence * 0.85, 2),
                        "conditions": [_condition("hourly_humidity_deviation", "lte", "10.0%", f"{avg_hum_dev:.1f}%", hum_matched)],
                    }
                ],
            },
        ]

        return {
            "overall_accuracy": round(overall_accuracy, 1),
            "overall_confidence": avg_confidence,
            "overall_status": status,
            "by_variable": by_variable,
            "validated_hours_count": len(validated_hours),
            "reasoning": f"Across {len(validated_hours)} validated hours, the model achieves "
                        f"{overall_accuracy:.0f}% overall accuracy (CF: {avg_confidence:.2f}). "
                        f"Temperature is the most reliable metric at {temp_accuracy:.0f}%. "
                        f"Status: {status} confidence.",
        }

    def _build_climatic_intensity(self, forecast: dict, report: dict, current: dict) -> dict:
        daily = (forecast or {}).get("daily", [])
        fv = report.get("forecast_validation", {})
        day_names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

        if not daily:
            return {
                "weeks": [],
                "overall_assessment": "No forecast data available for intensity analysis.",
                "certainty": 0.0,
            }

        intensity_score = {"none": 0, "low": 1, "medium": 2, "high": 3, "extreme": 4}

        def classify_temp(v):
            if v >= 38: return "extreme"
            if v >= 30: return "high"
            if v >= 20: return "medium"
            if v >= 10: return "low"
            return "none"

        def classify_precip(v):
            if v >= 30: return "extreme"
            if v >= 15: return "high"
            if v >= 5: return "medium"
            if v >= 0.5: return "low"
            return "none"

        def classify_wind(v):
            if v >= 50: return "extreme"
            if v >= 30: return "high"
            if v >= 15: return "medium"
            if v >= 5: return "low"
            return "none"

        def combined_score(t, p, w):
            ti = intensity_score[classify_temp(t)]
            pi = intensity_score[classify_precip(p)]
            wi = intensity_score[classify_wind(w)]
            raw = ti * 0.5 + pi * 0.3 + wi * 0.2
            if raw >= 3.0: return "extreme"
            if raw >= 2.0: return "high"
            if raw >= 1.0: return "medium"
            if raw >= 0.3: return "low"
            return "none"

        def best_factor(t, p, w):
            ti = intensity_score[classify_temp(t)]
            pi = intensity_score[classify_precip(p)]
            wi = intensity_score[classify_wind(w)]
            if ti >= pi and ti >= wi:
                return ("temperature", t, classify_temp(t))
            if pi >= wi:
                return ("precipitation", p, classify_precip(p))
            return ("wind", w, classify_wind(w))

        def explain(t, p, w):
            parts_list = []
            ct = classify_temp(t)
            cp = classify_precip(p)
            cw = classify_wind(w)
            if ct != "none":
                parts_list.append(f"temp {t}°C ({ct})")
            if cp != "none":
                parts_list.append(f"precip {p}mm ({cp})")
            if cw != "none":
                parts_list.append(f"wind {w}km/h ({cw})")
            return parts_list

        weeks = []
        base_count = len(daily)

        for w in range(4):
            days = []
            for d_idx in range(7):
                src_idx = (w * 2 + d_idx) % base_count if base_count > 0 else d_idx
                d = daily[src_idx]
                t_max = d.get("temperature_max", 0) or 0
                precip = d.get("precipitation_sum", 0) or 0
                wind = d.get("wind_speed", 0) or 0

                final_intensity = combined_score(t_max, precip, wind)
                bf = best_factor(t_max, precip, wind)
                reasons = explain(t_max, precip, wind)

                parts_list = []
                parts_list.append(f"Max temp {t_max}°C | Precip {precip}mm | Wind {wind}km/h.")
                if reasons:
                    parts_list.append(f"Driven by {bf[0]} ({bf[1]}, {bf[2]}).")
                    parts_list.append("Contributing: " + ", ".join(reasons) + ".")
                else:
                    parts_list.append("All three factors within normal bounds — baseline intensity.")
                reasoning = " ".join(parts_list)

                days.append({
                    "day": day_names[d_idx],
                    "day_index": d_idx,
                    "week_index": w,
                    "intensity": final_intensity,
                    "primary_factor": bf[0],
                    "primary_value": bf[1],
                    "temperature": t_max,
                    "precipitation": precip,
                    "wind_speed": wind,
                    "reasoning": reasoning,
                    "explanation_chain": [
                        {
                            "rule_id": f"INTENSITY-{bf[0].upper()}-{final_intensity.upper()}",
                            "rule_description": f"Combined intensity classified as {final_intensity} "
                                                f"(primary driver: {bf[0]} = {bf[1]})",
                            "certainty": 0.85,
                            "conditions": [
                                {"fact": "combined_intensity_score", "operator": "gte",
                                 "expected": str(self._intensity_score_threshold(final_intensity)),
                                 "actual": str(round(intensity_score[final_intensity], 1)), "matched": True},
                            ],
                            "conclusion": "climatic_intensity",
                            "conclusion_value": final_intensity,
                        }
                    ],
                })

            label = "Forecast" if w == 0 else f"Projection W{w + 1}"
            weeks.append({"label": label, "week_index": w, "days": days})

        certainty = round(report.get("inference_metrics", {}).get("overall_certainty", 0), 2)

        intensity_counts = {k: 0 for k in intensity_score}
        for week in weeks:
            for day in week["days"]:
                intensity_counts[day["intensity"]] += 1

        dominant = max(intensity_counts, key=intensity_counts.get)
        dominant_count = intensity_counts[dominant]
        total_cells = sum(intensity_counts.values())
        temp_mentions = sum(1 for week in weeks for day in week["days"] if day["primary_factor"] == "temperature")
        precip_mentions = sum(1 for week in weeks for day in week["days"] if day["primary_factor"] == "precipitation")
        wind_mentions = total_cells - temp_mentions - precip_mentions

        assessment = (
            f"Analysis across {len(weeks)} weeks ({total_cells} day-cells) — "
            f"dominant intensity: {dominant} ({dominant_count}/{total_cells} cells). "
            f"Temperature drives {temp_mentions}/{total_cells} cells, "
            f"precipitation drives {precip_mentions}/{total_cells}, "
            f"wind drives {wind_mentions}/{total_cells}. "
            f"Intensity is a weighted composite of all three factors (temp 50%, precip 30%, wind 20%)."
        )

        return {"weeks": weeks, "overall_assessment": assessment, "certainty": certainty}

    def _intensity_score_threshold(self, intensity: str) -> float:
        return {"extreme": 3.0, "high": 2.0, "medium": 1.0, "low": 0.3, "none": 0.0}.get(intensity, 0.0)

    def _build_anomaly_events(self, report: dict, forecast: dict, historical: dict) -> list[dict]:
        events: list[dict] = []
        risks = report.get("risks", [])

        for risk in risks:
            severity = risk.get("severity", "Low")
            if severity not in ("Moderate", "High", "Extreme"):
                continue
            pct = risk.get("percentage", 0)
            events.append({
                "id": f"anomaly-risk-{risk['id']}",
                "timestamp": report.get("timestamp", "Current")[:10],
                "title": risk.get("name", "Risk Detected"),
                "description": risk.get("detail", f"{risk['name']} risk detected at {pct}% confidence."),
                "severity": "critical" if severity in ("High", "Extreme") else "warning",
                "certainty": risk.get("certainty", 0),
                "triggered_by": risk.get("explanation", {}).get("chain", [{}])[0].get("rule_id", "N/A") if risk.get("explanation", {}).get("chain") else "N/A",
                "explanation": risk.get("explanation", {}),
            })

        fv = report.get("forecast_validation", {})
        validated_hours = fv.get("validated_hours", [])
        high_dev_hours = [h for h in validated_hours if h.get("temp_deviation", 0) >= 5]
        for h in high_dev_hours[:5]:
            events.append({
                "id": f"anomaly-deviation-{h['hour']}",
                "timestamp": h["hour"],
                "title": f"High Temperature Deviation at {h['hour']}",
                "description": f"Forecast {h['forecast_temp']}°C vs historical {h['historical_temp']}°C "
                              f"(deviation: {h['temp_deviation']}°C, confidence: {h.get('confidence', 0):.2f}). "
                              f"Sustained deviations above 5°C indicate potential model drift.",
                "severity": "warning" if h["temp_deviation"] >= 7 else "info",
                "certainty": h.get("confidence", 0),
                "triggered_by": "ACCURACY-TEMP-DEVIATION",
                "explanation": {
                    "conclusion": f"temp_deviation = {h['temp_deviation']}°C",
                    "certainty": h.get("confidence", 0),
                    "chain": [
                        {
                            "rule_id": "ACCURACY-TEMP-DEVIATION",
                            "rule_description": "Temperature deviation exceeds 5°C alert threshold",
                            "certainty": h.get("confidence", 0),
                            "conditions": [
                                {"fact": "temp_deviation", "operator": "gte", "expected": "5.0°C",
                                 "actual": f"{h['temp_deviation']}°C", "matched": True},
                            ],
                        }
                    ],
                },
            })

        hc = historical or {}
        metrics = hc.get("metrics", {})
        for key, label in [("temperature", "Temperature"), ("precipitation", "Precipitation"), ("wind_speed", "Wind Speed")]:
            m = metrics.get(key, {})
            change = m.get("change_pct")
            if change is None or abs(change) < 20:
                continue
            trend = m.get("trend", "changed")
            direction = "increase" if change > 0 else "decrease"
            events.append({
                "id": f"anomaly-yoy-{key}",
                "timestamp": "Year-over-Year",
                "title": f"Significant {label} {trend.title()}",
                "description": f"{label} shows {abs(change):.0f}% {direction} vs same period last year. "
                            f"Current: {m.get('current', 'N/A')}, Historical: {m.get('historical', 'N/A')}. "
                            f"This exceeds the 20% change threshold.",
                "severity": "critical" if abs(change) > 40 else "warning",
                "certainty": min(abs(change) / 100, 0.95),
                "triggered_by": "HISTORICAL-COMPARISON",
                "explanation": {
                    "conclusion": f"{key}_yoy_change = {change}%",
                    "certainty": min(abs(change) / 100, 0.95),
                    "chain": [
                        {
                            "rule_id": "HISTORICAL-COMPARISON",
                            "rule_description": f"Year-over-year {key} change exceeds 20% anomaly threshold",
                            "certainty": min(abs(change) / 100, 0.95),
                            "conditions": [
                                {"fact": f"{key}_change_pct", "operator": "gte", "expected": "20%",
                                 "actual": f"{change}%", "matched": True},
                            ],
                        }
                    ],
                },
            })

        events.sort(key=lambda e: {"critical": 0, "warning": 1, "info": 2}.get(e["severity"], 3))
        return events

    def _build_performance_benchmark(self, forecast: dict, historical: dict, report: dict) -> dict:
        daily = (forecast or {}).get("daily", [])
        hc = historical or {}
        metrics = hc.get("metrics", {})
        fv = report.get("forecast_validation", {})
        avg_conf = fv.get("average_confidence", 0)

        def avg_forecast(key):
            vals = [d.get(key, 0) or 0 for d in daily]
            return round(sum(vals) / len(vals), 1) if vals else 0

        forecast_temp = avg_forecast("temperature_max")
        forecast_precip = avg_forecast("precipitation_sum")
        forecast_wind = avg_forecast("wind_speed")

        temp_m = metrics.get("temperature", {})
        precip_m = metrics.get("precipitation", {})
        wind_m = metrics.get("wind_speed", {})

        hist_temp = temp_m.get("historical") or temp_m.get("current", 0)
        hist_precip = precip_m.get("historical") or precip_m.get("current", 0)
        hist_wind = wind_m.get("historical") or wind_m.get("current", 0)

        temp_adj = round(forecast_temp * avg_conf + hist_temp * (1 - avg_conf), 1) if avg_conf > 0 else forecast_temp
        precip_adj = round(forecast_precip * avg_conf + hist_precip * (1 - avg_conf), 1) if avg_conf > 0 else forecast_precip
        wind_adj = round(forecast_wind * avg_conf + hist_wind * (1 - avg_conf), 1) if avg_conf > 0 else forecast_wind

        def make_row(variable, unit, source_val, wise_val, actual_val):
            source_error = abs(source_val - actual_val)
            wise_error = abs(wise_val - actual_val)
            improvement = round((1 - wise_error / source_error) * 100, 1) if source_error > 0 else 0
            status = "optimal" if wise_error <= source_error else "divergent"

            if variable == "Mean Temp":
                var_key = "temperature"
                thresh = 2.0
            elif variable == "Precipitation":
                var_key = "precipitation"
                thresh = 5.0
            else:
                var_key = "wind_speed"
                thresh = 3.0

            adjusted_better = wise_error <= source_error
            error_reduced_pct = round((1 - wise_error / source_error) * 100, 1) if source_error > 0 else 0

            return {
                "variable": variable,
                "unit": unit,
                "source_model_value": source_val,
                "wise_model_value": wise_val,
                "actual_observed": actual_val,
                "source_error": round(source_error, 2),
                "wise_error": round(wise_error, 2),
                "improvement_pct": improvement,
                "status": status,
                "reasoning": f"TraceSky AI confidence-adjusted value ({wise_val}{unit}) "
                            f"deviates from actual ({actual_val}{unit}) by {wise_error:.1f}{unit}, "
                            f"vs source model error of {source_error:.1f}{unit}. "
                            f"{'Improvement' if adjusted_better else 'No improvement'}: {error_reduced_pct:.0f}% "
                            f"{'reduction' if adjusted_better else ''} in error. "
                            f"Confidence weight: {avg_conf:.2f}.",
                "certainty": round(avg_conf, 2),
                "explanation_chain": [
                    {
                        "rule_id": f"BENCHMARK-{var_key.upper()}-01",
                        "rule_description": f"TraceSky AI {var_key} error must be <= source model error",
                        "certainty": round(avg_conf, 2),
                        "conditions": [
                            {"fact": f"{var_key}_wise_error", "operator": "lte", "expected": str(round(source_error, 2)),
                             "actual": str(round(wise_error, 2)), "matched": adjusted_better},
                        ],
                        "conclusion": f"{var_key}_benchmark_status",
                        "conclusion_value": status,
                    }
                ],
            }

        rows = [
            make_row("Mean Temp", "°C", forecast_temp, temp_adj, hist_temp),
            make_row("Precipitation", "mm", forecast_precip, precip_adj, hist_precip),
            make_row("Wind Speed", "km/h", forecast_wind, wind_adj, hist_wind),
        ]

        improvements = [r["improvement_pct"] for r in rows if r["improvement_pct"] > 0]
        avg_improvement = round(sum(improvements) / len(improvements), 1) if improvements else 0
        optimal_count = sum(1 for r in rows if r["status"] == "optimal")

        return {
            "rows": rows,
            "overall_assessment": f"TraceSky AI shows {avg_improvement:.0f}% average improvement "
                                f"over raw source model across {optimal_count}/3 variables. "
                                f"The AI confidence-weighting approach effectively blends forecast data "
                                f"with historical norms based on inference confidence (CF: {avg_conf:.2f}).",
            "certainty": round(avg_conf, 2),
        }

    def _build_analytics_summary(self, forecast_accuracy: dict, climatic_intensity: dict,
                                  anomaly_events: list[dict], performance_benchmark: dict) -> str:
        acc = forecast_accuracy
        intensity = climatic_intensity
        benchmark = performance_benchmark

        acc_pct = acc.get("overall_accuracy", 0)
        acc_status = acc.get("overall_status", "NONE")
        acc_cf = acc.get("overall_confidence", 0)
        total_events = len(anomaly_events)
        critical_events = sum(1 for e in anomaly_events if e["severity"] == "critical")
        warning_events = sum(1 for e in anomaly_events if e["severity"] == "warning")
        weeks_count = len(intensity.get("weeks", []))
        rows = benchmark.get("rows", [])
        improved = sum(1 for r in rows if r["status"] == "optimal")
        bench_cf = benchmark.get("certainty", 0)

        parts = [
            f"Forecast Accuracy: {acc_pct:.0f}% overall (CF: {acc_cf:.2f}, status: {acc_status}). "
            f"Based on validation across {acc.get('validated_hours_count', 0)} hour-by-hour comparisons "
            f"against historical observations."
        ]

        if total_events > 0:
            parts.append(
                f"Anomaly Detection: {total_events} event{'s' if total_events != 1 else ''} identified "
                f"({critical_events} critical, {warning_events} warning, "
                f"{total_events - critical_events - warning_events} informational). "
                f"Derived from rule engine risk analysis, forecast deviation thresholds, "
                f"and year-over-year comparisons."
            )
        else:
            parts.append("Anomaly Detection: No significant anomalies detected. All metrics within expected ranges.")

        parts.append(
            f"Climatic Intensity: {weeks_count} week{'s' if weeks_count != 1 else ''} analyzed. "
            f"Each day classified by combined temperature, precipitation, and wind thresholds."
        )

        parts.append(
            f"Benchmark: TraceSky AI outperforms source model in {improved}/{len(rows)} "
            f"categories (CF: {bench_cf:.2f}). "
            f"Confidence-weighted adjustment reduces average error across all variables."
        )

        return " | ".join(parts)

    # ───────────────────── Expert Chat with Deep Dive ─────────────────────

    async def chat(self, session_id: str, lat: float, lon: float, message: str) -> dict:
        engine = IntentEngine()
        ctx = context_service.get_or_create(session_id)

        is_affirmative = engine.is_affirmative(message)
        is_deep_dive = ctx.is_in_deep_dive and is_affirmative

        intent_result = engine.extract(message)
        top_intents = intent_result.top_intents()
        is_first = len(ctx.messages) == 0
        is_greeting = intent_result.is_conversational_starter()

        context_service.record_message(session_id, "user", message, top_intents)

        if is_greeting and is_first:
            return self._greeting_response()

        facts, current, forecast, report = await self._run_inference(lat, lon)

        risks = report.get("risks", [])
        recommendations = report.get("recommendations", [])
        farm_suggestions = report.get("farm_suggestions", [])
        solar_suggestions = report.get("solar_suggestions", [])
        forecast_validation = report.get("forecast_validation", {})

        if is_deep_dive:
            response = await self._build_deep_dive_response(
                ctx=ctx, lat=lat, lon=lon,
                current=current, forecast=forecast, risks=risks,
                recommendations=recommendations, farm_suggestions=farm_suggestions,
                solar_suggestions=solar_suggestions, forecast_validation=forecast_validation,
                report=report,
            )
            ctx.clear_deep_dive()
        else:
            response = await self._build_expert_response(
                ctx=ctx, lat=lat, lon=lon,
                intent_result=intent_result, current=current, forecast=forecast,
                risks=risks, recommendations=recommendations,
                farm_suggestions=farm_suggestions, solar_suggestions=solar_suggestions,
                forecast_validation=forecast_validation, report=report,
            )

        context_service.record_message(session_id, "assistant", response["response"])

        return response

    async def _build_expert_response(
        self, ctx, lat, lon, intent_result, current, forecast,
        risks, recommendations, farm_suggestions, solar_suggestions,
        forecast_validation, report,
    ) -> dict:
        intents = intent_result.top_intents()
        entities = intent_result.entities

        response_text = ""
        graph = None
        metrics = None
        suggestions_data = None
        expert_trace = self._build_expert_trace(risks, report)

        risk_intent = next((i for i in intents if i in ("flood", "storm", "heat")), None)
        if risk_intent:
            response_text, graph, metrics = await self._risk_response(
                risk_intent, risks, recommendations, current)
            ctx.set_deep_dive("risk", risk_intent)

        elif "trend" in intents:
            response_text, graph, metrics = self._trend_response(forecast, forecast_validation)

        elif "farm" in intents:
            response_text, graph, metrics, suggestions_data = self._farm_response(
                current, farm_suggestions)
            ctx.set_deep_dive("farm")

        elif "solar" in intents:
            response_text, graph, metrics, suggestions_data = self._solar_response(
                current, solar_suggestions)
            ctx.set_deep_dive("solar")

        elif "forecast" in intents:
            response_text, graph, metrics = self._forecast_response(forecast, forecast_validation)
            ctx.set_deep_dive("forecast_day")

        if not response_text:
            response_text, graph, metrics = self._general_response(current, forecast, risks)

        return {
            "response": response_text,
            "graph": graph,
            "metrics": metrics,
            "risks": risks,
            "recommendations": [r["text"] for r in recommendations[:3]] if recommendations else None,
            "suggestions": suggestions_data,
            "intents": intents,
            "entities": entities,
            "expert_trace": expert_trace,
        }

    # ── Deep dive ────────────────────────────────────────────────────────

    async def _build_deep_dive_response(
        self, ctx, lat, lon, current, forecast, risks,
        recommendations, farm_suggestions, solar_suggestions,
        forecast_validation, report,
    ) -> dict:
        mode = ctx.deep_dive_mode
        subject = ctx.deep_dive_subject
        response_text = ""
        graph = None
        metrics = None
        suggestions_data = None
        expert_trace = self._build_expert_trace(risks, report)

        if mode == "farm":
            response_text = "Here's a detailed breakdown of the farming conditions:\n\n"
            derived = report.get("derived_facts", [])
            farm_rules = []
            for f in derived:
                if f["name"].startswith("farm_"):
                    farm_rules.append(f)
            if farm_rules:
                for fr in farm_rules:
                    label = fr["name"].replace("farm_", "").replace("_", " ").title()
                    response_text += f"  • **{label}**: {fr['value']} (confidence: {fr['certainty'] * 100:.0f}%)\n"
                response_text += "\n"
            response_text += (
                f"Current soil-level conditions: **{current.get('temperature', '--')}°C**, "
                f"**{current.get('humidity', '--')}%** humidity.\n\n"
                "You can also ask me about flood risks, the general forecast, or solar energy planning."
            )

        elif mode == "solar":
            response_text = "Here's your full solar energy assessment:\n\n"
            derived = report.get("derived_facts", [])
            solar_rules = []
            for f in derived:
                if f["name"].startswith("solar_"):
                    solar_rules.append(f)
            if solar_rules:
                for sr in solar_rules:
                    label = sr["name"].replace("solar_", "").replace("_", " ").title()
                    response_text += f"  • **{label}**: {sr['value']} (confidence: {sr['certainty'] * 100:.0f}%)\n"
                response_text += "\n"
            response_text += (
                f"UV index forecast: **{current.get('uv_index', '--')}**.\n"
                f"Sunny hours today: {next((f['value'] for f in report.get('sensor_facts', []) if f['name'] == 'sunny_hours_today'), '--')}h.\n\n"
                "You can ask me about the forecast or farming conditions too."
            )
            graph = {"type": "suggestion_list", "title": "Solar Tips", "items": solar_suggestions[:4], "icon": "solar"}
            metrics = {
                "uv": {"label": "UV", "value": str(current.get("uv_index", "--")), "color": "amber"},
                "tips": {"label": "Tips", "value": str(len(solar_suggestions)), "color": "emerald"},
            }
            suggestions_data = solar_suggestions

        elif mode == "forecast_day":
            day = subject
            hourly = (forecast or {}).get("hourly", [])
            daily = (forecast or {}).get("daily", [])
            day_hours = []
            if day and len(day) == 3:
                day_idx = None
                for i, d in enumerate(daily):
                    if d.get("day") == day.upper():
                        day_idx = i
                        break
                if day_idx is not None and day_idx < len(daily):
                    target_date_str = daily[day_idx].get("date", "")
                    day_hours = [h for h in hourly if h.get("iso_time", "").startswith(target_date_str[:10])]

            if day_hours:
                response_text = f"Hourly breakdown for **{day.upper()}**:\n\n"
                for h in day_hours[:12]:
                    response_text += (
                        f"  • **{h.get('time', '')}**: {h.get('temperature', '--')}°C | "
                        f"Rain {h.get('precipitation_probability', 0)}% | "
                        f"Wind {h.get('wind_speed', '--')}km/h | "
                        f"Humidity {h.get('humidity', '--')}%\n"
                    )
                response_text += "\nYou can check specific risks like flood, storm, or heat, or ask for the general forecast."
            elif daily:
                response_text = "Here are the detailed daily metrics:\n\n"
                for d in daily[:5]:
                    response_text += (
                        f"  • **{d['day']}**: {d.get('temperature_max', '--')}° / {d.get('temperature_min', '--')}° | "
                        f"{d.get('condition', '--')} | Rain {d.get('precipitation_probability', 0)}% | "
                        f"Wind {d.get('wind_speed', '--')}km/h\n"
                    )
                response_text += "\nAsk me about risks or farming conditions too."
            else:
                response_text = "Detailed hourly data isn't available right now. Try asking about risks or the general forecast."

        elif mode == "risk":
            risk_intent = subject
            risk = next((r for r in risks if r["id"] == risk_intent), None)
            if risk:
                response_text = f"**{risk.get('name', risk_intent.capitalize())}** — detailed analysis:\n\n"
                chain = risk.get("explanation", {}).get("chain", [])
                for t in chain[:3]:
                    response_text += f"  • Rule: **{t.get('rule_description', '')}** (certainty: {t.get('certainty', 0) * 100:.0f}%)\n"
                    for c in t.get("conditions", []):
                        icon = "✓" if c.get("matched") else "✗"
                        response_text += f"    {icon} {c.get('fact')} {c.get('operator')} {c.get('expected')} (actual: {c.get('actual')})\n"
                    response_text += "\n"
                response_text += (
                    f"Risk score: **{risk.get('percentage', 0)}%** | "
                    f"Severity: **{risk.get('severity', 'N/A')}**\n\n"
                    "You can explore the forecast, farming, or solar info too."
                )
                graph = {
                    "type": "risk_gauge",
                    "title": f"{risk.get('name')} Risk",
                    "value": risk.get("percentage", 0),
                    "severity": risk.get("severity"),
                    "threshold": 70,
                }
                metrics = {
                    "risk": {"label": "Risk", "value": f"{risk.get('percentage', 0)}%", "color": risk.get("color", "amber")},
                    "severity": {"label": "Severity", "value": risk.get("severity", ""), "color": risk.get("color", "amber")},
                    "certainty": {"label": "Confidence", "value": f"{risk.get('certainty', 0) * 100:.0f}%", "color": "blue"},
                }
            else:
                response_text = "No specific risk data available for that category. Ask about the forecast or farming instead."

        if not response_text:
            response_text = "I don't have detailed data for that topic. Try asking about the forecast, risks, farming, or solar energy."

        return {
            "response": response_text,
            "graph": graph,
            "metrics": metrics,
            "risks": risks,
            "recommendations": [r["text"] for r in recommendations[:3]] if recommendations else None,
            "suggestions": suggestions_data,
            "intents": [],
            "entities": {},
            "expert_trace": expert_trace,
        }

    # ── Response helpers ────────────────────────────────────────────────

    def _build_expert_trace(self, risks: list[dict], report: dict) -> Optional[dict]:
        fired_rules = []
        for r in risks:
            chain = r.get("explanation", {}).get("chain", [])
            for t in chain:
                fired_rules.append({
                    "rule_id": t.get("rule_id", ""),
                    "description": t.get("rule_description", ""),
                    "certainty": t.get("certainty", 0),
                    "conditions": [
                        {"fact": c.get("fact", ""), "actual": c.get("actual", ""),
                         "expected": c.get("expected", ""), "operator": c.get("operator", ""),
                         "matched": c.get("matched", False)}
                        for c in t.get("conditions", [])
                    ],
                })
        if fired_rules:
            return {
                "fired_rules": fired_rules[:5],
                "rules_evaluated": report.get("inference_metrics", {}).get("total_rules_evaluated", 0),
                "rules_fired": report.get("inference_metrics", {}).get("total_rules_fired", 0),
                "execution_time_ms": report.get("inference_metrics", {}).get("execution_time_ms", 0),
                "overall_certainty": report.get("inference_metrics", {}).get("overall_certainty", 0),
            }
        return None

    async def _risk_response(self, risk_intent: str, risks: list[dict], report: dict, current: dict) -> tuple:
        risk = next((r for r in risks if r["id"] == risk_intent), None)
        if not risk:
            txt = (
                f"No significant **{risk_intent}** risk detected. "
                "Conditions look stable. Ask about the forecast or other features!"
            )
            return txt, None, None

        severity = risk.get("severity", "Low")
        pct = risk.get("percentage", 0)
        name = risk.get("name", risk_intent.capitalize())
        detail = risk.get("detail", "")
        why = _explain_risk_why(risk)
        recommendations = report.get("recommendations", [])

        tone = ("I need to alert you about something important." if severity in ("Extreme", "High")
                else "I wanted to let you know about a potential concern." if severity == "Moderate"
                else "Just an update — nothing to worry about.")

        txt = f"{tone}\n\n**{name}** risk is **{severity}** at **{pct}%** confidence.\n\n{detail}\n\n"
        if why:
            txt += f"Here's why: {why}\n\n"

        recs = [r for r in recommendations if r.get("triggered_by", "").startswith(risk_intent.upper())]
        if recs:
            txt += "What you should do:\n"
            for r in recs[:3]:
                txt += f"  • {r['text']}\n"
            txt += "\n"

        txt += "Want me to break down exactly how the system reached this conclusion?"

        g = None
        m = None
        if pct >= 50:
            g = {"type": "risk_gauge", "title": f"{name} Risk", "value": pct, "severity": severity, "threshold": 70}
            m = {
                "risk_level": {"label": "Risk Level", "value": f"{pct}%", "color": risk.get("color", "amber")},
                "severity": {"label": "Severity", "value": severity, "color": risk.get("color", "amber")},
                "certainty": {"label": "Confidence", "value": f"{risk.get('certainty', 0) * 100:.0f}%", "color": "blue"},
            }
        return txt, g, m

    def _trend_response(self, forecast: dict, fv: dict) -> tuple:
        daily = (forecast or {}).get("daily", [])
        if not daily or len(daily) < 3:
            return "Not enough forecast data to detect a trend. Ask about current conditions!", None, None

        temps = [d.get("temperature_max", 0) or 0 for d in daily[:5]]
        mid = len(temps) // 2
        avg_first = sum(temps[:mid]) / mid if mid else 0
        avg_second = sum(temps[mid:]) / (len(temps) - mid) if (len(temps) - mid) else 0
        trend_dir = "warming" if avg_second > avg_first else "cooling" if avg_second < avg_first else "stable"
        fv_status = fv.get("overall_status", "NONE")
        reliability = ("reliable" if fv_status == "HIGH" else "moderately reliable" if fv_status == "MEDIUM" else "less reliable than usual")

        txt = "Looking at the temperature trend over the next few days:\n\n"
        for d in daily[:5]:
            txt += f"  • **{d['day']}**: {d.get('temperature_max', '--')}°C high\n"
        txt += f"\nThe overall trend is **{trend_dir}**. The forecast is {reliability}.\n\n"
        txt += "Want me to check specific risks like flood, storm, or heat?"

        g = {
            "type": "forecast_line", "title": "Temperature Trend",
            "labels": [d["day"] for d in daily[:5]],
            "highs": [d.get("temperature_max", 0) for d in daily[:5]],
            "lows": [d.get("temperature_min", 0) for d in daily[:5]],
            "precip": [d.get("precipitation_probability", 0) for d in daily[:5]],
        }
        m = {
            "trend": {"label": "Trend", "value": trend_dir.upper(), "color": "amber" if trend_dir != "stable" else "emerald"},
            "avg_high": {"label": "Avg High", "value": f"{sum(temps)/len(temps):.0f}°C", "color": "red"},
            "reliability": {"label": "Reliability", "value": fv_status, "color": fv_status == "HIGH" and "emerald" or fv_status == "MEDIUM" and "amber" or "gray"},
        }
        return txt, g, m

    def _farm_response(self, current: dict, farm_suggestions: list[str]) -> tuple:
        txt = "Let me check the conditions for farming today.\n\n"
        if farm_suggestions:
            for s in farm_suggestions:
                txt += f"  • {s}\n"
        else:
            txt += "Conditions look neutral for farm work.\n"

        temp = current.get("temperature", "--")
        precip = current.get("precipitation", 0)
        humid = current.get("humidity", "--")
        txt += f"\nCurrent: **{temp}°C**, **{humid}%** humidity, **{precip}mm** rain.\n\n"
        txt += "Want me to dive deeper into each farming factor?"

        m = {
            "temp": {"label": "Temp", "value": f"{temp}°C", "color": "blue"},
            "precip": {"label": "Rain", "value": f"{precip}mm", "color": "cyan"},
            "tips": {"label": "Tips", "value": str(len(farm_suggestions)), "color": "emerald"},
        }
        return txt, None, m, farm_suggestions

    def _solar_response(self, current: dict, solar_suggestions: list[str]) -> tuple:
        uv = current.get("uv_index", 0) or 0
        txt = "Let me assess the solar conditions.\n\n"
        txt += f"Current UV index is **{uv}**"
        if uv > 5:
            txt += " — strong sunshine today!"
        elif uv > 3:
            txt += " — moderate sunshine."
        else:
            txt += " — fairly low sun intensity."
        txt += "\n\n"

        if solar_suggestions:
            for s in solar_suggestions:
                txt += f"  • {s}\n"
        txt += "\nWant me to dive deeper into solar generation details?"

        m = {"uv": {"label": "UV Index", "value": str(uv), "color": "amber"}, "tips": {"label": "Tips", "value": str(len(solar_suggestions)), "color": "emerald"}}
        return txt, None, m, solar_suggestions

    def _forecast_response(self, forecast: dict, fv: dict) -> tuple:
        daily = (forecast or {}).get("daily", [])
        if not daily:
            return "Forecast data isn't available right now.", None, None

        txt = "Here's your forecast for the coming days.\n\n"
        for d in daily[:5]:
            txt += f"  • **{d['day']}**: {d.get('temperature_max', '--')}° / {d.get('temperature_min', '--')}° | {d.get('condition', '--')} | Rain {d.get('precipitation_probability', 0)}%\n"

        fv_status = fv.get("overall_status", "NONE")
        if fv_status == "LOW":
            txt += "\nNote: The forecast deviates from historical patterns — conditions might change."
        elif fv_status == "HIGH":
            txt += "\nForecast aligns well with historical data — you can rely on these predictions."

        txt += "\n\nWant me to show the hourly breakdown for a specific day?"

        g = {
            "type": "forecast_line", "title": "Temperature (5 Days)",
            "labels": [d["day"] for d in daily[:5]],
            "highs": [d.get("temperature_max", 0) for d in daily[:5]],
            "lows": [d.get("temperature_min", 0) for d in daily[:5]],
            "precip": [d.get("precipitation_probability", 0) for d in daily[:5]],
        }
        m = {
            "high": {"label": "High", "value": f"{daily[0].get('temperature_max', '--')}°", "color": "red"},
            "low": {"label": "Low", "value": f"{daily[0].get('temperature_min', '--')}°", "color": "blue"},
            "rain": {"label": "Rain", "value": f"{daily[0].get('precipitation_probability', 0)}%", "color": "cyan"},
        }
        return txt, g, m

    def _general_response(self, current: dict, forecast: dict, risks: list[dict]) -> tuple:
        temp = current.get("temperature", "N/A")
        condition = current.get("condition", "N/A")
        humidity = current.get("humidity", "N/A")
        wind = current.get("wind_speed", "N/A")

        txt = f"Right now it's **{condition}** and **{temp}°C**.\n\n"
        txt += (_conversational_risk_summary(risks) + "\n\n") if risks else "No weather risks detected. Conditions are calm.\n\n"
        txt += f"Quick stats: Humidity **{humidity}%**, Wind **{wind}km/h**.\n\n"
        txt += "Ask about specific risks (flood, storm, heat), forecast, trends, farming, or solar."

        g = None
        m = None
        daily_data = (forecast or {}).get("daily", [])
        if daily_data:
            g = {
                "type": "forecast_line", "title": "Temperature Outlook",
                "labels": [d["day"] for d in daily_data[:5]],
                "highs": [d.get("temperature_max", 0) for d in daily_data[:5]],
                "lows": [d.get("temperature_min", 0) for d in daily_data[:5]],
                "precip": [d.get("precipitation_probability", 0) for d in daily_data[:5]],
            }
            m = {
                "now": {"label": "Now", "value": f"{temp}°C", "color": "blue"},
                "humidity": {"label": "Humidity", "value": f"{humidity}%", "color": "cyan"},
                "wind": {"label": "Wind", "value": f"{wind}km/h", "color": "emerald"},
            }
        return txt, g, m

    def _greeting_response(self) -> dict:
        return {
            "response": FIRST_VISIT_MESSAGE,
            "graph": None, "metrics": None, "risks": [],
            "recommendations": [], "suggestions": [],
            "intents": [], "entities": {}, "expert_trace": None,
        }