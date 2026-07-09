import React, { useState } from 'react';
import { Shield, Info } from 'lucide-react';
import type { ExpertRisk, RuleTraceData } from '../../types/expert.types';
import { RuleTraceModal } from './RuleTraceModal';

interface InferenceRiskProfileProps {
  risks: ExpertRisk[];
}

const severityColorMap: Record<string, { bg: string; text: string }> = {
  High: { bg: 'bg-red-500', text: 'text-red-400' },
  Moderate: { bg: 'bg-amber-500', text: 'text-amber-400' },
  Low: { bg: 'bg-emerald-500', text: 'text-emerald-400' },
  Extreme: { bg: 'bg-red-600', text: 'text-red-500' },
};

export const InferenceRiskProfile: React.FC<InferenceRiskProfileProps> = ({ risks }) => {
  const [selectedRisk, setSelectedRisk] = useState<ExpertRisk | null>(null);

  return (
    <>
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
          <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-4">Inference Risk Profile</p>
          <div className="space-y-4">
            {risks.length > 0 ? risks.map((item) => {
              const colors = severityColorMap[item.severity] || severityColorMap.Low;
              const chainLen = item.explanation?.chain?.length ?? 0;
              return (
                <div key={item.id} className="space-y-1.5 group cursor-pointer" onClick={() => setSelectedRisk(item)}>
                  <div className="flex justify-between text-xs font-semibold items-center">
                    <span className="text-gray-300 flex items-center gap-1.5">
                      {item.name}
                      {chainLen > 0 && (
                        <span className="text-[9px] text-gray-600 font-mono">({chainLen} rules)</span>
                      )}
                    </span>
                    <span className={`${colors.text} flex items-center gap-1.5`}>
                      {item.percentage}% {item.severity}
                      <span className="text-[9px] bg-[#1C2345] text-gray-500 px-1.5 py-0.5 rounded font-mono">
                        CF: {item.certainty.toFixed(2)}
                      </span>
                      <Info size={10} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[#151B33] rounded-full overflow-hidden">
                    <div className={`h-full ${colors.bg} transition-all duration-500`} style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              );
            }) : (
              <p className="text-xs text-gray-500 italic">No active risks detected by inference engine.</p>
            )}
          </div>
        </div>
        <p className="text-[10px] text-gray-600 font-mono mt-4 pt-3 border-t border-[#1C2340]">
          {risks.length > 0
            ? `Highest risk: ${risks[0].name} at ${risks[0].percentage}% (CF: ${risks[0].certainty.toFixed(2)})`
            : 'All conditions within normal parameters.'}
        </p>
      </div>

      {selectedRisk && (
        <RuleTraceModal
          risk={selectedRisk}
          onClose={() => setSelectedRisk(null)}
        />
      )}
    </>
  );
};
