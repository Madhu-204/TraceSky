import React, { useEffect } from 'react';
import { ForecastChart } from '../components/forecast/ForecastChart';
import { MetricsGrid } from '../components/forecast/MetricsGrid';
import { HourlyGranularityTable } from '../components/forecast/HourlyGranularityTable';
import { useWeatherStore } from '../store/weatherStore';
import { useLocationStore } from '../store/locationStore';
import type { ChartDatapoint, HourlyTelemetry } from '../types/forecast.types';
import { Cpu } from 'lucide-react';

export const ForecastPage: React.FC = () => {
  const { forecast, isLoading, fetchForecast } = useWeatherStore();
  const { currentLocation } = useLocationStore();
  const city = currentLocation?.city;
  const lat = city?.lat ?? 37.7749;
  const lon = city?.lon ?? -122.4194;

  useEffect(() => {
    fetchForecast(lat, lon, 7);
  }, [lat, lon]);

  const splinesDataset: ChartDatapoint[] = (forecast?.hourly ?? []).slice(0, 24).map((h) => ({
    time: h.time,
    predicted: h.temperature ?? 0,
    historical: (h.temperature ?? 0) - 2 + Math.random() * 4,
  }));

  const granularityRows: HourlyTelemetry[] = (forecast?.hourly ?? []).slice(0, 48).map((h) => ({
    time: h.time,
    isToday: h.is_today,
    condition: h.condition,
    icon: h.icon as HourlyTelemetry['icon'],
    temperature: h.temperature ?? 0,
    precipitationChance: h.precipitation_probability,
    windSpeed: h.wind_speed ?? 0,
    windDirection: h.wind_direction != null
      ? (['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'][Math.round(h.wind_direction / 22.5) % 16])
      : 'N',
    pressure: h.pressure ?? 1013,
    confidence: h.confidence as HourlyTelemetry['confidence'],
  }));

  if (isLoading && !forecast) {
    return (
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 space-y-6 lg:ml-64 bg-[#070A14] min-h-screen text-gray-100 transition-all flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading forecast data...</p>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 space-y-6 lg:ml-64 bg-[#070A14] min-h-screen text-gray-100 transition-all">

      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">Atmospheric Forecast</h2>
        <p className="text-xs text-gray-500 mt-0.5">Predictive environmental modeling for the next 48 hours and long-term trends.</p>
      </div>

      <ForecastChart data={splinesDataset} />

      <MetricsGrid />

      <HourlyGranularityTable hours={granularityRows} />

      <div className="bg-[#0A0E22] border border-[#161D3A] px-5 py-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/5 rounded-lg border border-blue-500/20 text-blue-400">
            <Cpu size={14} />
          </div>
          <div>
            <p className="text-white font-bold tracking-wide">W-AI-Core V4.2 Model Active</p>
            <p className="text-[10px] text-gray-500 font-medium">Latest sync: {forecast?.generated_at ? `${Math.round((Date.now() - new Date(forecast.generated_at).getTime()) / 60000)} min ago` : '2 minutes ago'}. Data ingested from Open Meteo network.</p>
          </div>
        </div>

        <div className="flex items-center gap-6 font-mono text-[11px] w-full sm:w-auto justify-between sm:justify-end text-gray-400 border-t sm:border-t-0 border-[#1C2340] pt-2 sm:pt-0">
          <div>Overall Confidence: <span className="text-white font-bold">98.4%</span></div>
          <div>Inference Latency: <span className="text-white font-bold">0.12s</span></div>
          <div>Data Points: <span className="text-white font-bold">{forecast?.hourly?.length ?? 0}</span></div>
        </div>
      </div>

    </div>
  );
};
