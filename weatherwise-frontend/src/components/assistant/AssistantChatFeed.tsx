import React from 'react';
import { Sparkles, User } from 'lucide-react';
import type { AssistantMessage } from '../../types/assistant.types';
import { GraphRenderer } from './GraphRenderer';

interface AssistantChatFeedProps {
  messages: AssistantMessage[];
}

export const AssistantChatFeed: React.FC<AssistantChatFeedProps> = ({ messages }) => {
  return (
    <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
      {messages.map((msg) => {
        const isAI = msg.sender === 'assistant';
        return (
          <div
            key={msg.id}
            className={`flex gap-4 max-w-4xl ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
              isAI
                ? 'bg-blue-600/10 border-blue-500/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                : 'bg-[#151C3A] border-[#252F5A] text-gray-300'
            }`}>
              {isAI ? <Sparkles size={14} /> : <User size={14} />}
            </div>

            <div className="space-y-2.5 flex-1 max-w-[calc(100%-3rem)]">
              <div className={`flex items-center gap-2 text-[10px] font-mono text-gray-500 ${!isAI && 'justify-end'}`}>
                <span className="font-bold text-gray-400">{isAI ? 'ASSISTANT' : 'YOU'}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              <div className={`p-4 rounded-2xl text-xs leading-relaxed font-medium transition-all ${
                isAI
                  ? 'bg-[#0E1328] border border-[#1C2345] text-gray-200'
                  : 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(59,130,246,0.15)] font-semibold'
              }`}>
                {msg.text.split('**').map((chunk, index) =>
                  index % 2 === 1 ? <strong key={index} className={isAI ? "text-blue-400 font-bold" : "text-white font-black"}>{chunk}</strong> : chunk
                )}
              </div>

              {/* Graph renderer for structured graph data */}
              {isAI && msg.graph && (
                <GraphRenderer graph={msg.graph} metrics={msg.metrics} />
              )}

              {/* Legacy metrics card fallback */}
              {isAI && !msg.graph && msg.hasMetricsCard && msg.metricsData && (
                <div className="bg-[#0A0D1F] border border-[#1B2244] rounded-2xl p-4 space-y-4 shadow-xl">
                  <div className="flex justify-between items-center border-b border-[#161B36] pb-3">
                    <span className="text-[10px] font-black tracking-wider text-gray-400 font-mono uppercase">
                      {msg.metricsData.title}
                    </span>
                    <span className="text-[9px] font-black bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                      {msg.metricsData.badgeText}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 bg-[#0E1328]/60 p-3 rounded-xl border border-[#151B35]">
                    <div>
                      <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">Current</div>
                      <div className="text-base font-black text-white mt-0.5 font-mono">{msg.metricsData.currentValue}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">Historic</div>
                      <div className="text-base font-bold text-gray-400 mt-0.5 font-mono">{msg.metricsData.historicValue}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">Threshold</div>
                      <div className="text-base font-bold text-rose-400 mt-0.5 font-mono">{msg.metricsData.thresholdValue}</div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-mono font-bold text-gray-600">
                      <span>24H AGO</span>
                      <span>NOW</span>
                      <span>+48H PROJ.</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5 items-end h-16 pt-2 px-1">
                      {msg.metricsData.chartPoints.map((pt, index) => (
                        <div key={index} className="h-full flex flex-col justify-end group relative">
                          <div
                            className={`w-full rounded-sm transition-all relative ${
                              pt.isCurrent
                                ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]'
                                : 'bg-[#1D254C] hover:bg-[#283366]'
                            }`}
                            style={{ height: `${pt.value}%` }}
                          >
                            {pt.isCurrent && (
                              <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-300 rounded-full" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] leading-relaxed text-gray-400 pt-2 border-t border-[#161B36] font-medium">
                    {msg.metricsData.summaryText.split('**').map((chunk, idx) =>
                      idx % 2 === 1 ? <strong key={idx} className="text-white font-bold">{chunk}</strong> : chunk
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};