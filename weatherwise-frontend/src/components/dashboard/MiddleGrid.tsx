import React from 'react';
import { Shield, Lightbulb, MessageSquare, Radio } from 'lucide-react';
import { useAIStore } from '../../store/aiStore';

const severityColorMap: Record<string, { bg: string; text: string }> = {
  High: { bg: 'bg-red-500', text: 'text-red-400' },
  Moderate: { bg: 'bg-amber-500', text: 'text-amber-400' },
  Low: { bg: 'bg-emerald-500', text: 'text-emerald-400' },
};

export const MiddleGrid: React.FC = () => {
  const { risks, recommendations } = useAIStore();

  const chartBars = risks.length > 0
    ? risks.map((r) => Math.min(r.percentage, 60))
    : [15, 20, 28, 18, 45, 12, 16];

  const peakIndex = risks.length > 0
    ? risks.reduce((maxIdx, r, idx, arr) => r.percentage > arr[maxIdx].percentage ? idx : maxIdx, 0)
    : 4;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

      <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 flex flex-col justify-between min-h-[260px]">
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="p-2 bg-red-500/5 rounded-lg border border-red-500/10 text-red-400">
              <Shield size={14} />
            </div>
            <span className="text-[9px] bg-red-500/10 border border-red-500/20 text-red-400 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {risks.length} Active Risks
            </span>
          </div>
          <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-4">Critical Risk Assessment</p>
          <div className="space-y-4">
            {risks.length > 0 ? risks.map((item) => {
              const colors = severityColorMap[item.severity] || severityColorMap.Low;
              return (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-300">{item.name}</span>
                    <span className={colors.text}>{item.percentage}% {item.severity}</span>
                  </div>
                  <div className="w-full h-1 bg-[#151B33] rounded-full overflow-hidden">
                    <div className={`h-full ${colors.bg}`} style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              );
            }) : (
              <p className="text-xs text-gray-500 italic">No active risks detected.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 flex flex-col justify-between min-h-[260px]">
        <div>
          <div className="flex justify-between items-center mb-5">
            <div className="p-2 bg-blue-500/5 rounded-lg border border-blue-500/10 text-blue-400">
              <Lightbulb size={14} />
            </div>
            <span className="text-[9px] font-bold text-blue-400 tracking-widest uppercase">Live Advisory</span>
          </div>
          <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-3">Intelligent Advisories</p>
          <div className="grid grid-cols-2 gap-2">
            {recommendations.length > 0
              ? recommendations.slice(0, 4).map((txt, idx) => (
                  <div key={idx} className="bg-[#121733] border border-[#1C2340] text-center text-[10px] font-bold text-gray-300 py-2 px-1 rounded-lg">
                    {txt}
                  </div>
                ))
              : [0,1,2,3].map((idx) => (
                  <div key={idx} className="bg-[#121733] border border-[#1C2340] text-center text-[10px] font-bold text-gray-500 py-2 px-1 rounded-lg italic">
                    Loading...
                  </div>
                ))
            }
          </div>
        </div>
        <button className="w-full bg-[#111630] border border-blue-500/20 hover:border-blue-500/40 text-blue-400 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all mt-4">
          <MessageSquare size={13} /> Ask AI Assistant
        </button>
      </div>

      <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 flex flex-col justify-between min-h-[260px]">
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="p-2 bg-cyan-500/5 rounded-lg border border-cyan-500/10 text-cyan-400">
              <Radio size={14} />
            </div>
            <span className="text-[9px] font-bold text-red-400 flex items-center gap-1 bg-red-500/5 px-2 py-0.5 border border-red-500/10 rounded-md uppercase tracking-wider">
              <span className="w-1 h-1 bg-red-500 rounded-full animate-ping" /> Live Scan
            </span>
          </div>
          <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-4">Risk Intensity Profile</p>

          <div className="h-14 flex items-end justify-between gap-1.5 px-2">
            {chartBars.map((h, i) => (
              <div
                key={i}
                className={`w-full rounded-t-sm transition-all duration-300 ${i === peakIndex ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-cyan-500/30'}`}
                style={{ height: `${h * 1.2}%` }}
              />
            ))}
          </div>
        </div>
        <p className="text-[11px] text-gray-400 leading-normal mt-4">
          <strong className="text-red-400 font-bold">Detection:</strong>{' '}
          {risks.length > 0
            ? `${risks[peakIndex]?.name}: ${risks[peakIndex]?.percentage}% ${risks[peakIndex]?.severity}. ${risks[peakIndex]?.detail?.split('.')[0]}.`
            : 'Sub-mesoscale vortex forming 42km Offshore. Projected landfall in 12:45:03.'
          }
        </p>
      </div>

    </div>
  );
};