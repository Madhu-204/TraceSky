import React from 'react';
import { CloudRain, Sprout, Zap, Sun, Paperclip, Send, Mic, Cloud, Calendar } from 'lucide-react';
import type { SuggestionToken } from '../../types/assistant.types';

interface AssistantActionBarProps {
  suggestions: SuggestionToken[];
  inputValue: string;
  setInputValue: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AssistantActionBar: React.FC<AssistantActionBarProps> = ({
  suggestions,
  inputValue,
  setInputValue,
  onSubmit
}) => {
  const renderIcon = (type: SuggestionToken['iconType']) => {
    switch (type) {
      case 'flood': return <CloudRain size={12} className="text-blue-400" />;
      case 'farm': return <Sprout size={12} className="text-emerald-400" />;
      case 'cyclone': return <Zap size={12} className="text-amber-400" />;
      case 'solar': return <Sun size={12} className="text-orange-400" />;
      case 'forecast': return <Calendar size={12} className="text-cyan-400" />;
      case 'general': return <Cloud size={12} className="text-blue-300" />;
    }
  };

  return (
    <div className="space-y-4 shrink-0 pt-2">
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 max-w-full custom-scrollbar">
        {suggestions.map((token) => (
          <button
            key={token.id}
            onClick={() => setInputValue(token.label)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0E1328] border border-[#1C2345] hover:border-[#2B3564] text-[10px] font-bold text-gray-300 transition-all shadow-sm hover:shadow-md"
          >
            {renderIcon(token.iconType)}
            <span>{token.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="relative bg-[#0E1328] border border-[#1C2345] focus-within:border-[#2C376B] rounded-2xl p-2.5 transition-all shadow-xl flex items-center gap-2">
        <button type="button" className="p-2 text-gray-500 hover:text-gray-300 rounded-xl hover:bg-[#151C3B] transition-all">
          <Paperclip size={16} />
        </button>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask me about weather conditions, risks, farming, or solar..."
          className="flex-1 bg-transparent border-none text-xs text-white placeholder-gray-500 font-medium focus:outline-none focus:ring-0 px-1 py-1"
        />

        <div className="flex items-center gap-1.5">
          <button type="button" className="p-2 text-gray-500 hover:text-gray-300 rounded-xl hover:bg-[#151C3B] transition-all">
            <Mic size={16} />
          </button>
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-500 text-white disabled:bg-gray-800 disabled:text-gray-600 rounded-xl transition-all shadow-md font-bold"
          >
            <Send size={14} />
          </button>
        </div>
      </form>

      <div className="text-center text-[9px] font-bold font-mono tracking-wider text-gray-600 uppercase">
        POWERED BY WEATHERWISE EXPERT SYSTEM — 50+ RULES ANALYZED IN REAL TIME
      </div>
    </div>
  );
};