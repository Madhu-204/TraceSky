import React from 'react';
import { X, Check, ArrowRight } from 'lucide-react';
import type { ExpertRisk } from '../../types/expert.types';

interface RuleTraceModalProps {
  risk: ExpertRisk;
  onClose: () => void;
}

export const RuleTraceModal: React.FC<RuleTraceModalProps> = ({ risk, onClose }) => {
  const { explanation } = risk;
  if (!explanation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-white">{risk.name}</h3>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">
              {risk.severity} &bull; {risk.percentage}% &bull; CF: {risk.certainty.toFixed(2)}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#1C2345] rounded-lg transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
          <span className="text-blue-400 font-bold">Conclusion:</span> {explanation.conclusion}
          <span className="text-gray-600 ml-2">(CF: {explanation.certainty.toFixed(2)})</span>
        </p>

        <div className="space-y-3">
          <p className="text-[9px] font-bold text-gray-600 tracking-wider uppercase">Reasoning Chain</p>
          {explanation.chain.map((rule, idx) => (
            <div key={rule.rule_id} className="bg-[#0A0E1F] border border-[#1C2340] rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded">
                    {rule.rule_id}
                  </span>
                  <span className="text-[10px] text-gray-300 font-medium">{rule.rule_description}</span>
                </div>
                <span className="text-[9px] text-emerald-400 font-mono">CF: {rule.certainty.toFixed(2)}</span>
              </div>

              <div className="space-y-1">
                {rule.conditions.map((cond, ci) => (
                  <div key={ci} className="flex items-center gap-2 text-[9px] font-mono">
                    <span className={cond.matched ? 'text-emerald-400' : 'text-red-400'}>
                      {cond.matched ? <Check size={10} /> : <X size={10} />}
                    </span>
                    <span className="text-gray-500">{cond.fact}</span>
                    <span className="text-gray-600">{cond.operator}</span>
                    <span className="text-gray-400">{cond.expected}</span>
                    <ArrowRight size={8} className="text-gray-600" />
                    <span className={cond.matched ? 'text-emerald-300' : 'text-red-300'}>
                      {String(cond.actual ?? 'N/A')}
                    </span>
                    {cond.weight !== undefined && cond.weight !== 1.0 && (
                      <span className="text-gray-600">(w: {cond.weight.toFixed(1)})</span>
                    )}
                  </div>
                ))}
              </div>

              {rule.conclusion && (
                <div className="flex items-center gap-1.5 pt-1.5 border-t border-[#1C2340] text-[9px] font-mono">
                  <ArrowRight size={10} className="text-cyan-400" />
                  <span className="text-cyan-300 font-bold">{rule.conclusion}</span>
                  <span className="text-gray-500">= {String(rule.conclusion_value)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
