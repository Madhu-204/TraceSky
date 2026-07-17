import React, { useState } from 'react';
import { Lightbulb, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import type { ExpertRecommendation, InferenceMetrics, RuleTraceData } from '../../types/expert.types';

interface DerivedActionsProps {
  recommendations: ExpertRecommendation[];
  metrics: InferenceMetrics | null;
  onAskAI: () => void;
  isLoading?: boolean;
}

export const DerivedActions: React.FC<DerivedActionsProps> = ({ recommendations, metrics, onAskAI, isLoading = false }) => {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? recommendations : recommendations.slice(0, 4);

  return (
    <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 flex flex-col justify-between min-h-[260px]">
      <div>
        <div className="flex justify-between items-center mb-5">
          <div className="p-2 bg-blue-500/5 rounded-lg border border-blue-500/10 text-blue-400">
            <Lightbulb size={14} />
          </div>
          <span className="text-[9px] font-bold text-blue-400 tracking-widest uppercase">Derived Actions</span>
        </div>
        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-3">Rule-Based Recommendations</p>
        <div className="grid grid-cols-2 gap-2">
          {recommendations.length > 0
            ? visible.map((rec, idx) => (
                <div key={idx} className="bg-[#121733] border border-[#1C2340] rounded-lg relative group">
                  <p className="text-[10px] font-bold text-gray-300 py-2 px-2 leading-relaxed">
                    {rec.text}
                  </p>
                  <div className="flex items-center justify-between px-2 pb-1.5">
                    <span className="text-[8px] text-blue-500 font-mono">{rec.triggered_by}</span>
                    <span className="text-[8px] text-gray-600 font-mono">CF: {rec.certainty.toFixed(2)}</span>
                  </div>
                </div>
              ))
            : isLoading
              ? Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="bg-[#121733] border border-[#1C2340] text-center text-[10px] font-bold text-gray-500 py-2 px-1 rounded-lg italic animate-pulse">
                    Loading...
                  </div>
                ))
              : Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="bg-[#121733] border border-[#1C2340] text-center text-[10px] font-bold text-gray-500 py-2 px-1 rounded-lg italic">
                    No recommendations generated
                  </div>
                ))
          }
        </div>
        {recommendations.length > 4 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1 text-[10px] text-blue-400 font-bold mt-2 hover:underline"
          >
            {showAll ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showAll ? 'Show less' : `Show all (${recommendations.length})`}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {metrics && (
          <p className="text-[9px] text-gray-600 font-mono text-center">
            Evaluated {metrics.total_rules_evaluated} rules &bull; {metrics.total_rules_fired} fired &bull; {metrics.execution_time_ms}ms &bull; CF: {metrics.overall_certainty.toFixed(2)}
          </p>
        )}
        <button
          onClick={onAskAI}
          className="w-full bg-[#111630] border border-blue-500/20 hover:border-blue-500/40 text-blue-400 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <MessageSquare size={13} /> Ask AI Assistant
        </button>
      </div>
    </div>
  );
};
