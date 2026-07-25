import os
import asyncio
import threading
from typing import Optional
from datetime import date, datetime, timedelta

import httpx

from app.cache import get_cache, get_cache_stale, set_cache

WEATHERAPI_BASE = "https://api.weatherapi.com/v1"
WEATHERAPI_KEY = os.getenv("WEATHERAPI_KEY", "")

OPENMETEO_BASE = "https://api.open-meteo.com/v1"

_pending_fetches: dict[str, asyncio.Event] = {}
_pending_lock = asyncio.Lock()

_bias_store: dict[str, dict[str, float]] = {}
_bias_lock = threading.Lock()
_BIAS_ALPHA = 0.15
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
        else:
            event = asyncio.Event()
            _pending_fetches[cache_key] = event
            return True

    await event.wait()
    return False


async def _mark_fetch_done(cache_key: str) -> None:
    async with _pending_lock:
        event = _pending_fetches.pop(cache_key, None)
        if event:
            event.set()


def _loc_key(lat: float, lon: float) -> str:
    return f"{lat:.2f}:{lon:.2f}"

def record_bias(lat: float, lon: float, hour: str, signed_deviation: float) -> None:
    loc = _loc_key(lat, lon)
    with _bias_lock:
        biases = _bias_store.setdefault(loc, {})
        old = biases.get(hour, 0.0)
        biases[hour] = round(old * (1 - _BIAS_ALPHA) + signed_deviation * _BIAS_ALPHA, 2)

