import React, { useEffect, useState } from 'react';
import { ForecastChart } from '../components/forecast/ForecastChart';
import { MetricsGrid } from '../components/forecast/MetricsGrid';
import { HourlyGranularityTable } from '../components/forecast/HourlyGranularityTable';
import { ForecastExpertInsights } from '../components/forecast/ForecastExpertInsights';
import { useWeatherStore } from '../store/weatherStore';
import { useAIStore } from '../store/aiStore';
import { useLocationStore } from '../store/locationStore';
import type { ChartDatapoint, HourlyTelemetry } from '../types/forecast.types';
import { Cpu } from 'lucide-react';

const RANGE_HOURS: Record<string, number> = { '24H': 24, '7D': 168 };

const WIND_DIRECTIONS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

function windDirLabel(deg: number): string {
  return WIND_DIRECTIONS[Math.round(deg / 22.5) % 16];
}

export const ForecastPage: React.FC = () => {
  const { forecast, isLoading, fetchForecast } = useWeatherStore();
  const { expertAnalysis, isExpertLoading, fetchExpertAnalysis } = useAIStore();
  const { currentLocation } = useLocationStore();
  const city = currentLocation?.city;
  const lat = city?.lat ?? 37.7749;
  const lon = city?.lon ?? -122.4194;

  const [activeRange, setActiveRange] = useState('24H');

  useEffect(() => {
    fetchForecast(lat, lon, 7);
    fetchExpertAnalysis(lat, lon);
  }, [lat, lon]);

  const forecastValidation = expertAnalysis?.forecast_validation;
  const recommendations = expertAnalysis?.recommendations ?? [];
  const inferenceMetrics = expertAnalysis?.inference_metrics ?? null;

  const validatedByHour: Record<string, { forecast_temp: number; historical_temp: number; temp_deviation: number; humidity_deviation: number; wind_deviation: number; confidence: number; status: string }> = {};
  if (forecastValidation) {
    for (const vh of forecastValidation.validated_hours) {
      validatedByHour[vh.hour] = vh;
    }
  }

  const hourlyData = forecast?.hourly ?? [];
  const maxHours = Math.min(hourlyData.length, RANGE_HOURS[activeRange] ?? 168);

  const splinesDataset: ChartDatapoint[] = hourlyData.slice(0, maxHours).map((h) => {
    const hourKey = h.time.split(':')[0];
    const val = validatedByHour[hourKey];
    return {
      time: h.time,
      predicted: h.temperature ?? 0,
      historical: val?.historical_temp ?? (h.temperature ?? 0),
      confidence: val?.confidence,
      confidenceStatus: val?.status as 'HIGH' | 'MEDIUM' | 'LOW' | undefined,
      tempDeviation: val?.temp_deviation,
      humidityDeviation: val?.humidity_deviation,
      windDeviation: val?.wind_deviation,
      forecastRate: val?.forecast_rate,
      historicalRate: val?.historical_rate,
      rateDeviation: val?.rate_deviation,
    };
  });

  const granularityRows: HourlyTelemetry[] = hourlyData.map((h) => {
    const hourKey = h.time.split(':')[0];
    const val = validatedByHour[hourKey];
    return {
      time: h.time,
      isToday: h.is_today,
      condition: h.condition,
      icon: h.icon as HourlyTelemetry['icon'],
      temperature: h.temperature ?? 0,
      precipitationChance: h.precipitation_probability,
      windSpeed: h.wind_speed ?? 0,
      windDirection: h.wind_direction != null ? windDirLabel(h.wind_direction) : 'N',
      pressure: h.pressure ?? 1013,
      confidence: val ? (val.status as 'HIGH' | 'MEDIUM' | 'LOW') : (h.confidence as 'HIGH' | 'MEDIUM' | 'LOW'),
      historicalTemp: val?.historical_temp,
      tempDeviation: val?.temp_deviation,
      confidenceScore: val?.confidence,
    };
  });

  const handleRangeChange = (range: string) => {
    setActiveRange(range);
  };

  const avgConf = forecastValidation?.average_confidence ?? 0;
  const totalHoursAvailable = hourlyData.length;

  if (isLoading && !forecast) {
    return (
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 space-y-6 lg:ml-64 bg-[#070A14] min-h-screen text-gray-100 transition-all flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading forecast data...</p>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 space-y-6 lg:ml-64 bg-[#070A14] min-h-screen text-gray-100 transition-all">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Atmospheric Forecast</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Expert-validated 7-day forecast with historical cross-reference.
          </p>
        </div>
        {forecastValidation && (
          <span className={`text-[10px] font-black tracking-wider px-3 py-1.5 rounded-lg border uppercase flex items-center gap-1.5 ${
            forecastValidation.overall_status === 'HIGH' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
            forecastValidation.overall_status === 'MEDIUM' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
            'text-red-400 bg-red-500/10 border-red-500/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              forecastValidation.overall_status === 'HIGH' ? 'bg-emerald-400' :
              forecastValidation.overall_status === 'MEDIUM' ? 'bg-amber-400' : 'bg-red-400'
            }`} />
            {forecastValidation.overall_status} Confidence
          </span>
        )}
      </div>

      <ForecastChart
        data={splinesDataset}
        activeRange={activeRange}
        onRangeChange={handleRangeChange}
        averageConfidence={avgConf}
        averageDeviation={forecastValidation?.average_temp_deviation}
      />

      <MetricsGrid
        daily={forecast?.daily ?? []}
        hourly={hourlyData}
        validation={forecastValidation}
      />

      <HourlyGranularityTable
        hours={granularityRows}
        totalAvailable={totalHoursAvailable}
      />

      <ForecastExpertInsights
        validation={forecastValidation}
        recommendations={recommendations}
        metrics={inferenceMetrics}
        generatedAt={forecast?.generated_at ?? null}
      />

      <div className="bg-[#0A0E22] border border-[#161D3A] px-5 py-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/5 rounded-lg border border-blue-500/20 text-blue-400">
            <Cpu size={14} />
          </div>
          <div>
            <p className="text-white font-bold tracking-wide">WeatherWise Expert System V4</p>
            <p className="text-[10px] text-gray-500 font-medium">
              Latest sync: {forecast?.generated_at ? `${Math.round((Date.now() - new Date(forecast.generated_at).getTime()) / 60000)} min ago` : '--'}. Data ingested from Open Meteo network. Historical cross-validation active.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 font-mono text-[11px] w-full sm:w-auto justify-between sm:justify-end text-gray-400 border-t sm:border-t-0 border-[#1C2340] pt-2 sm:pt-0">
          <div>
            Forecast Confidence: <span className={`font-bold ${
              avgConf >= 0.7 ? 'text-emerald-400' : avgConf >= 0.4 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {Math.round(avgConf * 100)}%
            </span>
          </div>
          <div>
            Inference: <span className="text-white font-bold">
              {inferenceMetrics?.execution_time_ms != null ? `${inferenceMetrics.execution_time_ms}ms` : '--'}
            </span>
          </div>
          <div>
            Data Points: <span className="text-white font-bold">{hourlyData.length}</span>
          </div>
        </div>
      </div>

    </div>
  );
};
