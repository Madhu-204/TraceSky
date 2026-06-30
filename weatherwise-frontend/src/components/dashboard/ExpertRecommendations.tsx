import React from 'react';
import { Lightbulb, MessageSquare } from 'lucide-react';

interface ExpertRecommendationsProps {
  advisories: string[];
  onAskAI: () => void;
}

export const ExpertRecommendations: React.FC<ExpertRecommendationsProps> = ({ advisories, onAskAI }) => {
  return (
    <div className="bg-[#111827] border border-gray-800/80 p-6 rounded-2xl flex flex-col justify-between h-full min-h-[250px]">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-sm text-gray-200 flex items-center gap-2 tracking-wide">
            <Lightbulb size={16} className="text-blue-400" /> INTELLIGENT ADVISORIES
          </h3>
          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest bg-blue-500/5 px-2 py-0.5 border border-blue-500/10 rounded-md">
            Live Advisory
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-5">
          {advisories.map((action, i) => (
            <button
              key={i}
              className="text-left bg-slate-900/60 border border-gray-800/80 hover:border-blue-500/40 p-3 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all duration-200 hover:bg-slate-900"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onAskAI}
        className="mt-6 w-full bg-gradient-to-r from-blue-600/10 to-indigo-600/10 hover:from-blue-600/20 hover:to-indigo-600/20 text-blue-400 border border-blue-500/20 py-2.5 rounded-xl text-xs font-bold transition-all tracking-wide flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(59,130,246,0.02)]"
      >
        <MessageSquare size={14} /> Ask AI Assistant
      </button>
    </div>
  );
};