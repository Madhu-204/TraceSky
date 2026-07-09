import math
from typing import Optional
from datetime import date, datetime, timedelta

from app.cache import get_cache, set_cache
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


class AIService:

    def __init__(self):
        self.weather = WeatherService()
        self.inference = InferenceEngine()

    async def close(self):
        await self.weather.close()

    # ─────────────────────────── Fact extraction ───────────────────────────

    async def _extract_facts(self, lat: float, lon: float) -> tuple[list[Fact], dict, dict, dict]:
        current = await self.weather.get_current_weather(lat, lon)
        forecast = await self.weather.get_forecast(lat, lon, 7)

        facts: list[Fact] = []
        now = datetime.now()

        # Raw sensor facts from current weather
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

        # Derived facts from forecast data
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

        # Day-over-day delta facts from historical hourly data
        historical_hourly = forecast.get("historical_hourly", [])
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

    # ─────────────────────────── Risk assessment ───────────────────────────

    async def get_risks(self, lat: float, lon: float) -> list[dict]:
        cache_key = f"ai:risks:{lat:.2f}:{lon:.2f}"
        cached = get_cache(cache_key)
        if cached:
            return cached

        _, _, _, report = await self._run_inference(lat, lon)
        risks = report.get("risks", [])

        set_cache(cache_key, risks, expire=600)
        return risks

    # ─────────────────────────── Recommendations ───────────────────────────

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

    # ─────────────────────────── Historical comparison ─────────────────────

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

        hist_temps = avg((last_year or {}).get("temperature_mean", []))
        hist_temps_high = avg((last_year or {}).get("temperature_max", []))
        hist_temps_low = avg((last_year or {}).get("temperature_min", []))
        hist_precip = avg((last_year or {}).get("precipitation_sum", []))
        hist_wind = avg((last_year or {}).get("wind_speed_max", []))

        has_historical = hist_temps is not None

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

    # ─────────────────────────── Farm suggestions ──────────────────────────

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

    # ─────────────────────────── Solar suggestions ─────────────────────────

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

    # ─────────────────────────── Expert analysis (new) ─────────────────────

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

        # Extract delta info for enhanced display (stored in sensor_facts since _extract_facts adds them)
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

    # ─────────────────────────── Chat (pipeline) ───────────────────────────

    async def chat(self, session_id: str, lat: float, lon: float, message: str) -> dict:
        engine = IntentEngine()
        ctx = context_service.get_or_create(session_id)

        # Step 1: Intent extraction
        intent_result = engine.extract(message)
        top_intents = intent_result.top_intents()

        # Record user message in context
        context_service.record_message(session_id, "user", message, top_intents)

        # Step 2: Fetch data based on intents
        data = await self._fetch_for_intents(lat, lon, top_intents, intent_result)

        # Step 3: Generate response with graphs
        response = self._build_enhanced_response(intent_result, data, ctx)

        # Record assistant response
        context_service.record_message(session_id, "assistant", response["response"])

        return response

    # ─────────────────────────── Data fetcher ──────────────────────────────

    async def _fetch_for_intents(self, lat: float, lon: float, intents: list[str],
                                  intent_result: IntentResult) -> dict:
        data: dict = {}

        # Always fetch these basics
        current = await self.weather.get_current_weather(lat, lon)
        forecast = await self.weather.get_forecast(lat, lon, 7)
        risks = await self.get_risks(lat, lon)

        data["current"] = current
        data["forecast"] = forecast
        data["risks"] = risks

        print(f"[DEBUG] _fetch_for_intents: intents={intents}, current={'yes' if current else 'no'}, forecast={'yes' if forecast else 'no'}, risks={len(risks)}")
        if forecast:
            daily = (forecast or {}).get("daily", [])
            print(f"[DEBUG] forecast daily count={len(daily)}")
            if daily:
                print(f"[DEBUG] first day: temp_max={daily[0].get('temperature_max')}, precip={daily[0].get('precipitation_sum')}")

        for intent in intents:
            if intent == "flood" or intent == "storm" or intent == "heat":
                data["recommendations"] = await self.get_recommendations(lat, lon)

            if intent == "historical":
                data["historical"] = await self.get_historical_comparison(lat, lon)

            if intent == "farm":
                data["farm"] = await self.get_farm_suggestions(lat, lon)

            if intent == "solar":
                data["solar"] = await self.get_solar_suggestions(lat, lon)

            if intent == "forecast":
                pass  # already fetched

        return data

    # ─────────────────────────── Response builder ──────────────────────────

    def _build_enhanced_response(self, intent_result: IntentResult, data: dict,
                                  ctx=None) -> dict:
        current = data.get("current") or {}
        forecast = data.get("forecast") or {}
        risks = data.get("risks") or []
        recommendations = data.get("recommendations") or []

        intents = intent_result.top_intents()
        primary = intent_result.primary
        entities = intent_result.entities

        response_text = ""
        graph = None
        metrics = None
        suggestions_data = None

        # ── Risk intents (flood / storm / heat) ──
        risk_intent = next((i for i in intents if i in ("flood", "storm", "heat")), None)
        if risk_intent:
            risk = next((r for r in risks if r["id"] == risk_intent), None)
            if risk:
                response_text = (
                    f"**{risk['name']}**: {risk['severity']} ({risk['percentage']}%)\n\n"
                    f"{risk['detail']}"
                )
                graph = {
                    "type": "risk_gauge",
                    "title": f"{risk['name']} Risk",
                    "value": risk["percentage"],
                    "severity": risk["severity"],
                    "threshold": 70,
                }
                metrics = {
                    "primary": {"label": "Risk Level", "value": f"{risk['percentage']}%", "color": risk.get("color", "amber")},
                    "severity": {"label": "Severity", "value": risk["severity"], "color": risk.get("color", "amber")},
                    "threshold": {"label": "Threshold", "value": "70%", "color": "red"},
                }
            else:
                response_text = f"No significant **{risk_intent}** risk detected at your location. Conditions are stable."

        # ── Historical comparison ──
        elif "historical" in intents:
            hc = data.get("historical")
            if hc:
                m = hc["metrics"]
                response_text = (
                    f"**Historical Comparison** (this week vs last year)\n\n"
                    f"{hc['summary']}\n\n"
                    f"📊 Temperature: {m['temperature']['current']}°C vs {m['temperature']['historical']}°C "
                    f"({m['temperature']['trend']}, {m['temperature']['change_pct']}%)\n"
                    f"🌧 Precipitation: {m['precipitation']['current']}mm vs {m['precipitation']['historical']}mm "
                    f"({m['precipitation']['trend']}, {m['precipitation']['change_pct']}%)\n"
                    f"💨 Wind: {m['wind_speed']['current']}km/h vs {m['wind_speed']['historical']}km/h "
                    f"({m['wind_speed']['trend']}, {m['wind_speed']['change_pct']}%)"
                )
                graph = {
                    "type": "comparison_bars",
                    "title": "This Week vs Last Year",
                    "datasets": [
                        {
                            "label": "Temperature (°C)",
                            "current": m["temperature"]["current"],
                            "historical": m["temperature"]["historical"],
                            "change_pct": m["temperature"]["change_pct"],
                        },
                        {
                            "label": "Precipitation (mm)",
                            "current": m["precipitation"]["current"],
                            "historical": m["precipitation"]["historical"],
                            "change_pct": m["precipitation"]["change_pct"],
                        },
                        {
                            "label": "Wind Speed (km/h)",
                            "current": m["wind_speed"]["current"],
                            "historical": m["wind_speed"]["historical"],
                            "change_pct": m["wind_speed"]["change_pct"],
                        },
                    ],
                }
                metrics = {
                    "temperature": {"label": "Temp Δ", "value": f"{m['temperature']['change_pct']:+.1f}%", "color": "amber" if abs(m['temperature']['change_pct']) > 10 else "emerald"},
                    "precipitation": {"label": "Precip Δ", "value": f"{m['precipitation']['change_pct']:+.1f}%", "color": "blue" if m['precipitation']['change_pct'] > 0 else "emerald"},
                    "wind": {"label": "Wind Δ", "value": f"{m['wind_speed']['change_pct']:+.1f}%", "color": "amber" if abs(m['wind_speed']['change_pct']) > 15 else "emerald"},
                }

        # ── Farm suggestions ──
        elif "farm" in intents:
            farm = data.get("farm", [])
            response_text = "**Farm Intelligence Report**\n\n" + "\n".join(f"🌱 {s}" for s in farm)
            suggestions_data = farm
            graph = {
                "type": "suggestion_list",
                "title": "Farm Suggestions",
                "items": farm[:4],
                "icon": "farm",
            }
            metrics = {
                "total": {"label": "Suggestions", "value": str(len(farm)), "color": "emerald"},
                "temp": {"label": "Current Temp", "value": f"{current.get('temperature', '--')}°C", "color": "blue"},
                "precip": {"label": "Precipitation", "value": f"{current.get('precipitation', 0)}mm", "color": "cyan"},
            }

        # ── Solar suggestions ──
        elif "solar" in intents:
            solar = data.get("solar", [])
            uv = current.get("uv_index", 0) or 0
            response_text = f"**Solar Energy Report**\n\nCurrent UV Index: **{uv}**\n\n" + "\n".join(f"☀️ {s}" for s in solar)
            suggestions_data = solar
            graph = {
                "type": "suggestion_list",
                "title": "Solar Suggestions",
                "items": solar[:4],
                "icon": "solar",
            }
            metrics = {
                "uv": {"label": "UV Index", "value": str(uv), "color": "amber"},
                "suggestions": {"label": "Actions", "value": str(len(solar)), "color": "emerald"},
            }

        # ── Forecast ──
        elif "forecast" in intents:
            daily = (forecast or {}).get("daily", [])
            if daily:
                lines = []
                for d in daily[:5]:
                    lines.append(f"**{d['day']}**: {d.get('temperature_max', '--')}° / {d.get('temperature_min', '--')}° | {d.get('condition', '--')} | 💧 {d.get('precipitation_probability', 0)}%")
                response_text = "**7-Day Forecast**\n\n" + "\n".join(lines)

                graph = {
                    "type": "forecast_line",
                    "title": "Temperature Trend (5 Days)",
                    "labels": [d["day"] for d in daily[:5]],
                    "highs": [d.get("temperature_max", 0) for d in daily[:5]],
                    "lows": [d.get("temperature_min", 0) for d in daily[:5]],
                    "precip": [d.get("precipitation_probability", 0) for d in daily[:5]],
                }
                metrics = {
                    "high": {"label": "High", "value": f"{daily[0].get('temperature_max', '--')}°", "color": "red"},
                    "low": {"label": "Low", "value": f"{daily[0].get('temperature_min', '--')}°", "color": "blue"},
                    "precip": {"label": "Rain Chance", "value": f"{daily[0].get('precipitation_probability', 0)}%", "color": "cyan"},
                }

        # ── General / fallback ──
        if not response_text:
            temp = current.get("temperature", "N/A")
            condition = current.get("condition", "N/A")
            active_risks = [r for r in risks if r.get("severity") != "Low"]
            risk_summary = (
                f"There {'is' if len(active_risks) == 1 else 'are'} "
                f"{len(active_risks)} active risk{'s' if len(active_risks) != 1 else ''}: "
                + ", ".join(f"{r['name']} ({r['severity']})" for r in active_risks)
                if active_risks else "No active risks at this time."
            )
            response_text = (
                f"Current conditions: **{condition}**, **{temp}°C**. {risk_summary}\n\n"
                f"I can help with: flood risk, storm tracking, heat analysis, "
                f"forecast, historical comparisons, farm suggestions, and solar energy planning."
            )

            if forecast:
                daily = (forecast or {}).get("daily", [])
                if daily:
                    graph = {
                        "type": "forecast_line",
                        "title": "Temperature Outlook",
                        "labels": [d["day"] for d in daily[:5]],
                        "highs": [d.get("temperature_max", 0) for d in daily[:5]],
                        "lows": [d.get("temperature_min", 0) for d in daily[:5]],
                        "precip": [d.get("precipitation_probability", 0) for d in daily[:5]],
                    }
                    metrics = {
                        "now": {"label": "Now", "value": f"{temp}°C", "color": "blue"},
                        "condition": {"label": "Condition", "value": str(condition), "color": "gray"},
                    }

        return {
            "response": response_text,
            "graph": graph,
            "metrics": metrics,
            "risks": risks,
            "recommendations": recommendations[:3] if recommendations else None,
            "suggestions": suggestions_data,
            "intents": intents,
            "entities": entities,
        }
