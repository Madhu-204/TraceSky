import React from 'react';
import { Cpu, Zap, Clock, Shield, BarChart3 } from 'lucide-react';
import type { InferenceMetrics } from '../../types/expert.types';

interface InferenceMetricsCardProps {
  metrics: InferenceMetrics | null;
}

export const InferenceMetricsCard: React.FC<InferenceMetricsCardProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5">
        <p className="text-xs text-gray-500">No inference metrics available</p>
      </div>
    );
  }

  const items = [
    { label: 'Rules Evaluated', value: metrics.total_rules_evaluated, icon: <BarChart3 size={14} />, color: 'text-blue-400' },
    { label: 'Rules Fired', value: metrics.total_rules_fired, icon: <Zap size={14} />, color: 'text-amber-400' },
    { label: 'Execution Time', value: `${metrics.execution_time_ms}ms`, icon: <Clock size={14} />, color: 'text-emerald-400' },
    { label: 'Facts Loaded', value: metrics.facts_loaded, icon: <Cpu size={14} />, color: 'text-purple-400' },
    { label: 'Overall Certainty', value: `${Math.round(metrics.overall_certainty * 100)}%`, icon: <Shield size={14} />, color: metrics.overall_certainty >= 0.7 ? 'text-emerald-400' : metrics.overall_certainty >= 0.4 ? 'text-amber-400' : 'text-red-400' },
  ];

  return (
    <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-2">
          <Cpu size={14} className="text-cyan-400" />
          Inference Engine Stats
        </h3>
        <span className="text-[9px] font-mono text-gray-500">Forward Chain</span>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#161D3A]">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <span className={item.color}>{item.icon}</span>
              <span className="text-[10px] text-gray-400 font-medium">{item.label}</span>
            </div>
            <span className="text-xs font-bold font-mono text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
