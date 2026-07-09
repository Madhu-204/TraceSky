import React, { useState } from 'react';
import type { SensorFact } from '../../types/expert.types';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';

interface RiskDerivedFactsProps {
  derivedFacts: SensorFact[];
}

const factDescriptionMap: Record<string, string> = {
  max_wind_24h: 'Max wind speed (24h forecast)',
  max_wind_48h: 'Max wind speed (48h forecast)',
  gust_estimate: 'Estimated gust speed',
  precip_prob: 'Max precipitation probability',
  precip_sum_3d: '3-day precipitation total',
  precip_sum_5d: '5-day precipitation total',
  max_temp_7d: '7-day max temperature',
  max_temp_3d: '3-day max temperature',
  rain_days_3d: 'Rain days (next 3)',
  rain_days_5d: 'Rain days (next 5)',
  sunny_hours_today: 'Sunny hours today',
  sunny_hours_48h: 'Sunny hours (48h)',
  temp_delta_24h: 'Temp change vs yesterday',
  wind_delta_24h: 'Wind change vs yesterday',
  precip_delta_24h: 'Precip change vs yesterday',
  humidity_delta_24h: 'Humidity change vs yesterday',
  yesterday_avg_temp: "Yesterday's avg temperature",
  yesterday_avg_wind: "Yesterday's avg wind speed",
};

export const RiskDerivedFacts: React.FC<RiskDerivedFactsProps> = ({ derivedFacts }) => {
  const [expanded, setExpanded] = useState(false);

  if (!derivedFacts.length) {
    return (
      <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5">
        <p className="text-xs text-gray-500">No derived data available</p>
      </div>
    );
  }

  const visible = expanded ? derivedFacts : derivedFacts.slice(0, 6);

  return (
    <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-2">
          <Brain size={14} className="text-purple-400" />
          Computed Parameters
        </h3>
        <span className="text-[9px] font-mono text-gray-500">{derivedFacts.length} derived</span>
      </div>

      <div className="space-y-1">
        {visible.map((fact) => {
          const desc = factDescriptionMap[fact.name] || fact.name.replace(/_/g, ' ');
          const displayValue = typeof fact.value === 'number'
            ? (Number.isInteger(fact.value) ? fact.value.toString() : fact.value.toFixed(1))
            : String(fact.value);
          const unit = fact.name.includes('temp') ? '°C'
            : fact.name.includes('wind') || fact.name.includes('gust') ? 'km/h'
            : fact.name.includes('precip') || fact.name.includes('rain') ? 'mm'
            : fact.name.includes('humid') ? '%'
            : fact.name.includes('sunny') ? 'h'
            : '';

          return (
            <div key={fact.name} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[#0A0E22]/50 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] text-gray-400 font-medium truncate">{desc}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-mono font-bold ${
                  fact.name.endsWith('_delta_24h')
                    ? (typeof fact.value === 'number' && fact.value > 0 ? 'text-rose-400' : 'text-emerald-400')
                    : 'text-white'
                }`}>
                  {displayValue}{unit}
                </span>
                {fact.source === 'inferred' && (
                  <span className="text-[8px] font-mono text-amber-500 bg-amber-500/10 px-1 py-0.5 rounded">inferred</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {derivedFacts.length > 6 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-bold mx-auto"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Show less' : `Show all ${derivedFacts.length} parameters`}
        </button>
      )}
    </div>
  );
};
