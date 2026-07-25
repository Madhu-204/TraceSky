import os
import asyncio
from typing import Optional
from datetime import date, datetime, timedelta

import httpx

from app.cache import get_cache, get_cache_stale, set_cache

WEATHERAPI_BASE = "https://api.weatherapi.com/v1"
WEATHERAPI_KEY = os.getenv("WEATHERAPI_KEY", "")

_pending_fetches: dict[str, asyncio.Event] = {}
_pending_lock = asyncio.Lock()
CONDITION_TO_ICON: dict[int, str] = {
    1000: "sunny", 1003: "cloudy", 1006: "cloudy", 1009: "overcast",
    1030: "fog", 1063: "rain", 1066: "snow", 1069: "sleet",
    1072: "freezing drizzle", 1087: "storm",
    1114: "snow", 1117: "snow", 1135: "fog", 1147: "fog",
    1150: "drizzle", 1153: "drizzle", 1168: "freezing drizzle", 1171: "freezing drizzle",
    1180: "rain", 1183: "rain", 1186: "rain", 1189: "rain",
    1192: "rain", 1195: "rain", 1198: "freezing rain", 1201: "freezing rain",
    1204: "sleet", 1207: "sleet",
    1210: "snow", 1213: "snow", 1216: "snow", 1219: "snow",
    1222: "snow", 1225: "snow", 1237: "hail",
    1240: "rain", 1243: "rain", 1246: "rain",
    1249: "sleet", 1252: "sleet",
    1255: "snow", 1258: "snow", 1261: "hail", 1264: "hail",
    1273: "storm", 1276: "storm", 1279: "storm", 1282: "storm",
}


def _icon(code: int) -> str:
    return CONDITION_TO_ICON.get(code, "cloudy")


WMO_CONDITIONS: dict[int, str] = {
    0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing Rime Fog",
    51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
    56: "Light Freezing Drizzle", 57: "Dense Freezing Drizzle",
    61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
    66: "Light Freezing Rain", 67: "Heavy Freezing Rain",
    71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow", 77: "Snow Grains",
    80: "Slight Rain Showers", 81: "Moderate Rain Showers", 82: "Violent Rain Showers",
    85: "Slight Snow Showers", 86: "Heavy Snow Showers",
    95: "Thunderstorm", 96: "Thunderstorm with Slight Hail", 99: "Thunderstorm with Heavy Hail",
}


def _wmo_condition(code: int) -> str:
    return WMO_CONDITIONS.get(code, "")


def _wmo_icon(code: int) -> str:
    if code == 0:
        return "sunny"
    elif code in (1, 2):
        return "cloudy"
    elif code == 3:
        return "overcast"
    elif code in (45, 48):
        return "fog"
    elif code in (51, 53, 55, 56, 57):
        return "drizzle"
    elif code in (61, 63, 65, 66, 67, 80, 81, 82):
        return "rain"
    elif code in (71, 73, 75, 77, 85, 86):
        return "snow"
    elif code in (95, 96, 99):
        return "storm"
    return "cloudy"


def _confidence(prob: float) -> str:
    return "HIGH" if prob < 30 else "MEDIUM" if prob < 70 else "LOW"


async def _wait_or_register_fetch(cache_key: str) -> bool:
    async with _pending_lock:
        if cache_key in _pending_fetches:
            event = _pending_fetches[cache_key]
            await event.wait()
            return False
        event = asyncio.Event()
        _pending_fetches[cache_key] = event
        return True


async def _mark_fetch_done(cache_key: str) -> None:
    async with _pending_lock:
        event = _pending_fetches.pop(cache_key, None)
        if event:
            event.set()


