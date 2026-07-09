import httpx
from typing import Optional
from datetime import date, datetime

from app.cache import get_cache, set_cache

OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

WMO_CODES: dict[int, str] = {
    0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing Rime Fog",
    51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
    56: "Light Freezing Drizzle", 57: "Dense Freezing Drizzle",
    61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
    66: "Light Freezing Rain", 67: "Heavy Freezing Rain",
    71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow",
    77: "Snow Grains",
    80: "Slight Rain Showers", 81: "Moderate Rain Showers", 82: "Violent Rain Showers",
    85: "Slight Snow Showers", 86: "Heavy Snow Showers",
    95: "Thunderstorm", 96: "Thunderstorm with Slight Hail", 99: "Thunderstorm with Heavy Hail",
}

CURRENT_PARAMS = "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,uv_index"
HOURLY_PARAMS = "temperature_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,uv_index,relative_humidity_2m,pressure_msl"
DAILY_PARAMS = "temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,weather_code,wind_speed_10m_max,uv_index_max,sunrise,sunset"


def map_weather_code(code: int) -> str:
    return WMO_CODES.get(code, "Unknown")


def map_weather_icon(code: int) -> str:
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


def map_confidence(precipitation_probability: float) -> str:
    if precipitation_probability < 30:
        return "HIGH"
    elif precipitation_probability < 70:
        return "MEDIUM"
    return "LOW"


