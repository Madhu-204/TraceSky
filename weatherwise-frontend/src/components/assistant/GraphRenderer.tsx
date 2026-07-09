import React from 'react';
import { Sprout, Sun } from 'lucide-react';
import type { GraphConfig, MetricItem } from '../../types/assistant.types';

interface GraphRendererProps {
  graph: GraphConfig;
  metrics?: Record<string, MetricItem>;
}

const colorMap: Record<string, string> = {
  red: 'text-red-400',
  amber: 'text-amber-400',
  emerald: 'text-emerald-400',
  green: 'text-emerald-400',
  blue: 'text-blue-400',
  cyan: 'text-cyan-400',
  gray: 'text-gray-400',
};

function RiskGauge({ value = 0, severity, title }: { value: number; severity?: string; title: string }) {
  const clamped = Math.min(value, 100);
  const color = clamped > 70 ? 'stroke-red-500' : clamped > 40 ? 'stroke-amber-500' : 'stroke-emerald-500';
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{title}</span>
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#1C2345" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="40"
            fill="none" stroke="currentColor"
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black text-white font-mono">{clamped}%</span>
        </div>
      </div>
      {severity && (
        <span className={`text-[10px] font-black uppercase tracking-wider ${severity === 'High' ? 'text-red-400' : severity === 'Moderate' ? 'text-amber-400' : 'text-emerald-400'}`}>
          {severity}
        </span>
      )}
    </div>
  );
}

function ComparisonBars({ datasets }: { datasets: GraphConfig['datasets'] }) {
  if (!datasets || datasets.length === 0) return null;
  const maxVal = Math.max(...datasets.flatMap((d) => [d.current, d.historical]), 1);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {datasets.map((d, i) => (
          <div key={i} className="bg-[#0A0D1F] border border-[#1B2244] rounded-xl p-3">
            <p className="text-[9px] font-bold text-gray-500 mb-2 truncate">{d.label}</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-blue-400 font-mono font-bold">Now</span>
                <span className="text-white font-mono font-bold">{d.current}</span>
              </div>
              <div className="w-full h-1.5 bg-[#151B33] rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(d.current / maxVal) * 100}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500 font-mono">Last Yr</span>
                <span className="text-gray-400 font-mono">{d.historical}</span>
              </div>
              <div className="w-full h-1.5 bg-[#151B33] rounded-full overflow-hidden">
                <div className="h-full bg-gray-600 rounded-full" style={{ width: `${(d.historical / maxVal) * 100}%` }} />
              </div>
              <span className={`text-[9px] font-mono ${d.change_pct > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {d.change_pct > 0 ? '+' : ''}{d.change_pct}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ForecastLine({ graph }: { graph: GraphConfig }) {
  const labels = graph.labels || [];
  const highs = graph.highs || [];
  const lows = graph.lows || [];
  const precip = graph.precip || [];
  if (labels.length === 0) return null;

  const maxTemp = Math.max(...highs, ...lows, 1);
  const minTemp = Math.min(...lows, 0);
  const range = maxTemp - minTemp || 1;

  return (
    <div className="space-y-3">
      <div className="h-24 relative bg-[#0A0D1F] rounded-xl border border-[#1B2244] p-2">
        {/* SVG line chart */}
        <svg className="w-full h-full" viewBox={`0 0 ${labels.length * 40} 80`} preserveAspectRatio="none">
          {/* High line */}
          <polyline
            points={highs.map((v, i) => `${i * 40 + 20},${80 - ((v - minTemp) / range) * 70}`).join(' ')}
            fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round"
          />
          {/* Low line */}
          <polyline
            points={lows.map((v, i) => `${i * 40 + 20},${80 - ((v - minTemp) / range) * 70}`).join(' ')}
            fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Precipitation bars */}
      <div className="grid grid-cols-5 gap-1.5 items-end h-8">
        {precip.slice(0, 5).map((p, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-full bg-cyan-500/40 rounded-t-sm" style={{ height: `${Math.min(p, 100) * 0.3}px` }} />
            <span className="text-[8px] text-gray-500 font-mono">{labels[i]}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-[9px] font-mono">
        <span className="flex items-center gap-1"><span className="w-3 h-[2px] bg-red-400" /> High</span>
        <span className="flex items-center gap-1"><span className="w-3 h-[2px] bg-blue-400" /> Low</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-cyan-500/40 rounded-sm" /> Rain</span>
      </div>
    </div>
  );
}

function SuggestionList({ items, icon }: { items: string[]; icon?: string }) {
  const iconEl = icon === 'farm'
    ? <Sprout size={14} className="text-emerald-400" />
    : <Sun size={14} className="text-amber-400" />;

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 bg-[#0A0D1F] border border-[#1B2244] rounded-lg p-2.5">
          <span className="mt-0.5">{iconEl}</span>
          <span className="text-[11px] text-gray-300 font-medium leading-relaxed">{item}</span>
        </div>
      ))}
    </div>
  );
}

export const GraphRenderer: React.FC<GraphRendererProps> = ({ graph, metrics }) => {
  if (!graph) return null;

  return (
    <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-4 space-y-3 mt-3">
      {graph.type === 'risk_gauge' && (
        <RiskGauge value={graph.value || 0} severity={graph.severity} title={graph.title} />
      )}

      {graph.type === 'comparison_bars' && <ComparisonBars datasets={graph.datasets} />}

      {graph.type === 'forecast_line' && <ForecastLine graph={graph} />}

      {graph.type === 'suggestion_list' && (
        <SuggestionList items={graph.items || []} icon={graph.icon} />
      )}

      {metrics && (
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1C2345]">
          {Object.values(metrics).map((m, i) => (
            <div key={i} className="text-center">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">{m.label}</p>
              <p className={`text-sm font-black font-mono ${colorMap[m.color] || 'text-white'}`}>{m.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
