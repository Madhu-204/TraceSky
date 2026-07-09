import React from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, CloudSun, CloudFog, Droplets, Wind, Shield } from 'lucide-react';
import type { DailyForecast } from '../../services/weatherService';
import type { DomainRuleTrace, InferenceMetrics } from '../../types/expert.types';
import { KnowledgeBasePanel } from './KnowledgeBasePanel';

interface BottomGridProps {
  daily: DailyForecast[];
  evaluatedByDomain?: Record<string, DomainRuleTrace[]>;
  inferenceMetrics?: InferenceMetrics | null;
}

const iconMap: Record<string, React.ReactNode> = {
  sunny: <Sun size={22} className="text-yellow-400" />,
  cloudy: <Cloud size={22} className="text-gray-400" />,
  overcast: <Cloud size={22} className="text-slate-400" />,
  rain: <CloudRain size={22} className="text-cyan-400" />,
  storm: <CloudLightning size={22} className="text-yellow-500" />,
  partly: <CloudSun size={22} className="text-blue-400" />,
  snow: <CloudFog size={22} className="text-blue-200" />,
  fog: <CloudFog size={22} className="text-gray-400" />,
  drizzle: <CloudRain size={22} className="text-cyan-300" />,
};

export const BottomGrid: React.FC<BottomGridProps> = ({ daily, evaluatedByDomain, inferenceMetrics }) => {
  const avgHigh = daily.length > 0
    ? Math.round(daily.reduce((s, d) => s + (d.temperature_max ?? 0), 0) / daily.length)
    : 0;
  const avgLow = daily.length > 0
    ? Math.round(daily.reduce((s, d) => s + (d.temperature_min ?? 0), 0) / daily.length)
    : 0;
  const maxPrecip = daily.length > 0
    ? Math.max(...daily.map((d) => d.precipitation_probability ?? 0))
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      <div className="lg:col-span-8 bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 flex flex-col min-h-[250px]">
        <div className="flex justify-between items-center mb-4">
          <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Extended 7-Day Matrix</p>
          <button className="text-[11px] text-blue-400 font-bold hover:underline transition-all flex items-center gap-1 uppercase tracking-wider">
            Detailed View &gt;
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 flex-1">
          {daily.length === 0 && (
            <p className="col-span-full text-center text-gray-500 text-xs py-8">No forecast data available</p>
          )}
          {daily.map((d, index) => (
            <div
              key={index}
              className={`py-3 px-2 rounded-2xl border flex flex-col items-center gap-1.5 relative ${
                index === 0
                  ? 'bg-[#121A3B] border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.05)]'
                  : 'bg-[#11162E]/40 border-[#1B2240]'
              }`}
            >
              {index === 0 && (
                <span className="absolute -top-2 bg-blue-500 text-white text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded uppercase">
                  Today
                </span>
              )}
              <p className="text-xs font-bold text-gray-400 tracking-wider">{d.day}</p>
              <span>{iconMap[d.icon] || <Cloud size={22} className="text-gray-400" />}</span>
              <p className="text-[11px] text-gray-500 font-medium leading-tight">{d.condition}</p>
              <div className="text-center font-mono">
                <p className="text-base font-bold text-white leading-tight">
                  {d.temperature_max != null ? `${Math.round(d.temperature_max)}°` : '--'}
                </p>
                <p className="text-xs text-gray-500 leading-tight">
                  {d.temperature_min != null ? `${Math.round(d.temperature_min)}°` : '--'}
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold text-blue-400 flex items-center gap-0.5">
                <Droplets size={11} className="text-blue-400" />
                {d.precipitation_probability != null ? `${d.precipitation_probability}%` : '--'}
              </span>
              {d.wind_speed != null && (
                <span className="text-[9px] text-gray-600 font-mono flex items-center gap-0.5">
                  <Wind size={9} /> {Math.round(d.wind_speed)}km/h
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-[#1C2340] pt-3 mt-3 flex items-center justify-center gap-8 text-xs text-gray-600 font-mono">
          <span>Week Avg: <span className="text-white font-bold">{avgHigh}°</span> / <span className="text-gray-400">{avgLow}°</span></span>
          <span className="w-px h-3 bg-gray-800" />
          <span>Max Precip: <span className="text-blue-400 font-bold">{maxPrecip}%</span></span>
          <span className="w-px h-3 bg-gray-800" />
          <span>Data: <span className="text-gray-400">{daily.length} days</span></span>
        </div>
      </div>

      {evaluatedByDomain && inferenceMetrics ? (
        <KnowledgeBasePanel
          evaluatedByDomain={evaluatedByDomain}
          metrics={inferenceMetrics}
        />
      ) : (
        <div className="lg:col-span-4 bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 flex flex-col justify-between min-h-[250px]">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Rule Evaluation</p>
              <span className="text-[9px] bg-gray-600/10 text-gray-500 px-2 py-0.5 rounded border border-gray-600/20 font-bold tracking-wide uppercase">
                Pending
              </span>
            </div>
            <p className="text-xs text-gray-500 italic leading-relaxed pl-3 border-l border-gray-600">
              Waiting for inference engine data...
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1C2340] flex items-center gap-2">
            <Shield size={14} className="text-gray-600" />
            <div>
              <p className="text-[11px] font-bold text-gray-500 font-mono">Certainty: --</p>
              <p className="text-[10px] text-gray-600">Data source: Open-Meteo API</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
