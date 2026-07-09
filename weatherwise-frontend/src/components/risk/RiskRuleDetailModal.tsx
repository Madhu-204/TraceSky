import React from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import type { ExpertRisk, ConditionEvaluation } from '../../types/expert.types';

interface RiskRuleDetailModalProps {
  risk: ExpertRisk;
  onClose: () => void;
}

export const RiskRuleDetailModal: React.FC<RiskRuleDetailModalProps> = ({ risk, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#0E1328] border border-[#1C2345] rounded-2xl w-full max-w-xl max-h-[80vh] overflow-y-auto m-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 space-y-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black tracking-wide uppercase px-2 py-0.5 rounded border ${
                  risk.severity === 'High' || risk.severity === 'Extreme'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : risk.severity === 'Moderate'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {risk.severity}
                </span>
                <span className="text-xs font-bold text-white">{risk.name}</span>
              </div>
              <p className="text-[10px] text-gray-400">{risk.detail}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-[#1C2345] rounded-lg transition-colors">
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono text-gray-400 bg-[#0A0E22] p-3 rounded-lg border border-[#161D3A]">
            <span>Certainty: <strong className="text-white">{Math.round(risk.certainty * 100)}%</strong></span>
            <span>Risk: <strong className="text-white">{risk.percentage}%</strong></span>
            <span>ID: <strong className="text-white">{risk.id}</strong></span>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reasoning Chain</h4>
            {risk.explanation.chain.map((step, idx) => (
              <div key={idx} className="bg-[#0A0E22] border border-[#161D3A] rounded-lg overflow-hidden">
                <div className="p-3 border-b border-[#161D3A] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-blue-400 font-mono">{step.rule_id}</span>
                    <span className="text-[10px] text-gray-300 font-medium">{step.rule_description}</span>
                  </div>
                  <span className="text-[9px] font-mono text-gray-500">
                    CF: {Math.round(step.certainty * 100)}%
                  </span>
                </div>
                <div className="p-3 space-y-1.5">
                  {step.conditions.map((cond, cIdx) => (
                    <div key={cIdx} className="flex items-center gap-2 text-[10px] font-mono">
                      {cond.matched ? (
                        <CheckCircle size={11} className="text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle size={11} className="text-red-400 shrink-0" />
                      )}
                      <span className="text-gray-400">{cond.fact}</span>
                      <span className="text-gray-500">{cond.operator}</span>
                      <span className="text-gray-300 font-bold">{String(cond.expected)}</span>
                      <span className="text-gray-500">→</span>
                      <span className={cond.matched ? 'text-emerald-400' : 'text-gray-500'}>
                        {cond.actual !== null ? String(cond.actual) : 'N/A'}
                      </span>
                      {cond.weight !== undefined && cond.weight !== 1.0 && (
                        <span className="text-gray-500">w={cond.weight}</span>
                      )}
                    </div>
                  ))}
                  {step.conclusion && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#161D3A]/50 text-[10px] font-mono">
                      <span className="text-gray-500">→</span>
                      <span className="text-emerald-400 font-bold">{step.conclusion}</span>
                      <span className="text-gray-300">=</span>
                      <span className="text-white font-bold">{String(step.conclusion_value)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