def get_bias(lat: float, lon: float, hour: str) -> float:
    loc = _loc_key(lat, lon)
    with _bias_lock:
        return _bias_store.get(loc, {}).get(hour, 0.0)


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

    async def _fetch_openmeteo_forecast(self, lat: float, lon: float, days: int) -> Optional[dict]:
        params = {
            "latitude": str(lat), "longitude": str(lon),
            "hourly": "temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,uv_index",
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,wind_speed_10m_max,uv_index_max,sunrise,sunset",
            "timezone": "auto",
            "forecast_days": str(min(days, 16)),
        }
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(f"{OPENMETEO_BASE}/forecast", params=params)
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            print(f"Open-Meteo forecast error: {e}")
            return None

    def _parse_openmeteo_response(self, raw: dict, days: int) -> dict:
        now = datetime.now()
        today = now.date()
        day_names = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

        hourly_raw = raw.get("hourly", {})
        daily_raw = raw.get("daily", {})
        times = hourly_raw.get("time", [])

        current = {}
        if times:
            code = hourly_raw.get("weather_code", [0])[0] if hourly_raw.get("weather_code") else 0
            current = {
                "temperature": hourly_raw.get("temperature_2m", [None])[0],
                "feels_like": hourly_raw.get("temperature_2m", [None])[0],
                "humidity": hourly_raw.get("relative_humidity_2m", [None])[0],
                "wind_speed": hourly_raw.get("wind_speed_10m", [None])[0],
                "wind_direction": hourly_raw.get("wind_direction_10m", [None])[0],
                "uv_index": hourly_raw.get("uv_index", [None])[0],
                "precipitation": hourly_raw.get("precipitation_probability", [None])[0],
                "condition": _wmo_condition(code),
                "icon": _wmo_icon(code),
                "weather_code": code,
            }

        hourly_rows = []
        for i in range(len(times)):
            time_str = times[i]
            try:
                dt = datetime.fromisoformat(str(time_str).replace("Z", ""))
                fmt_time = dt.strftime("%H:%M")
                is_today = dt.date() == today
            except (ValueError, TypeError):
                fmt_time = str(time_str)[-5:] if len(str(time_str)) >= 5 else str(time_str)
                is_today = True
            code = hourly_raw.get("weather_code", [0])[i] if i < len(hourly_raw.get("weather_code", [])) else 0
            hourly_rows.append({
                "time": fmt_time, "iso_time": time_str, "is_today": is_today,
                "temperature": hourly_raw.get("temperature_2m", [])[i] if i < len(hourly_raw.get("temperature_2m", [])) else None,
                "precipitation_probability": hourly_raw.get("precipitation_probability", [])[i] if i < len(hourly_raw.get("precipitation_probability", [])) else 0,
                "weather_code": code, "condition": _wmo_condition(code), "icon": _wmo_icon(code),
                "wind_speed": hourly_raw.get("wind_speed_10m", [])[i] if i < len(hourly_raw.get("wind_speed_10m", [])) else None,
                "wind_direction": hourly_raw.get("wind_direction_10m", [])[i] if i < len(hourly_raw.get("wind_direction_10m", [])) else None,
                "uv_index": hourly_raw.get("uv_index", [])[i] if i < len(hourly_raw.get("uv_index", [])) else None,
                "humidity": hourly_raw.get("relative_humidity_2m", [])[i] if i < len(hourly_raw.get("relative_humidity_2m", [])) else None,
                "pressure": hourly_raw.get("pressure_msl", [])[i] if i < len(hourly_raw.get("pressure_msl", [])) else None,
                "confidence": "",
            })

        daily_rows = []
        dates = daily_raw.get("time", [])
        for i in range(len(dates)):
            date_str = dates[i]
            try:
                dt = datetime.fromisoformat(str(date_str)) if isinstance(date_str, str) else now
            except (ValueError, TypeError):
                dt = now
            code = daily_raw.get("weather_code", [0])[i] if i < len(daily_raw.get("weather_code", [])) else 0
            daily_rows.append({
                "date": date_str,
                "day": day_names[dt.weekday()] if isinstance(dt, datetime) else date_str,
                "temperature_max": daily_raw.get("temperature_2m_max", [])[i] if i < len(daily_raw.get("temperature_2m_max", [])) else None,
                "temperature_min": daily_raw.get("temperature_2m_min", [])[i] if i < len(daily_raw.get("temperature_2m_min", [])) else None,
                "precipitation_probability": daily_raw.get("precipitation_probability_max", [])[i] if i < len(daily_raw.get("precipitation_probability_max", [])) else None,
                "weather_code": code, "condition": _wmo_condition(code), "icon": _wmo_icon(code),
                "wind_speed": daily_raw.get("wind_speed_10m_max", [])[i] if i < len(daily_raw.get("wind_speed_10m_max", [])) else None,
                "uv_index": daily_raw.get("uv_index_max", [])[i] if i < len(daily_raw.get("uv_index_max", [])) else None,
                "sunrise": daily_raw.get("sunrise", [])[i] if i < len(daily_raw.get("sunrise", [])) else None,
                "sunset": daily_raw.get("sunset", [])[i] if i < len(daily_raw.get("sunset", [])) else None,
            })

        return {
            "current": current,
            "hourly": hourly_rows,
            "daily": daily_rows,
            "historical_hourly": [],
            "location": {"latitude": raw.get("latitude"), "longitude": raw.get("longitude"), "timezone": raw.get("timezone", "UTC")},
            "generated_at": now.isoformat(),
        }

    def _blend_forecasts(self, wa: dict, om: dict, lat: float, lon: float) -> dict:
        now = datetime.now()
        blended_current = {**wa.get("current", {})}

        wa_hourly = {h["time"]: h for h in wa.get("hourly", [])}
        om_hourly = {h["time"]: h for h in om.get("hourly", [])}
        all_times = sorted(set(wa_hourly.keys()) | set(om_hourly.keys()))
        blended_hourly = []

        for t in all_times:
            wh = wa_hourly.get(t)
            oh = om_hourly.get(t)

            if wh and oh:
                wa_t = wh.get("temperature") or 0
                om_t = oh.get("temperature") or 0
                bias = get_bias(lat, lon, t)
                blended_t = round(wa_t * 0.6 + om_t * 0.4 - bias, 1)
                blended_hum = round((wh.get("humidity") or 0) * 0.5 + (oh.get("humidity") or 0) * 0.5, 1)
                blended_wind = round((wh.get("wind_speed") or 0) * 0.5 + (oh.get("wind_speed") or 0) * 0.5, 1)

                agreement = 1.0 - min(1.0, abs(wa_t - om_t) / 5.0)
                base_conf = wh.get("confidence", "")
                if agreement >= 0.8:
                    adj_conf = "HIGH"
                elif agreement >= 0.5:
                    adj_conf = base_conf
                else:
                    adj_conf = "LOW"

                row = {**wh,
                    "temperature": blended_t,
                    "humidity": blended_hum if blended_hum else wh.get("humidity"),
                    "wind_speed": blended_wind if blended_wind else wh.get("wind_speed"),
                    "wind_direction": wh.get("wind_direction") or oh.get("wind_direction"),
                    "uv_index": wh.get("uv_index") or oh.get("uv_index"),
                    "pressure": wh.get("pressure") or oh.get("pressure"),
                    "confidence": adj_conf,
                }
                blended_hourly.append(row)
            elif wh:
                bias = get_bias(lat, lon, t)
                row = {**wh}
                if wh.get("temperature") is not None:
                    row["temperature"] = round((wh["temperature"] or 0) - bias, 1)
                blended_hourly.append(row)
            elif oh:
                bias = get_bias(lat, lon, t)
                row = {**oh}
                if oh.get("temperature") is not None:
                    row["temperature"] = round((oh["temperature"] or 0) - bias, 1)
                blended_hourly.append(row)

        wa_daily = {d["date"]: d for d in wa.get("daily", [])}
        om_daily = {d["date"]: d for d in om.get("daily", [])}
        all_dates = sorted(set(wa_daily.keys()) | set(om_daily.keys()))
        blended_daily = []
        for date_str in all_dates:
            wd = wa_daily.get(date_str)
            od = om_daily.get(date_str)
            if wd and od:
                blended_daily.append({**wd,
                    "temperature_max": round((wd.get("temperature_max") or 0) * 0.6 + (od.get("temperature_max") or 0) * 0.4, 1),
                    "temperature_min": round((wd.get("temperature_min") or 0) * 0.6 + (od.get("temperature_min") or 0) * 0.4, 1),
                    "precipitation_probability": max(wd.get("precipitation_probability") or 0, od.get("precipitation_probability") or 0),
                    "wind_speed": round((wd.get("wind_speed") or 0) * 0.5 + (od.get("wind_speed") or 0) * 0.5, 1),
                    "uv_index": round((wd.get("uv_index") or 0) * 0.5 + (od.get("uv_index") or 0) * 0.5, 1),
                })
            elif wd:
                blended_daily.append(wd)
            elif od:
                blended_daily.append(od)

        return {
            "current": blended_current,
            "hourly": blended_hourly,
            "daily": blended_daily,
            "historical_hourly": wa.get("historical_hourly", []),
            "location": wa.get("location", om.get("location", {})),
            "generated_at": now.isoformat(),
        }

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
        blended_key = f"blended:{lat:.2f}:{lon:.2f}:days={days}"
        blended = get_cache(blended_key)
        if blended:
            if not blended.get("historical_hourly"):
                hist_cache_key = f"openmeteo_hist:{lat:.2f}:{lon:.2f}"
                hist = get_cache(hist_cache_key)
                if hist:
                    blended["historical_hourly"] = hist
                    set_cache(blended_key, blended, expire=1800)
                else:
                    _ = asyncio.create_task(self._fetch_and_merge_historical(lat, lon))
            return blended

        cache_key = f"forecast:{lat:.2f}:{lon:.2f}:days={days}"
        wa_task = self._get_or_fetch(cache_key, lat, lon, days, cache_expire=1800)
        om_task = self._fetch_openmeteo_forecast(lat, lon, days)
        wa_result, om_raw = await asyncio.gather(wa_task, om_task, return_exceptions=True)

        if isinstance(wa_result, Exception):
            print(f"WeatherAPI fetch failed: {wa_result}")
            wa_result = None
        if isinstance(om_raw, Exception):
            print(f"Open-Meteo fetch failed: {om_raw}")
            om_raw = None

        result = None
        if wa_result and om_raw:
            om_parsed = self._parse_openmeteo_response(om_raw, days)
            result = self._blend_forecasts(wa_result, om_parsed, lat, lon)
        elif wa_result:
            result = wa_result
            for h in result.get("hourly", []):
                bias = get_bias(lat, lon, h["time"])
                if h.get("temperature") is not None:
                    h["temperature"] = round((h["temperature"] or 0) - bias, 1)
        elif om_raw:
            result = self._parse_openmeteo_response(om_raw, days)
            for h in result.get("hourly", []):
                bias = get_bias(lat, lon, h["time"])
                if h.get("temperature") is not None:
                    h["temperature"] = round((h["temperature"] or 0) - bias, 1)

        if result:
            set_cache(blended_key, result, expire=1800)
            if not result.get("historical_hourly"):
                hist_cache_key = f"openmeteo_hist:{lat:.2f}:{lon:.2f}"
                hist = get_cache(hist_cache_key)
                if hist:
                    result["historical_hourly"] = hist
                else:
                    _ = asyncio.create_task(self._fetch_and_merge_historical(lat, lon))
            return result

        return None

    async def _fetch_and_merge_historical(self, lat: float, lon: float) -> Optional[list]:
        cache_key = f"openmeteo_hist:{lat:.2f}:{lon:.2f}"
        cached = get_cache(cache_key)
        if cached is not None:
            return cached

        today = date.today()
        start = today - timedelta(days=8)
        end = today - timedelta(days=1)
        params = {
            "latitude": str(lat), "longitude": str(lon),
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "hourly": "temperature_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m,pressure_msl",
            "timezone": "auto",
        }

        try:
            async with httpx.AsyncClient(timeout=10) as client:
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

        by_hour: dict[str, list[dict]] = {}
        for i in range(len(times)):
            time_str = times[i]
            try:
                dt = datetime.strptime(time_str, "%Y-%m-%dT%H:%M") if "T" in str(time_str) else datetime.fromisoformat(str(time_str))
                fmt_time = dt.strftime("%H:%M")
            except (ValueError, TypeError):
                fmt_time = str(time_str)[-5:] if len(str(time_str)) >= 5 else str(time_str)

            code = hourly.get("weather_code", [0])[i] if i < len(hourly.get("weather_code", [])) else 0
            precip = hourly.get("precipitation", [0])[i] if i < len(hourly.get("precipitation", [])) else 0

            by_hour.setdefault(fmt_time, []).append({
                "temperature": hourly.get("temperature_2m", [])[i] if i < len(hourly.get("temperature_2m", [])) else None,
                "precipitation": precip,
                "weather_code": code,
                "wind_speed": hourly.get("wind_speed_10m", [])[i] if i < len(hourly.get("wind_speed_10m", [])) else None,
                "wind_direction": hourly.get("wind_direction_10m", [])[i] if i < len(hourly.get("wind_direction_10m", [])) else None,
                "humidity": hourly.get("relative_humidity_2m", [])[i] if i < len(hourly.get("relative_humidity_2m", [])) else None,
                "pressure": hourly.get("pressure_msl", [])[i] if i < len(hourly.get("pressure_msl", [])) else None,
                "uv_index": None,
            })

        rows = []
        for hour_key in sorted(by_hour.keys()):
            entries = by_hour[hour_key]
            vals = {k: [e[k] for e in entries if e[k] is not None] for k in entries[0].keys()}
            avg_temp = round(sum(vals["temperature"]) / len(vals["temperature"]), 1) if vals["temperature"] else None
            avg_hum = round(sum(vals["humidity"]) / len(vals["humidity"]), 1) if vals["humidity"] else None
            avg_wind = round(sum(vals["wind_speed"]) / len(vals["wind_speed"]), 1) if vals["wind_speed"] else None
            avg_precip = round(sum(vals["precipitation"]) / len(vals["precipitation"]), 2) if vals["precipitation"] else 0
            common_code = max(set(vals["weather_code"]), key=vals["weather_code"].count) if vals["weather_code"] else 0
            avg_dir = round(sum(vals["wind_direction"]) / len(vals["wind_direction"]), 1) if vals["wind_direction"] else None
            avg_press = round(sum(vals["pressure"]) / len(vals["pressure"]), 1) if vals["pressure"] else None

            rows.append({
                "time": hour_key,
                "iso_time": hour_key,
                "is_today": False,
                "temperature": avg_temp,
                "precipitation_probability": avg_precip,
                "weather_code": common_code,
                "condition": _wmo_condition(common_code),
                "icon": _wmo_icon(common_code),
                "wind_speed": avg_wind,
                "wind_direction": avg_dir,
                "uv_index": None,
                "humidity": avg_hum,
                "pressure": avg_press,
                "confidence": "",
            })

        set_cache(cache_key, rows, expire=3600)

        # Merge historical into the blended forecast cache
        blended_key = f"blended:{lat:.2f}:{lon:.2f}:days=7"
        blended = get_cache(blended_key)
        if blended:
            blended["historical_hourly"] = rows
            set_cache(blended_key, blended, expire=1800)

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
