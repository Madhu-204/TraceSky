import React from 'react';
import { Droplets, Wind, CloudFog } from 'lucide-react';
import type { DailyForecast, HourlyForecast } from '../../services/weatherService';
import type { ForecastValidation } from '../../types/expert.types';

interface MetricsGridProps {
  daily: DailyForecast[];
  hourly: HourlyForecast[];
  validation: ForecastValidation | null | undefined;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ daily, hourly, validation }) => {
  const hourlyToday = hourly.filter((h) => h.is_today);

  const avgTemp = hourlyToday.length > 0
    ? Math.round(hourlyToday.reduce((s, h) => s + (h.temperature ?? 0), 0) / hourlyToday.length)
    : 0;
  const avgHumidity = hourlyToday.length > 0
    ? Math.round(hourlyToday.reduce((s, h) => s + (h.humidity ?? 0), 0) / hourlyToday.length)
    : 0;
  const avgWind = hourlyToday.length > 0
    ? Math.round((hourlyToday.reduce((s, h) => s + (h.wind_speed ?? 0), 0) / hourlyToday.length) * 10) / 10
    : 0;

  const dailyPrecipProbs = daily.map((d) => d.precipitation_probability ?? 0);
  const maxPrecipProb = Math.max(...dailyPrecipProbs, 10);
  const rainfallBars = dailyPrecipProbs.length >= 7
    ? dailyPrecipProbs.slice(0, 7)
    : [12, 18, 32, 54, 42, 22, 10];

  const humidityLevel = avgHumidity;
  const humidityStatus = humidityLevel >= 70 ? 'High' : humidityLevel >= 40 ? 'Optimal' : 'Low';
  const humidityColor = humidityLevel >= 70 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : humidityLevel >= 40 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20';

  const windStatus = avgWind >= 30 ? 'Windy' : avgWind >= 15 ? 'Moderate' : 'Calm';
  const windColor = avgWind >= 30 ? 'text-red-400' : avgWind >= 15 ? 'text-amber-400' : 'text-emerald-400';

  const avgConfidence = validation?.average_confidence ?? 0;
  const overallStatus = validation?.overall_status ?? 'NONE';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 flex flex-col justify-between min-h-[180px]">
        <div className="flex justify-between items-start">
          <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Rainfall Probability</p>
          <Droplets size={14} className="text-blue-400" />
        </div>
        <div className="h-20 flex items-end justify-between gap-2 px-1 mt-4">
          {rainfallBars.map((bar, idx) => {
            const pct = Math.min(Math.round((bar / Math.max(maxPrecipProb, 1)) * 100), 100);
            return (
              <div key={idx} className="w-full bg-[#151B33] rounded-t-sm h-full flex items-end">
                <div
                  className={`w-full rounded-t-sm transition-all duration-300 ${idx === 0 ? 'bg-cyan-500' : 'bg-cyan-500/30'}`}
                  style={{ height: `${pct}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] text-gray-600 font-bold tracking-wider mt-2 px-0.5">
          {daily.slice(0, 7).map((d, i) => (
            <span key={i}>{d.day.slice(0, 3)}</span>
          ))}
        </div>
        {daily.length === 0 && (
          <p className="text-[10px] text-gray-500 italic mt-2 text-center">No data available</p>
        )}
      </div>

      <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 flex flex-col justify-between min-h-[180px]">
        <div className="flex justify-between items-start">
          <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Humidity Index</p>
          <CloudFog size={14} className="text-slate-400" />
        </div>
        <div className="h-14 flex items-center justify-center relative my-auto">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 40">
            <path d="M 0 20 Q 50 5, 100 20 T 200 20" fill="none" stroke="#2563EB" strokeWidth={2} />
            <circle cx="120" cy="15" r="3" fill="#60A5FA" className="animate-pulse" />
          </svg>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-lg font-black text-white font-mono">{humidityLevel}% <span className="text-xs font-normal text-gray-500">avg</span></span>
          <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase border ${humidityColor}`}>
            {humidityStatus}
          </span>
        </div>
      </div>

      <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 flex flex-col justify-between min-h-[180px]">
        <div className="flex justify-between items-start">
          <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Wind Speed</p>
          <Wind size={14} className="text-amber-500" />
        </div>
        <div className="h-16 w-full relative mt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 50" preserveAspectRatio="none">
            <path d="M 0 45 Q 40 10, 100 35 T 200 20 L 200 50 L 0 50 Z" fill="rgba(245,158,11,0.06)" />
            <path d="M 0 45 Q 40 10, 100 35 T 200 20" fill="none" stroke="#F59E0B" strokeWidth={1.5} />
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <span className="text-2xl font-black font-mono tracking-tight text-white">{avgWind}</span>
            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider font-mono">km/h avg</p>
          </div>
        </div>
        <div className={`text-[10px] font-bold text-center mt-1 ${windColor}`}>
          {windStatus}
          {overallStatus !== 'NONE' && (
            <span className="ml-2 text-gray-600 font-mono">
              (CF: {Math.round(avgConfidence * 100)}%)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
