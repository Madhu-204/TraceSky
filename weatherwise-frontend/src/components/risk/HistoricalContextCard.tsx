import React from 'react';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import type { HistoricalComparisonData } from '../../types/riskMonitor.types';
import { useUnitSystem } from '../../utils/unitConversion';

interface HistoricalContextCardProps {
  historical: HistoricalComparisonData | null;
  deltaFacts: Record<string, { name: string; value: number | string; certainty: number }>;
}

export const HistoricalContextCard: React.FC<HistoricalContextCardProps> = ({ historical, deltaFacts }) => {
  const { temp, wind } = useUnitSystem();

  if (!historical) {
    return (
      <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5">
        <p className="text-xs text-gray-500">No historical comparison available</p>
      </div>
    );
  }

  const tempDelta = deltaFacts['temp_delta_24h'];
  const windDelta = deltaFacts['wind_delta_24h'];
  const yesterdayTemp = deltaFacts['yesterday_avg_temp'];

  const metrics = historical.metrics;
  const hasHistorical = metrics.temperature.historical !== null && metrics.temperature.historical !== undefined;

  return (
    <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-2">
          <Calendar size={14} className="text-emerald-400" />
          Historical Context
        </h3>
        <span className="text-[9px] font-mono text-gray-500">Yesterday vs Today</span>
      </div>

      {tempDelta && (
        <div className="bg-[#0A0E22] border border-[#161D3A] rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-medium">Temperature Δ</span>
            <div className="flex items-center gap-1">
              {typeof tempDelta.value === 'number' && tempDelta.value > 0
                ? <TrendingUp size={12} className="text-rose-400" />
                : <TrendingDown size={12} className="text-blue-400" />
              }
              <span className={`text-xs font-bold font-mono ${typeof tempDelta.value === 'number' && tempDelta.value > 0 ? 'text-rose-400' : 'text-blue-400'}`}>
                {typeof tempDelta.value === 'number' ? (tempDelta.value > 0 ? '+' : '') : ''}{String(tempDelta.value)}{temp(0).unit}
              </span>
            </div>
          </div>
          {yesterdayTemp && (
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>Yesterday avg: {temp(typeof yesterdayTemp.value === 'number' ? yesterdayTemp.value : 0).value}{temp(0).unit}</span>
              <span>Confidence: {Math.round(tempDelta.certainty * 100)}%</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Wind Δ', value: windDelta, unit: wind(0).unit },
          { label: 'Temp Δ', value: tempDelta, unit: temp(0).unit },
          { label: 'Temp YoY', value: null, unit: temp(0).unit, custom: metrics.temperature, hasHistorical },
        ].map((item: any) => (
          <div key={item.label} className="bg-[#0A0E22] border border-[#161D3A] rounded-lg p-2.5 space-y-1">
            <p className="text-[9px] text-gray-500 font-medium">{item.label}</p>
            {item.custom ? (
              <>
                <p className="text-xs font-bold text-white font-mono">
                  {temp(item.custom.current).value}{temp(0).unit}
                </p>
                {item.hasHistorical ? (
                  <p className="text-[9px] text-gray-500 font-mono">
                    vs {temp(item.custom.historical!).value}{temp(0).unit}
                  </p>
                ) : (
                  <p className="text-[9px] text-gray-500 font-mono italic">No historical data</p>
                )}
              </>
            ) : item.value ? (
              <>
                <p className={`text-xs font-bold font-mono ${typeof item.value.value === 'number' && item.value.value > 0 ? 'text-rose-400' : 'text-blue-400'}`}>
                  {typeof item.value.value === 'number' ? (item.value.value > 0 ? '+' : '') : ''}{String(item.value.value)}{item.unit}
                </p>
                {item.value.certainty && (
                  <p className="text-[9px] text-gray-500 font-mono">{Math.round(item.value.certainty * 100)}% conf</p>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-500">--</p>
            )}
          </div>
        ))}
      </div>

      <p className="text-[10px] text-gray-400 leading-relaxed border-t border-[#161D3A] pt-3">{historical.summary}</p>
    </div>
  );
};