class WeatherService:

    def __init__(self):
        self._client = httpx.AsyncClient(timeout=15)

    async def close(self):
        await self._client.aclose()

    async def _fetch(self, endpoint: str, params: dict) -> dict | None:
        if not WEATHERAPI_KEY:
            print("WEATHERAPI_KEY not configured")
            return None

        params["key"] = WEATHERAPI_KEY

        try:
            resp = await self._client.get(f"{WEATHERAPI_BASE}/{endpoint}", params=params)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            print(f"WeatherAPI error ({e.response.status_code}): {e}")
            return None
        except Exception as e:
            print(f"WeatherAPI error: {e}")
            return None

    async def _fetch_forecast_api(self, lat: float, lon: float, days: int) -> dict | None:
        return await self._fetch("forecast.json", {
            "q": f"{lat},{lon}",
            "days": str(min(days, 14)),
            "aqi": "no", "alerts": "no",
        })

    async def _get_or_fetch(self, cache_key: str, lat: float, lon: float, days: int,
                            cache_expire: int) -> Optional[dict]:
        cached = get_cache(cache_key)
        if cached is not None:
            return cached

        should_fetch = await _wait_or_register_fetch(cache_key)
        if not should_fetch:
            return get_cache(cache_key) or get_cache_stale(cache_key)

        try:
            cached_after = get_cache(cache_key)
            if cached_after is not None:
                return cached_after

            data = await self._fetch_forecast_api(lat, lon, days)
            if data:
                result = self._build_response(data, days)
                set_cache(cache_key, result, expire=cache_expire)
                return result

            stale = get_cache_stale(cache_key)
            if stale is not None:
                set_cache(cache_key, stale, expire=60)
                return stale

            return None
        finally:
            await _mark_fetch_done(cache_key)

    async def get_current_weather(self, lat: float, lon: float) -> Optional[dict]:
        cache_key = f"current:{lat:.2f}:{lon:.2f}"

        cached = get_cache(cache_key)
        if cached is not None:
            return cached

        forecast = await self.get_forecast(lat, lon, 7)
        if forecast and forecast.get("current"):
            current = forecast["current"]
            result = {
                "temperature": current.get("temperature"),
                "feels_like": current.get("feels_like"),
                "humidity": current.get("humidity"),
                "wind_speed": current.get("wind_speed"),
                "wind_direction": current.get("wind_direction"),
                "uv_index": current.get("uv_index"),
                "precipitation": current.get("precipitation"),
                "condition": current.get("condition"),
                "icon": current.get("icon"),
                "weather_code": current.get("weather_code"),
            }
            set_cache(cache_key, result, expire=300)
            return result

        return None

    async def get_forecast(self, lat: float, lon: float, days: int = 7, include_past: bool = True) -> Optional[dict]:
        cache_key = f"forecast:{lat:.2f}:{lon:.2f}:days={days}"
        result = await self._get_or_fetch(cache_key, lat, lon, days, cache_expire=1800)

        if result and not result.get("historical_hourly"):
            hist_cache_key = f"openmeteo_hist:{lat:.2f}:{lon:.2f}"
            hist = get_cache(hist_cache_key)
            if hist:
                result["historical_hourly"] = hist
            else:
                _ = asyncio.create_task(self._fetch_and_merge_historical(lat, lon))

        return result

    async def _fetch_and_merge_historical(self, lat: float, lon: float) -> Optional[list]:
        cache_key = f"openmeteo_hist:{lat:.2f}:{lon:.2f}"
        cached = get_cache(cache_key)
        if cached is not None:
            return cached

        yesterday = (datetime.now() - timedelta(days=1)).date()
        params = {
            "latitude": str(lat), "longitude": str(lon),
            "start_date": yesterday.isoformat(),
            "end_date": yesterday.isoformat(),
            "hourly": "temperature_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m,pressure_msl",
            "timezone": "auto",
        }

        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get("https://archive-api.open-meteo.com/v1/archive", params=params)
                resp.raise_for_status()
                data = resp.json()
        except Exception as e:
            print(f"Historical hourly fetch non-critical: {e}")
            return None

        hourly = data.get("hourly", {})
        times = hourly.get("time", [])
        if not times:
            return None

        yesterday_str = yesterday.isoformat()
        rows = []
        for i in range(len(times)):
            time_str = times[i]
            try:
                dt = datetime.strptime(time_str, "%Y-%m-%dT%H:%M") if "T" in str(time_str) else datetime.fromisoformat(str(time_str))
                fmt_time = dt.strftime("%H:%M")
            except (ValueError, TypeError):
                fmt_time = str(time_str)[-5:] if len(str(time_str)) >= 5 else str(time_str)

            code = hourly.get("weather_code", [0])[i] if i < len(hourly.get("weather_code", [])) else 0
            precip = hourly.get("precipitation", [0])[i] if i < len(hourly.get("precipitation", [])) else 0

            rows.append({
                "time": fmt_time,
                "iso_time": time_str,
                "is_today": False,
                "temperature": hourly.get("temperature_2m", [])[i] if i < len(hourly.get("temperature_2m", [])) else None,
                "precipitation_probability": precip,
                "weather_code": code,
                "condition": _wmo_condition(code),
                "icon": _wmo_icon(code),
                "wind_speed": hourly.get("wind_speed_10m", [])[i] if i < len(hourly.get("wind_speed_10m", [])) else None,
                "wind_direction": hourly.get("wind_direction_10m", [])[i] if i < len(hourly.get("wind_direction_10m", [])) else None,
                "uv_index": None,
                "humidity": hourly.get("relative_humidity_2m", [])[i] if i < len(hourly.get("relative_humidity_2m", [])) else None,
                "pressure": hourly.get("pressure_msl", [])[i] if i < len(hourly.get("pressure_msl", [])) else None,
                "confidence": "",
            })

        set_cache(cache_key, rows, expire=3600)

        # Merge historical into the forecast cache so subsequent requests have it
        forecast_cache_key = f"forecast:{lat:.2f}:{lon:.2f}:days=7"
        forecast = get_cache(forecast_cache_key)
        if forecast:
            forecast["historical_hourly"] = rows
            set_cache(forecast_cache_key, forecast, expire=1800)

        return rows

    async def get_historical(self, lat: float, lon: float, start_date: date, end_date: date) -> Optional[dict]:
        return None

    def _build_response(self, raw: dict, days: int) -> dict:
        loc = raw.get("location", {})
        current = raw.get("current", {})
        tz_id = loc.get("tz_id", "UTC")

        now = datetime.now()
        today = now.date()
        yesterday = today - timedelta(days=1)

        current_weather = {
            "temperature": current.get("temp_c"),
            "feels_like": current.get("feelslike_c"),
            "humidity": current.get("humidity"),
            "wind_speed": current.get("wind_kph"),
            "wind_direction": current.get("wind_degree"),
            "uv_index": current.get("uv"),
            "precipitation": current.get("precip_mm"),
            "condition": current.get("condition", {}).get("text", ""),
            "icon": _icon(current.get("condition", {}).get("code", 0)),
            "weather_code": current.get("condition", {}).get("code", 0),
        }

        hourly_rows: list[dict] = []
        historical_hourly: list[dict] = []
        daily_rows: list[dict] = []
        day_names = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

        for day_data in raw.get("forecast", {}).get("forecastday", []):
            date_str = day_data.get("date", "")
            try:
                dt = datetime.fromisoformat(date_str) if date_str else now
                d = dt.date()
            except (ValueError, TypeError):
                d = today

            is_yesterday = d == yesterday

            day_info = day_data.get("day", {})
            astro = day_data.get("astro", {})
            daily_rows.append({
                "date": date_str,
                "day": day_names[dt.weekday()] if isinstance(dt, datetime) else date_str,
                "temperature_max": day_info.get("maxtemp_c"),
                "temperature_min": day_info.get("mintemp_c"),
                "precipitation_probability": day_info.get("daily_chance_of_rain"),
                "precipitation_sum": day_info.get("totalprecip_mm"),
                "weather_code": day_info.get("condition", {}).get("code", 0),
                "condition": day_info.get("condition", {}).get("text", ""),
                "icon": _icon(day_info.get("condition", {}).get("code", 0)),
                "wind_speed": day_info.get("maxwind_kph"),
                "uv_index": day_info.get("uv"),
                "sunrise": astro.get("sunrise"),
                "sunset": astro.get("sunset"),
            })

            for hour in day_data.get("hour", []):
                time_str = hour.get("time", "")
                code = hour.get("condition", {}).get("code", 0)
                precip_prob = hour.get("chance_of_rain", 0)

                try:
                    hour_dt = datetime.strptime(time_str, "%Y-%m-%d %H:%M") if time_str else now
                    is_today = hour_dt.date() == today if isinstance(hour_dt, datetime) else True
                    fmt_time = hour_dt.strftime("%H:%M")
                except (ValueError, TypeError):
                    try:
                        hour_dt = datetime.fromisoformat(time_str) if time_str else now
                        is_today = hour_dt.date() == today if isinstance(hour_dt, datetime) else True
                        fmt_time = hour_dt.strftime("%H:%M") if isinstance(hour_dt, datetime) else time_str
                    except (ValueError, TypeError):
                        hour_dt = now
                        is_today = True
                        fmt_time = time_str

                row = {
                    "time": fmt_time,
                    "iso_time": time_str,
                    "is_today": is_today,
                    "temperature": hour.get("temp_c"),
                    "precipitation_probability": precip_prob,
                    "weather_code": code,
                    "condition": hour.get("condition", {}).get("text", ""),
                    "icon": _icon(code),
                    "wind_speed": hour.get("wind_kph"),
                    "wind_direction": hour.get("wind_degree"),
                    "uv_index": hour.get("uv"),
                    "humidity": hour.get("humidity"),
                    "pressure": hour.get("pressure_mb"),
                    "confidence": _confidence(precip_prob),
                }

                if is_yesterday and isinstance(hour_dt, datetime) and hour_dt.date() == yesterday:
                    historical_hourly.append(row)
                else:
                    hourly_rows.append(row)

        return {
            "current": current_weather,
            "hourly": hourly_rows,
            "daily": daily_rows,
            "historical_hourly": historical_hourly,
            "location": {
                "latitude": loc.get("lat"),
                "longitude": loc.get("lon"),
                "timezone": tz_id,
            },
            "generated_at": now.isoformat(),
        }
