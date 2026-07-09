const API_BASE = 'http://localhost:8000/api/v1/weather';

export interface CurrentWeather {
  temperature: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  uv_index: number;
  precipitation: number;
  condition: string;
  icon: string;
  weather_code: number;
}

export interface HourlyForecast {
  time: string;
  iso_time: string;
  is_today: boolean;
  temperature: number | null;
  precipitation_probability: number;
  weather_code: number;
  condition: string;
  icon: string;
  wind_speed: number | null;
  wind_direction: number | null;
  uv_index: number | null;
  humidity: number | null;
  pressure: number | null;
  confidence: string;
}

export interface DailyForecast {
  date: string;
  day: string;
  temperature_max: number | null;
  temperature_min: number | null;
  precipitation_probability: number | null;
  precipitation_sum: number | null;
  weather_code: number;
  condition: string;
  icon: string;
  wind_speed: number | null;
  uv_index: number | null;
  sunrise: string | null;
  sunset: string | null;
}

export interface ForecastData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  location: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
  generated_at: string;
}

export interface HistoricalData {
  dates: string[];
  temperature_max: (number | null)[];
  temperature_min: (number | null)[];
  temperature_mean: (number | null)[];
  precipitation_sum: (number | null)[];
  precipitation_hours: (number | null)[];
  wind_speed_max: (number | null)[];
  uv_index_max: (number | null)[];
  sunshine_hours: (number | null)[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather> {
  const resp = await fetchJson<ApiResponse<CurrentWeather>>(
    `${API_BASE}/current?lat=${lat}&lon=${lon}`
  );
  return resp.data;
}

export async function getForecast(lat: number, lon: number, days = 7): Promise<ForecastData> {
  const resp = await fetchJson<ApiResponse<ForecastData>>(
    `${API_BASE}/forecast?lat=${lat}&lon=${lon}&days=${days}`
  );
  return resp.data;
}

export async function getHistorical(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
): Promise<HistoricalData> {
  const resp = await fetchJson<ApiResponse<HistoricalData>>(
    `${API_BASE}/historical?lat=${lat}&lon=${lon}&start_date=${startDate}&end_date=${endDate}`
  );
  return resp.data;
}
