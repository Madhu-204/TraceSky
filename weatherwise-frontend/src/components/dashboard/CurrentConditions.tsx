import React from 'react';
import { MapPin, Droplets, Wind, Sun, Cloud, CloudRain, CloudLightning, CloudSun, CloudFog, Shield } from 'lucide-react';
import type { CurrentWeather, HourlyForecast } from '../../services/weatherService';
import type { DataSourceInfo, ForecastValidation } from '../../types/expert.types';

interface CurrentConditionsProps {
  cityName: string;
  current: CurrentWeather | null;
  hourly: HourlyForecast[];
  dataSource?: DataSourceInfo;
  isLoading: boolean;
  forecastValidation?: ForecastValidation | null;
}

const iconMap: Record<string, React.ReactNode> = {
  sunny: <Sun size={48} className="text-yellow-400" />,
  cloudy: <Cloud size={48} className="text-gray-400" />,
  overcast: <Cloud size={48} className="text-slate-400" />,
  rain: <CloudRain size={48} className="text-cyan-400" />,
  storm: <CloudLightning size={48} className="text-yellow-500" />,
  snow: <CloudFog size={48} className="text-blue-200" />,
  fog: <CloudFog size={48} className="text-gray-400" />,
  drizzle: <CloudRain size={48} className="text-cyan-300" />,
};

const smallIconMap: Record<string, React.ReactNode> = {
  sunny: <Sun size={14} className="text-yellow-400" />,
  cloudy: <Cloud size={14} className="text-gray-400" />,
  overcast: <Cloud size={14} className="text-slate-400" />,
  rain: <CloudRain size={14} className="text-cyan-400" />,
  storm: <CloudLightning size={14} className="text-yellow-500" />,
  snow: <CloudFog size={14} className="text-blue-200" />,
  fog: <CloudFog size={14} className="text-gray-400" />,
  drizzle: <CloudRain size={14} className="text-cyan-300" />,
};

