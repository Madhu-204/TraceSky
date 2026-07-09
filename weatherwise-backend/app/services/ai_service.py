import math
from typing import Optional
from datetime import date, datetime, timedelta

from app.cache import get_cache, set_cache
from app.services.weather_service import WeatherService
from app.services.intent_engine import IntentEngine, IntentResult
from app.services.context_service import context_service


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

    async def close(self):
        await self.weather.close()

    # ─────────────────────────── Risk assessment ───────────────────────────

    async def get_risks(self, lat: float, lon: float) -> list[dict]:
        cache_key = f"ai:risks:{lat:.2f}:{lon:.2f}"
        cached = get_cache(cache_key)
        if cached:
            return cached

        current = await self.weather.get_current_weather(lat, lon)
        forecast = await self.weather.get_forecast(lat, lon, 3)
        if not current:
            return []

        hourly = (forecast or {}).get("hourly", [])
        daily = (forecast or {}).get("daily", [])

        risks: list[dict] = []

        # Flood – precipitation rule
        precip = current.get("precipitation", 0) or 0
        max_precip = max(
            (h.get("precipitation_probability", 0) or 0) for h in hourly[:24]
        ) if hourly else 0
        flood_score = min(precip * 10 + max_precip * 0.4, 100)
        if flood_score >= 20:
            level = _risk_level(flood_score)
            risks.append({
                "id": "flood",
                "name": "Coastal Flood Warning",
                "percentage": round(flood_score),
                "severity": level,
                "color": _risk_color(level),
                "detail": f"Precipitation at {precip}mm with {max_precip}% max probability. "
                          f"{'Evacuation recommended for low-lying areas.' if level == 'High' else 'Monitor water levels.'}"
            })

        # Storm – wind rule
        wind = current.get("wind_speed", 0) or 0
        max_wind = max(
            (h.get("wind_speed", 0) or 0) for h in hourly[:24]
        ) if hourly else wind
        gust = max_wind * 1.3
        storm_score = min(gust * 1.2, 100)
        if storm_score >= 20:
            level = _risk_level(storm_score)
            risks.append({
                "id": "storm",
                "name": "Storm Warning",
                "percentage": round(storm_score),
                "severity": level,
                "color": _risk_color(level),
                "detail": f"Wind speeds reaching {max_wind}km/h (gusts ~{round(gust)}km/h). "
                          f"{'Secure loose objects and prepare for outages.' if level == 'High' else 'Caution advised for outdoor activities.'}"
            })

        # Heat – temperature rule
        temp = current.get("temperature", 0) or 0
        feels = current.get("feels_like", temp) or temp
        max_temp = max(
            (d.get("temperature_max", 0) or 0) for d in daily[:7]
        ) if daily else temp
        heat_score = min(max(max_temp - 25, 0) * 3.5 + max(feels - 25, 0) * 2, 100)
        if heat_score >= 15:
            level = _risk_level(heat_score)
            risks.append({
                "id": "heat",
                "name": "Extreme Heatwave" if level == "High" else "Elevated Heat",
                "percentage": round(heat_score),
                "severity": level,
                "color": _risk_color(level),
                "detail": f"Temperature {temp}°C, feels like {feels}°C. High {max_temp}°C forecast. "
                          f"{'Stay hydrated and avoid midday sun.' if level == 'High' else 'Normal precautions advised.'}"
            })

        set_cache(cache_key, risks, expire=600)
        return risks

    # ─────────────────────────── Recommendations ───────────────────────────

    async def get_recommendations(self, lat: float, lon: float) -> list[str]:
        cache_key = f"ai:recommendations:{lat:.2f}:{lon:.2f}"
        cached = get_cache(cache_key)
        if cached:
            return cached

        risks = await self.get_risks(lat, lon)
        current = await self.weather.get_current_weather(lat, lon)
        if not current:
            return ["No data available. Please check your connection."]

        recs: list[str] = []

        has_flood = any(r["id"] == "flood" and r["severity"] != "Low" for r in risks)
        has_storm = any(r["id"] == "storm" and r["severity"] != "Low" for r in risks)
        has_heat = any(r["id"] == "heat" and r["severity"] != "Low" for r in risks)

        if has_flood:
            recs.append("Seal windows and doors with flood barriers")
            recs.append("Move valuable items to higher ground")
            recs.append("Prepare emergency evacuation kit")
        elif current.get("precipitation", 0) > 0:
            recs.append("Carry umbrella and waterproof clothing")
            recs.append("Avoid low-lying roads")

        if has_storm:
            recs.append("Secure outdoor furniture and loose objects")
            recs.append("Charge power banks and prepare backup generator")
            recs.append("Avoid coastal areas during high wind period")
        elif current.get("wind_speed", 0) > 30:
            recs.append("Secure loose items on balconies")
            recs.append("Take care when driving high-sided vehicles")

        if has_heat:
            recs.append("Stay indoors during peak heat hours (12:00-16:00)")
            recs.append("Ensure hydration for all household members")
            recs.append("Activate backup cooling systems")
        elif current.get("temperature", 0) > 30:
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

        # Use forecast data for "current" (always available)
        forecast = await self.weather.get_forecast(lat, lon, 7)
        forecast_daily = (forecast or {}).get("daily", [])
        print(f"[DEBUG] historical_comparison: forecast={forecast is not None}, daily_count={len(forecast_daily)}")
        if forecast_daily:
            print(f"[DEBUG] first daily entry: {forecast_daily[0]}")

        # Use archive for "historical" (same 7-day period last year)
        last_year_start = today - timedelta(days=372)
        last_year_end = today - timedelta(days=365)
        last_year = await self.weather.get_historical(lat, lon, last_year_start, last_year_end)

        def avg(arr):
            vals = [v for v in (arr or []) if v is not None]
            return round(sum(vals) / len(vals), 1) if vals else 0

        def compare(current_val, historical_val):
            if historical_val == 0:
                return 0
            return round(((current_val - historical_val) / historical_val) * 100, 1)

        # Current values from forecast
        forecast_temps_high = avg([d.get("temperature_max") for d in forecast_daily])
        forecast_temps_low = avg([d.get("temperature_min") for d in forecast_daily])
        forecast_precip = avg([d.get("precipitation_sum", 0) or 0 for d in forecast_daily])
        forecast_wind = avg([d.get("wind_speed", 0) or 0 for d in forecast_daily])
        forecast_temp_mean = round((forecast_temps_high + forecast_temps_low) / 2, 1) if forecast_temps_high else 0

        # Historical values from archive
        hist_temps = avg((last_year or {}).get("temperature_mean", []))
        hist_temps_high = avg((last_year or {}).get("temperature_max", []))
        hist_temps_low = avg((last_year or {}).get("temperature_min", []))
        hist_precip = avg((last_year or {}).get("precipitation_sum", []))
        hist_wind = avg((last_year or {}).get("wind_speed_max", []))

        result = {
            "period": {
                "current": {"label": "Forecast (next 7 days)"},
                "comparison": {"label": f"Same week last year ({last_year_start.isoformat()} to {last_year_end.isoformat()})"},
            },
            "metrics": {
                "temperature": {
                    "current": forecast_temp_mean,
                    "historical": hist_temps,
                    "change_pct": compare(forecast_temp_mean, hist_temps),
                    "trend": "warmer" if forecast_temp_mean > hist_temps else "cooler",
                    "current_high": forecast_temps_high,
                    "current_low": forecast_temps_low,
                    "historical_high": hist_temps_high,
                    "historical_low": hist_temps_low,
                },
                "precipitation": {
                    "current": forecast_precip,
                    "historical": hist_precip,
                    "change_pct": compare(forecast_precip, hist_precip),
                    "trend": "wetter" if forecast_precip > hist_precip else "drier",
                },
                "wind_speed": {
                    "current": forecast_wind,
                    "historical": hist_wind,
                    "change_pct": compare(forecast_wind, hist_wind),
                    "trend": "windier" if forecast_wind > hist_wind else "calmer",
                },
            },
            "summary": (
                f"The **next 7 days** are forecast to average **{forecast_temp_mean}°C** "
                f"compared to **{hist_temps}°C** this week last year "
                f"({compare(forecast_temp_mean, hist_temps)}% {forecast_temp_mean - hist_temps:.1f}°C). "
                f"Precipitation is forecast at **{forecast_precip}mm** vs **{hist_precip}mm** last year "
                f"({abs(compare(forecast_precip, hist_precip))}% {'higher' if forecast_precip > hist_precip else 'lower'}). "
                f"Winds are forecast at **{forecast_wind}km/h** vs **{hist_wind}km/h** last year "
                f"({abs(compare(forecast_wind, hist_wind))}% {'stronger' if forecast_wind > hist_wind else 'calmer'})."
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

        current = await self.weather.get_current_weather(lat, lon)
        forecast = await self.weather.get_forecast(lat, lon, 7)
        if not current:
            return ["Unable to fetch weather data for farm analysis."]

        hourly = (forecast or {}).get("hourly", [])
        daily = (forecast or {}).get("daily", [])

        temp = current.get("temperature", 25)
        precip = current.get("precipitation", 0)
        wind = current.get("wind_speed", 0)

        suggestions = []

        # Crop timing
        if 15 <= temp <= 30 and precip < 2 and wind < 20:
            suggestions.append("Optimal conditions for planting and harvesting today")
        elif temp > 35:
            suggestions.append("Delay planting — heat stress will affect germination")
        elif precip > 5:
            suggestions.append("Avoid field work — soil too wet, risk of compaction")

        # Irrigation
        rain_forecast = sum(
            (d.get("precipitation_sum", 0) or 0) for d in daily[:3]
        )
        if rain_forecast < 5:
            suggestions.append("Irrigation recommended — low rainfall expected in next 3 days")
        elif rain_forecast > 20:
            suggestions.append("Delay irrigation — heavy rain incoming may cause runoff")

        # Pest & disease
        if temp > 28 and precip > 3:
            suggestions.append("Warm & humid conditions favor fungal diseases — apply preventive fungicide")
        if temp > 30:
            suggestions.append("Monitor for pest outbreaks — heat stress attracts aphids and mites")

        # Wind protection
        max_wind_fc = max(
            (h.get("wind_speed", 0) or 0) for h in hourly[:48]
        ) if hourly else 0
        if max_wind_fc > 40:
            suggestions.append("Install windbreaks or delay spraying — high winds forecast")
        elif max_wind_fc > 25:
            suggestions.append("Avoid pesticide spraying — drift risk due to moderate winds")

        # Harvest timing
        rain_days = sum(
            1 for d in daily[:5] if (d.get("precipitation_sum", 0) or 0) > 5
        )
        if rain_days <= 1:
            suggestions.append("Good harvest window opening — minimal rain expected")

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

        current = await self.weather.get_current_weather(lat, lon)
        forecast = await self.weather.get_forecast(lat, lon, 7)
        if not current:
            return ["Unable to fetch weather data for solar analysis."]

        daily = (forecast or {}).get("daily", [])
        hourly = (forecast or {}).get("hourly", [])

        suggestions = []

        sun_index = current.get("uv_index", 0) or 0
        cloud_cover = 0
        sunny_hours = 0
        for h in hourly[:48]:
            code = h.get("weather_code", 0) or 0
            if code in (0, 1, 2):
                sunny_hours += 1

        today_sunny_hours = sum(
            1 for h in hourly[:24] if (h.get("weather_code", 0) or 0) in (0, 1, 2)
        )

        if sun_index > 5 and today_sunny_hours >= 6:
            suggestions.append("Excellent solar generation expected today — run full capacity")
        elif sun_index > 3 and today_sunny_hours >= 4:
            suggestions.append("Good solar conditions — standard generation expected")
        elif today_sunny_hours < 3:
            suggestions.append("Low solar generation expected — consider grid backup")
        elif sun_index < 2:
            suggestions.append("Minimal solar input — schedule maintenance during low production")

        # Panel cleaning
        rain_days = sum(
            1 for d in daily[:3] if (d.get("precipitation_sum", 0) or 0) > 3
        )
        if rain_days == 0:
            suggestions.append("No rain expected — good time for panel cleaning")
        elif rain_days > 0:
            suggestions.append("Rain will naturally clean panels — postpone manual cleaning")

        # Battery management
        if sunny_hours < 10:
            suggestions.append("Limited sun next 48h — ensure batteries are fully charged")
        if sun_index < 3:
            suggestions.append("Reduce non-essential load — low solar yield expected")

        # Efficiency tip
        max_temp = max(
            (d.get("temperature_max", 25) or 25) for d in daily[:3]
        ) if daily else temp
        if max_temp > 35:
            suggestions.append("Heat reduces panel efficiency — ensure adequate ventilation")
        elif max_temp < 10:
            suggestions.append("Cold temperatures improve panel efficiency — expect higher output")

        if not suggestions:
            suggestions.append("Conditions are average. Operate at standard capacity.")

        set_cache(cache_key, suggestions, expire=1800)
        return suggestions

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
