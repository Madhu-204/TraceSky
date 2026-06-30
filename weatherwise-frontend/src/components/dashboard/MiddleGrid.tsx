import React from 'react';
import { Shield, Lightbulb, MessageSquare, Radio } from 'lucide-react';

export const MiddleGrid: React.FC = () => {
  const risks = [
    { name: 'Coastal Flood Warning', value: '88% High', color: 'bg-red-500', text: 'text-red-400' },
    { name: 'Extreme Heatwave', value: '42% Moderate', color: 'bg-amber-500', text: 'text-amber-400' },
    { name: 'Pollen/Air Quality', value: '12% Low', color: 'bg-emerald-500', text: 'text-emerald-400' }
  ];

  const chartBars = [15, 20, 28, 18, 45, 12, 16]; // Live metrics matching chart heights

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

      {/* 1. CRITICAL RISK CARD */}
      <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 flex flex-col justify-between min-h-[260px]">
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="p-2 bg-red-500/5 rounded-lg border border-red-500/10 text-red-400">
              <Shield size={14} />
            </div>
            <span className="text-[9px] bg-red-500/10 border border-red-500/20 text-red-400 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
              3 Active Risks
            </span>
          </div>
          <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-4">Critical Risk Assessment</p>
          <div className="space-y-4">
            {risks.map((item, index) => (
              <div key={index} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-300">{item.name}</span>
                  <span className={item.text}>{item.value}</span>
                </div>
                <div className="w-full h-1 bg-[#151B33] rounded-full overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: item.value.split('%')[0] + '%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. INTELLIGENT ADVISORIES */}
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
            {['Seal windows', 'Activate backup grid', 'Update logistics routes', 'Evacuate Zone 4'].map((txt, idx) => (
              <div key={idx} className="bg-[#121733] border border-[#1C2340] text-center text-[10px] font-bold text-gray-300 py-2 px-1 rounded-lg">
                {txt}
              </div>
            ))}
          </div>
        </div>
        <button className="w-full bg-[#111630] border border-blue-500/20 hover:border-blue-500/40 text-blue-400 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all mt-4">
          <MessageSquare size={13} /> Ask AI Assistant
        </button>
      </div>

      {/* 3. ATMOSPHERIC ANOMALIES CHART */}
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
          <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-4">Atmospheric Anomalies</p>

          {/* Custom Histogram Bars to emulate Screenshot 2 */}
          <div className="h-14 flex items-end justify-between gap-1.5 px-2">
            {chartBars.map((h, i) => (
              <div
                key={i}
                className={`w-full rounded-t-sm transition-all duration-300 ${i === 4 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-cyan-500/30'}`}
                style={{ height: `${h * 1.2}%` }}
              />
            ))}
          </div>
        </div>
        <p className="text-[11px] text-gray-400 leading-normal mt-4">
          <strong className="text-red-400 font-bold">Detection:</strong> Sub-mesoscale vortex forming 42km Offshore. Projected landfall in <span className="font-mono text-white font-semibold">12:45:03</span>.
        </p>
      </div>

    </div>
  );
};