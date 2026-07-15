import React, { useState } from 'react';
import { AlertTriangle, Info, Shield, Check, X } from 'lucide-react';
import type { AnomalyEventData, ExplanationChainLink } from '../../types/analytics.types';

interface EventTrackingCardProps {
  events: AnomalyEventData[];
}

export const EventTrackingCard: React.FC<EventTrackingCardProps> = ({ events }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const critical = events.filter((e) => e.severity === 'critical').length;
  const warnings = events.filter((e) => e.severity === 'warning').length;
  const infos = events.filter((e) => e.severity === 'info').length;

  return (
    <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 space-y-4 shadow-xl flex flex-col h-[320px]">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-black tracking-wider text-gray-500 font-mono uppercase">Event Tracking</span>
          <h3 className="text-sm font-bold text-white mt-0.5">Anomaly History</h3>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold">
          {critical > 0 && <span className="text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">{critical} critical</span>}
          {warnings > 0 && <span className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">{warnings} warn</span>}
          {infos > 0 && <span className="text-gray-500 bg-gray-500/10 px-1.5 py-0.5 rounded border border-gray-500/20">{infos} info</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {events.length === 0 ? (
          <p className="text-xs text-gray-500 italic text-center pt-8">No anomalies detected. All metrics within expected ranges.</p>
        ) : (
          events.map((evt) => {
            const isExpanded = expandedId === evt.id;
            return (
              <div key={evt.id}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : evt.id)}
                  className="w-full relative pl-4 border-l-2 border-[#1B2347] pb-1 group text-left hover:bg-[#0D1128] rounded-r-lg transition-all"
                >
                  <span className={`absolute -left-[5px] top-1 w-2 h-2 rounded-full transition-all ${
                    evt.severity === 'critical' ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]' :
                    evt.severity === 'warning' ? 'bg-amber-400' : 'bg-blue-400'
                  }`} />

                  <div className="space-y-0.5 pl-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-black text-rose-400/90 tracking-tight">{evt.timestamp}</span>
                      {evt.severity === 'critical' && <AlertTriangle size={10} className="text-rose-400" />}
                      {evt.severity === 'warning' && <AlertTriangle size={10} className="text-amber-400" />}
                      {evt.severity === 'info' && <Info size={10} className="text-blue-400" />}
                      <span className="text-[8px] font-mono text-gray-600 ml-auto">CF: {evt.certainty.toFixed(2)}</span>
                    </div>
                    <h4 className="text-xs font-bold text-gray-200 group-hover:text-white transition-all">{evt.title}</h4>
                    <p className="text-[10px] leading-relaxed text-gray-400 font-medium line-clamp-2">{evt.description}</p>
                    <div className="flex items-center gap-2 text-[8px] font-mono text-gray-600 mt-0.5">
                      <span className="text-cyan-500/80">Rule: {evt.triggered_by}</span>
                    </div>
                  </div>
                </button>

                {isExpanded && evt.explanation && (
                  <div className="ml-6 mb-2 px-3 py-2 bg-[#080C1A] border border-[#1C2340] rounded-lg space-y-2">
                    <div className="text-[9px] text-gray-500 font-mono">
                      Conclusion: <span className="text-cyan-300">{evt.explanation.conclusion}</span>
                      <span className="ml-2">CF: {evt.explanation.certainty.toFixed(2)}</span>
                    </div>
                    {evt.explanation.chain.map((link, i) => (
                      <div key={i} className="bg-[#0D1128] border border-[#1C2340] rounded p-2 space-y-1">
                        <div className="flex items-center gap-2 text-[8px] font-mono">
                          <span className="text-cyan-400 font-bold">{link.rule_id}</span>
                          <span className="text-gray-500">CF: {link.certainty.toFixed(2)}</span>
                          <span className="text-gray-400 flex-1 truncate">{link.rule_description}</span>
                        </div>
                        <div className="space-y-0.5">
                          {link.conditions.map((c, ci) => (
                            <div key={ci} className="flex items-center gap-1.5 text-[7px] font-mono">
                              <span className={c.matched ? 'text-emerald-400' : 'text-red-400'}>
                                {c.matched ? <Check size={6} /> : <X size={6} />}
                              </span>
                              <span className="text-gray-500">{c.fact}</span>
                              <span className="text-gray-600">{c.operator}</span>
                              <span className="text-gray-400">{c.expected}</span>
                              <span className="text-gray-600">| actual:</span>
                              <span className={c.matched ? 'text-emerald-300' : 'text-red-300'}>{c.actual}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