class WeatherService:

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=15.0)

    async def close(self):
        await self.client.aclose()

    async def get_current_weather(self, lat: float, lon: float) -> Optional[dict]:
        cache_key = f"weather:current:{lat:.2f}:{lon:.2f}"
        cached = get_cache(cache_key)
        if cached:
            return cached

        try:
            resp = await self.client.get(OPEN_METEO_FORECAST_URL, params={
                "latitude": lat, "longitude": lon,
                "current": CURRENT_PARAMS,
                "timezone": "auto",
            })
            if resp.status_code != 200:
                return None

            data = resp.json().get("current", {})
            result = {
                "temperature": data.get("temperature_2m"),
                "feels_like": data.get("apparent_temperature"),
                "humidity": data.get("relative_humidity_2m"),
                "wind_speed": data.get("wind_speed_10m"),
                "wind_direction": data.get("wind_direction_10m"),
                "uv_index": data.get("uv_index"),
                "precipitation": data.get("precipitation"),
                "condition": map_weather_code(data.get("weather_code", 0)),
                "icon": map_weather_icon(data.get("weather_code", 0)),
                "weather_code": data.get("weather_code"),
            }
            set_cache(cache_key, result, expire=300)
            return result
        except Exception as e:
            print(f"Weather fetch error: {e}")
            return None

    async def get_forecast(self, lat: float, lon: float, days: int = 7) -> Optional[dict]:
        cache_key = f"weather:forecast:{lat:.2f}:{lon:.2f}:{days}"
        cached = get_cache(cache_key)
        if cached:
            return cached

        try:
            resp = await self.client.get(OPEN_METEO_FORECAST_URL, params={
                "latitude": lat, "longitude": lon,
                "current": CURRENT_PARAMS,
                "hourly": HOURLY_PARAMS,
                "daily": DAILY_PARAMS,
                "timezone": "auto",
                "forecast_days": days,
            })
            if resp.status_code != 200:
                return None

            raw = resp.json()
            result = self._build_forecast_response(raw)
            set_cache(cache_key, result, expire=1800)
            return result
        except Exception as e:
            print(f"Forecast fetch error: {e}")
            return None

    async def get_historical(self, lat: float, lon: float, start_date: date, end_date: date) -> Optional[dict]:
        cache_key = f"weather:historical:{lat:.2f}:{lon:.2f}:{start_date}:{end_date}"
        cached = get_cache(cache_key)
        if cached:
            return cached

        try:
            resp = await self.client.get(OPEN_METEO_ARCHIVE_URL, params={
                "latitude": lat, "longitude": lon,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "daily": "temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,precipitation_hours,wind_speed_10m_max,uv_index_max,sunshine_hours",
                "timezone": "auto",
            })
            if resp.status_code != 200:
                return None

            data = resp.json().get("daily", {})
            result = {
                "dates": data.get("time", []),
                "temperature_max": data.get("temperature_2m_max", []),
                "temperature_min": data.get("temperature_2m_min", []),
                "temperature_mean": data.get("temperature_2m_mean", []),
                "precipitation_sum": data.get("precipitation_sum", []),
                "precipitation_hours": data.get("precipitation_hours", []),
                "wind_speed_max": data.get("wind_speed_10m_max", []),
                "uv_index_max": data.get("uv_index_max", []),
                "sunshine_hours": data.get("sunshine_hours", []),
            }
            set_cache(cache_key, result, expire=3600)
            return result
        except Exception as e:
            print(f"Historical fetch error: {e}")
            return None

    def _build_forecast_response(self, raw: dict) -> dict:
        current = raw.get("current", {})
        hourly = raw.get("hourly", {})
        daily = raw.get("daily", {})

        now = datetime.now()

        current_weather = {
            "temperature": current.get("temperature_2m"),
            "feels_like": current.get("apparent_temperature"),
            "humidity": current.get("relative_humidity_2m"),
            "wind_speed": current.get("wind_speed_10m"),
            "wind_direction": current.get("wind_direction_10m"),
            "uv_index": current.get("uv_index"),
            "precipitation": current.get("precipitation"),
            "condition": map_weather_code(current.get("weather_code", 0)),
            "icon": map_weather_icon(current.get("weather_code", 0)),
        }

        hourly_rows = []
        times = hourly.get("time", [])
        for i in range(len(times)):
            code = hourly.get("weather_code", [0])[i] if i < len(hourly.get("weather_code", [])) else 0
            precip = hourly.get("precipitation_probability", [0])[i] if i < len(hourly.get("precipitation_probability", [])) else 0
            time_str = times[i]
            dt = datetime.fromisoformat(time_str) if isinstance(time_str, str) else now
            hourly_rows.append({
                "time": dt.strftime("%H:%M") if isinstance(dt, datetime) else time_str,
                "iso_time": time_str,
                "is_today": dt.date() == now.date() if isinstance(dt, datetime) else True,
                "temperature": hourly.get("temperature_2m", [])[i] if i < len(hourly.get("temperature_2m", [])) else None,
                "precipitation_probability": precip,
                "weather_code": code,
                "condition": map_weather_code(code),
                "icon": map_weather_icon(code),
                "wind_speed": hourly.get("wind_speed_10m", [])[i] if i < len(hourly.get("wind_speed_10m", [])) else None,
                "wind_direction": hourly.get("wind_direction_10m", [])[i] if i < len(hourly.get("wind_direction_10m", [])) else None,
                "uv_index": hourly.get("uv_index", [])[i] if i < len(hourly.get("uv_index", [])) else None,
                "humidity": hourly.get("relative_humidity_2m", [])[i] if i < len(hourly.get("relative_humidity_2m", [])) else None,
                "pressure": hourly.get("pressure_msl", [])[i] if i < len(hourly.get("pressure_msl", [])) else None,
                "confidence": map_confidence(precip),
            })

        daily_rows = []
        day_times = daily.get("time", [])
        day_names = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
        for i in range(len(day_times)):
            code = daily.get("weather_code", [0])[i] if i < len(daily.get("weather_code", [])) else 0
            dt = datetime.fromisoformat(day_times[i]) if isinstance(day_times[i], str) else now
            daily_rows.append({
                "date": day_times[i],
                "day": day_names[dt.weekday()] if isinstance(dt, datetime) else day_times[i],
                "temperature_max": daily.get("temperature_2m_max", [])[i] if i < len(daily.get("temperature_2m_max", [])) else None,
                "temperature_min": daily.get("temperature_2m_min", [])[i] if i < len(daily.get("temperature_2m_min", [])) else None,
                "precipitation_probability": daily.get("precipitation_probability_max", [])[i] if i < len(daily.get("precipitation_probability_max", [])) else None,
                "precipitation_sum": daily.get("precipitation_sum", [])[i] if i < len(daily.get("precipitation_sum", [])) else None,
                "weather_code": code,
                "condition": map_weather_code(code),
                "icon": map_weather_icon(code),
                "wind_speed": daily.get("wind_speed_10m_max", [])[i] if i < len(daily.get("wind_speed_10m_max", [])) else None,
                "uv_index": daily.get("uv_index_max", [])[i] if i < len(daily.get("uv_index_max", [])) else None,
                "sunrise": daily.get("sunrise", [])[i] if i < len(daily.get("sunrise", [])) else None,
                "sunset": daily.get("sunset", [])[i] if i < len(daily.get("sunset", [])) else None,
            })

        return {
            "current": current_weather,
            "hourly": hourly_rows,
            "daily": daily_rows,
            "location": {
                "latitude": raw.get("latitude"),
                "longitude": raw.get("longitude"),
                "timezone": raw.get("timezone"),
            },
            "generated_at": now.isoformat(),
        }