function windDirectionLabel(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

export const CurrentConditions: React.FC<CurrentConditionsProps> = ({ cityName, current, hourly, dataSource, isLoading, forecastValidation }) => {
  if (isLoading || !current) {
    return (
      <div className="bg-[#0E1328] border border-[#1C2345] p-6 sm:p-8 rounded-3xl grid grid-cols-1 xl:grid-cols-12 gap-6 relative overflow-hidden shadow-xl min-h-[200px] flex items-center justify-center">
        <p className="text-gray-500 text-sm font-medium">{isLoading ? 'Loading telemetry...' : 'No data available'}</p>
      </div>
    );
  }

  const now = new Date();
  const currentHour = now.getHours();
  const nextHours = hourly
    .filter((h) => {
      const hour = parseInt(h.time.split(":")[0], 10);
      return h.is_today ? hour > currentHour : true;
    })
    .slice(0, 5);

  const validatedByHour: Record<string, { historical_temp: number; status: string; confidence: number; temp_deviation?: number; forecast_rate?: number | null; historical_rate?: number | null; rate_deviation?: number | null }> = {};
  if (forecastValidation) {
    for (const vh of forecastValidation.validated_hours) {
      validatedByHour[String(parseInt(vh.hour, 10))] = vh;
    }
  }

  const overallStatus = forecastValidation?.overall_status;
  const avgConfidence = forecastValidation?.average_confidence;
  const baselineAnchor = forecastValidation?.baseline_anchor;

  const confidenceColor: Record<string, string> = {
    HIGH: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    LOW: 'text-red-400 bg-red-500/10 border-red-500/20',
    NONE: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
  };

  const anchorColor: Record<string, string> = {
    HIGH: 'text-emerald-400',
    MEDIUM: 'text-amber-400',
    LOW: 'text-red-400',
  };

  return (
    <div className="bg-[#0E1328] border border-[#1C2345] p-6 sm:p-8 rounded-3xl grid grid-cols-1 xl:grid-cols-12 gap-6 relative overflow-hidden shadow-xl">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />

      <div className="xl:col-span-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[11px] tracking-widest uppercase">
            <MapPin size={12} className="text-blue-500" /> {cityName}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {overallStatus && avgConfidence != null && (
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 border ${confidenceColor[overallStatus] || confidenceColor.NONE}`}>
                <Shield size={10} />
                {overallStatus === 'HIGH' ? 'High Confidence' : overallStatus === 'MEDIUM' ? 'Med Confidence' : 'Low Confidence'}
              </span>
            )}
            {baselineAnchor?.anchor_confidence && (
              <span className={`text-[9px] font-bold flex items-center gap-1 ${anchorColor[baselineAnchor.anchor_confidence] || 'text-gray-500'}`}>
                {baselineAnchor.anchor_confidence === 'HIGH' ? '✓' : baselineAnchor.anchor_confidence === 'MEDIUM' ? '~' : '!'} Anchor: {baselineAnchor.current_temperature != null ? `${Math.round(baselineAnchor.current_temperature)}°C` : '--'}
              </span>
            )}
            {dataSource && (
              <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <span className="w-1 h-1 bg-blue-400 rounded-full" /> Source: {dataSource.provider}
              </span>
            )}
          </div>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-[1.15] max-w-2xl">
          {current.condition}
        </h2>

        <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-2">
          <div className="flex items-baseline">
            <span className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tighter">
              {Math.round(current.temperature)}
            </span>
            <span className="text-2xl font-light text-blue-400 ml-0.5">°C</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-2 text-[10px] font-mono">
              <span className="bg-[#121836] border border-[#1F2954] text-gray-300 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <Droplets size={11} className="text-blue-400" /> Humidity: {Math.round(current.humidity)}%
              </span>
              <span className="bg-[#121836] border border-[#1F2954] text-gray-300 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <Wind size={11} className="text-cyan-400" /> Wind: {Math.round(current.wind_speed)}km/h {windDirectionLabel(current.wind_direction)}
              </span>
              <span className="bg-[#121836] border border-[#1F2954] text-gray-300 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <Sun size={11} className="text-amber-400" /> UV Index: {Math.round(current.uv_index)}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium pl-0.5">
              {current.condition} • Feels like {Math.round(current.feels_like)}°
            </p>
          </div>
        </div>
      </div>

      <div className="xl:col-span-4 flex flex-col justify-between items-end gap-4 border-t xl:border-t-0 xl:border-l border-[#1C2345] pt-4 xl:pt-0 xl:pl-6">
        <div className="relative w-24 h-14 hidden xl:block">
          <div className="absolute top-0 right-2 w-16 h-16 bg-cyan-400/20 rounded-full blur-xl" />
          {iconMap[current.icon] || <Cloud size={48} className="absolute right-0 text-gray-400" />}
        </div>

        <div className="w-full bg-[#111630] border border-[#1D254C] rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold text-gray-500 tracking-wider uppercase">Next 5 Hours</p>
            <span className="text-[8px] text-gray-600 font-mono">Hourly Forecast</span>
          </div>
          <div className="grid grid-cols-5 gap-2 text-center">
            {nextHours.length === 0 && (
              <div className="col-span-5 text-[10px] text-gray-500 py-2">No upcoming hourly data</div>
            )}
            {nextHours.map((h, i) => {
              const isNextDay = !h.is_today && i > 0 && nextHours[i - 1]?.is_today;
              const hourNum = parseInt(h.time.split(":")[0], 10);
              const validation = validatedByHour[String(hourNum)];
              const statusColor = validation?.status === 'HIGH' ? 'text-emerald-400' : validation?.status === 'MEDIUM' ? 'text-amber-400' : 'text-red-400';
              const statusDot = validation?.status === 'HIGH' ? 'bg-emerald-400' : validation?.status === 'MEDIUM' ? 'bg-amber-400' : 'bg-red-400';
              const rateDir = validation?.forecast_rate != null && validation.historical_rate != null
                ? (validation.forecast_rate > validation.historical_rate ? '↗' : validation.forecast_rate < validation.historical_rate ? '↘' : '→')
                : null;
              return (
                <div key={i} className="bg-[#0E1328]/50 py-2 px-1 rounded-xl border border-[#1A213D] relative flex flex-col items-center gap-1.5">
                  {isNextDay && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[7px] text-amber-500 font-bold bg-[#0E1328] px-1.5 rounded">
                      TMR
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <p className="text-[10px] text-gray-500 font-mono font-bold">{h.time}</p>
                    {validation && <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{smallIconMap[h.icon] || <Cloud size={14} className="text-gray-400" />}</span>
                    <p className="text-sm font-bold text-white font-mono tracking-tight">
                      {h.temperature != null ? `${Math.round(h.temperature)}°` : '--'}
                    </p>
                  </div>
                  {validation && (
                    <div className="flex items-center gap-1 text-[8px] text-gray-600 font-mono">
                      <span>Ytd {Math.round(validation.historical_temp)}°</span>
                      {rateDir && <span className={statusColor}>{rateDir}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
