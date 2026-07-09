import React from 'react';
import { Radio, ArrowRight, Check, X } from 'lucide-react';
import type { SensorFact } from '../../types/expert.types';

interface ReasoningTraceProps {
  sensorFacts: SensorFact[];
  derivedFacts: SensorFact[];
  executionTimeMs: number;
}

export const ReasoningTrace: React.FC<ReasoningTraceProps> = ({ sensorFacts, derivedFacts, executionTimeMs }) => {
  const keyFacts = sensorFacts.filter(f =>
    ['temperature', 'precipitation', 'wind_speed', 'humidity', 'uv_index', 'feels_like'].includes(f.name)
  );

  return (
    <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 flex flex-col justify-between min-h-[260px]">
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="p-2 bg-cyan-500/5 rounded-lg border border-cyan-500/10 text-cyan-400">
            <Radio size={14} />
          </div>
          <span className="text-[9px] font-bold text-cyan-400 flex items-center gap-1 bg-cyan-500/5 px-2 py-0.5 border border-cyan-500/10 rounded-md uppercase tracking-wider">
            <span className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" /> Reasoning Chain
          </span>
        </div>
        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-3">Fact &rarr; Rule &rarr; Conclusion</p>

        <div className="space-y-2.5">
          <div>
            <p className="text-[9px] text-gray-600 font-bold tracking-wider uppercase mb-1.5">Input Facts</p>
            <div className="grid grid-cols-2 gap-1.5">
              {keyFacts.slice(0, 6).map((f) => (
                <div key={f.name} className="bg-[#121733] border border-[#1C2340] rounded px-2 py-1 flex items-center justify-between">
                  <span className="text-[9px] text-gray-400 font-mono">{f.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-white font-mono">{String(f.value)}{f.name === 'temperature' || f.name === 'feels_like' ? '°' : f.name === 'humidity' ? '%' : f.name === 'precipitation' ? 'mm' : f.name === 'wind_speed' ? 'km/h' : ''}</span>
                    <span className="text-[7px] text-gray-600 font-mono">CF:{f.certainty.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {derivedFacts.length > 0 && (
            <div>
              <p className="text-[9px] text-gray-600 font-bold tracking-wider uppercase mb-1.5">Derived Conclusions</p>
              <div className="space-y-1">
                {derivedFacts.slice(0, 4).map((f) => (
                  <div key={`${f.name}-${f.fired_rule_id}`} className="bg-[#0D1128] border border-[#1A2140] rounded px-2.5 py-1.5 flex items-center gap-2">
                    <Check size={10} className="text-emerald-400 shrink-0" />
                    <span className="text-[9px] text-gray-400 font-mono">{f.fired_rule_id}</span>
                    <ArrowRight size={10} className="text-gray-600 shrink-0" />
                    <span className="text-[10px] font-bold text-white font-mono">{f.name} = {String(f.value)}</span>
                    <span className="text-[7px] text-gray-600 font-mono ml-auto">CF:{f.certainty.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {derivedFacts.length === 0 && (
            <p className="text-[10px] text-gray-500 italic">No rules matched current conditions. All parameters within normal range.</p>
          )}
        </div>
      </div>

      <p className="text-[10px] text-gray-600 font-mono mt-4 pt-3 border-t border-[#1C2340]">
        Engine executed in {executionTimeMs}ms &bull; {keyFacts.length} sensor facts &bull; {derivedFacts.length} derivations
      </p>
    </div>
  );
};
