import { create } from 'zustand';
import type { CurrentWeather, ForecastData, HistoricalData, HourlyForecast, DailyForecast } from '../services/weatherService';
import * as weatherService from '../services/weatherService';

interface WeatherState {
  current: CurrentWeather | null;
  forecast: ForecastData | null;
  historical: HistoricalData | null;
  isLoading: boolean;
  error: string | null;

  fetchCurrent: (lat: number, lon: number) => Promise<void>;
  fetchForecast: (lat: number, lon: number, days?: number) => Promise<void>;
  fetchHistorical: (lat: number, lon: number, startDate: string, endDate: string) => Promise<void>;
  clearError: () => void;
}

export const useWeatherStore = create<WeatherState>((set) => ({
  current: null,
  forecast: null,
  historical: null,
  isLoading: false,
  error: null,

  fetchCurrent: async (lat, lon) => {
    set({ isLoading: true, error: null });
    try {
      const data = await weatherService.getCurrentWeather(lat, lon);
      set({ current: data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch weather', isLoading: false });
    }
  },

  fetchForecast: async (lat, lon, days = 7) => {
    set({ isLoading: true, error: null });
    try {
      const data = await weatherService.getForecast(lat, lon, days);
      set({ forecast: data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch forecast', isLoading: false });
    }
  },

  fetchHistorical: async (lat, lon, startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const data = await weatherService.getHistorical(lat, lon, startDate, endDate);
      set({ historical: data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch historical data', isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
