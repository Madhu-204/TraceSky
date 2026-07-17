import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import type { ExpertRecommendation } from '../../types/expert.types';

interface RiskRecommendationsProps {
  recommendations: ExpertRecommendation[];
}

export const RiskRecommendations: React.FC<RiskRecommendationsProps> = ({ recommendations }) => {
  const [expanded, setExpanded] = useState(false);

  if (!recommendations.length) {
    return (
      <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5">
        <p className="text-xs text-gray-500">No recommendations at this time</p>
      </div>
    );
  }

  const visible = expanded ? recommendations : recommendations.slice(0, 4);

  return (
    <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-2">
          <Lightbulb size={14} className="text-yellow-400" />
          Expert Recommendations
        </h3>
        <span className="text-[9px] font-mono text-gray-500">{recommendations.length} actions</span>
      </div>

      <div className="space-y-2">
        {visible.map((rec, idx) => (
          <div key={idx} className="bg-[#0A0E22] border border-[#161D3A] rounded-lg p-3 space-y-1.5">
            <div className="flex items-start gap-2">
              <ArrowRight size={12} className="text-blue-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-gray-200 font-medium leading-relaxed">{rec.text}</p>
            </div>
            <div className="flex items-center gap-3 ml-6">
              <span className="text-[9px] font-mono text-gray-500 bg-[#151C3A] px-1.5 py-0.5 rounded">
                Rule: {rec.triggered_by}
              </span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                rec.certainty >= 0.7 ? 'text-emerald-400 bg-emerald-500/10' :
                rec.certainty >= 0.4 ? 'text-amber-400 bg-amber-500/10' :
                'text-gray-400 bg-gray-500/10'
              }`}>
                {Math.round(rec.certainty * 100)}% confidence
              </span>
            </div>
          </div>
        ))}
      </div>

      {recommendations.length > 4 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-bold mx-auto"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Show fewer' : `Show all ${recommendations.length} recommendations`}
        </button>
      )}
    </div>
  );
};
