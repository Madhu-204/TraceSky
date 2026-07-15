import React, { useState } from 'react';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus, Check, X } from 'lucide-react';
import type { ForecastAccuracyData, AccuracyByVariable, ExplanationChainLink } from '../../types/analytics.types';

interface ForecastAccuracyCardProps {
  data: ForecastAccuracyData;
}

const statusColorMap: Record<string, string> = {
  HIGH: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  LOW: 'text-red-400 bg-red-500/10 border-red-500/20',
  NONE: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
};

export const ForecastAccuracyCard: React.FC<ForecastAccuracyCardProps> = ({ data }) => {
  const [expandedVar, setExpandedVar] = useState<string | null>(null);

  const toggleVar = (name: string) => {
    setExpandedVar(expandedVar === name ? null : name);
  };

  return (
    <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 space-y-5 shadow-xl flex flex-col">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-black tracking-wider text-gray-500 font-mono uppercase">Forecast Accuracy</span>
          <h3 className="text-sm font-bold text-white mt-0.5">Historical vs Prediction</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full font-mono ${statusColorMap[data.overall_status] || statusColorMap.NONE}`}>
            {data.overall_accuracy}% Accuracy
          </span>
          <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono">
            CF: {data.overall_confidence.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="text-[11px] text-gray-400 leading-relaxed bg-[#080C1A] rounded-xl p-3 border border-[#1C2340]">
        {data.reasoning}
      </div>

      <div className="space-y-2">
        {data.by_variable.map((v) => (
          <VariableRow key={v.variable} variable={v} isExpanded={expandedVar === v.variable} onToggle={() => toggleVar(v.variable)} />
        ))}
      </div>

      <div className="text-[10px] text-gray-600 font-mono mt-auto pt-3 border-t border-[#1C2340] flex justify-between">
        <span>Validated across {data.validated_hours_count} hours</span>
        <span>Status: {data.overall_status} Confidence</span>
      </div>
    </div>
  );
};

function VariableRow({ variable, isExpanded, onToggle }: { variable: AccuracyByVariable; isExpanded: boolean; onToggle: () => void }) {
  const trendIcon = variable.trend === 'overpredicting' ? <TrendingUp size={12} className="text-amber-400" /> :
    variable.trend === 'underpredicting' ? <TrendingDown size={12} className="text-blue-400" /> :
    <Minus size={12} className="text-gray-500" />;

  const confidenceColor = variable.confidence >= 0.7 ? 'bg-emerald-500' :
    variable.confidence >= 0.4 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="bg-[#0D1128] border border-[#1C2340] rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#121733] transition-all">
        <span className="text-[9px] text-gray-500 font-mono shrink-0">
          {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </span>
        <span className="text-xs font-bold text-gray-200 w-24 shrink-0 capitalize">{variable.variable.replace('_', ' ')}</span>
        <div className="flex-1 h-1.5 bg-[#151B33] rounded-full overflow-hidden">
          <div className={`h-full ${confidenceColor} transition-all duration-500`} style={{ width: `${variable.accuracy}%` }} />
        </div>
        <span className="text-[10px] font-mono font-bold text-white w-12 text-right">{variable.accuracy}%</span>
        {trendIcon}
        <span className="text-[9px] font-mono text-gray-500 w-16 text-right">
          CF: {variable.confidence.toFixed(2)}
        </span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          <p className="text-[10px] text-gray-400 leading-relaxed bg-[#080C1A] rounded-lg p-2.5 border border-[#1C2340]">
            {variable.reasoning}
          </p>

          <div className="flex gap-3 text-[9px] font-mono text-gray-500">
            <span>Deviation: {variable.mean_deviation.toFixed(2)}</span>
            <span>Samples: {variable.samples}</span>
            <span>Trend: {variable.trend}</span>
          </div>

          {variable.explanation_chain.map((link, i) => (
            <ExplanationRow key={i} link={link} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExplanationRow({ link }: { link: ExplanationChainLink }) {
  return (
    <div className="bg-[#080C1A] border border-[#1C2340] rounded-lg p-2 space-y-1">
      <div className="flex items-center gap-2 text-[9px] font-mono">
        <span className="text-cyan-400 font-bold">{link.rule_id}</span>
        <span className="text-gray-500">CF: {link.certainty.toFixed(2)}</span>
        <span className="text-gray-400 flex-1 truncate">{link.rule_description}</span>
      </div>
      <div className="space-y-0.5">
        {link.conditions.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[8px] font-mono">
            <span className={c.matched ? 'text-emerald-400' : 'text-red-400'}>
              {c.matched ? <Check size={8} /> : <X size={8} />}
            </span>
            <span className="text-gray-500">{c.fact}</span>
            <span className="text-gray-600">{c.operator}</span>
            <span className="text-gray-400">{c.expected}</span>
            <span className="text-gray-600">| actual:</span>
            <span className={c.matched ? 'text-emerald-300' : 'text-red-300'}>{c.actual}</span>
          </div>
        ))}
      </div>
      {link.conclusion && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-[#1C2340] mt-1 text-[8px] font-mono">
          <span className="text-cyan-400">&rarr;</span>
          <span className="text-cyan-300">{link.conclusion}</span>
          <span className="text-gray-500">= {String(link.conclusion_value)}</span>
        </div>
      )}
    </div>
  );
}
