import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronRight, Check, X } from 'lucide-react';
import type { PerformanceBenchmarkData, BenchmarkRowData, ExplanationChainLink } from '../../types/analytics.types';

interface PerformanceBenchmarkCardProps {
  data: PerformanceBenchmarkData;
}

export const PerformanceBenchmarkCard: React.FC<PerformanceBenchmarkCardProps> = ({ data }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (name: string) => {
    setExpandedRow(expandedRow === name ? null : name);
  };

  return (
    <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 shadow-xl flex flex-col justify-between h-[320px]">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-black tracking-wider text-gray-500 font-mono uppercase">Performance Benchmark</span>
            <h3 className="text-sm font-bold text-white mt-0.5">Model Comparison Audit</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono">
              CF: {data.certainty.toFixed(2)}
            </span>
          </div>
        </div>

        <p className="text-[10px] text-gray-400 leading-relaxed bg-[#080C1A] rounded-lg p-2.5 border border-[#1C2340]">
          {data.overall_assessment}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#161C38] text-[9px] font-mono font-black text-gray-500 uppercase tracking-wider">
                <th className="pb-2 font-black">Variable</th>
                <th className="pb-2">Source Model</th>
                <th className="pb-2 text-blue-400 font-bold">WeatherWise</th>
                <th className="pb-2">Actual Observed</th>
                <th className="pb-2">Error &darr;</th>
                <th className="pb-2">Improvement</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151B35]/40 text-xs font-semibold">
              {data.rows.map((row) => {
                const isExpanded = expandedRow === row.variable;
                return (
                  <React.Fragment key={row.variable}>
                    <tr
                      className="hover:bg-[#131936]/30 transition-all cursor-pointer"
                      onClick={() => toggleRow(row.variable)}
                    >
                      <td className="py-2.5 text-gray-400 font-medium">
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] text-gray-600">
                            {isExpanded ? <ChevronDown size={8} /> : <ChevronRight size={8} />}
                          </span>
                          {row.variable}
                          <span className="text-[9px] font-mono text-gray-600 ml-0.5">{row.unit}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-gray-400 font-mono font-medium">{row.source_model_value}</td>
                      <td className="py-2.5 text-white font-mono font-bold">{row.wise_model_value}</td>
                      <td className="py-2.5 text-gray-300 font-mono">{row.actual_observed}</td>
                      <td className="py-2.5 font-mono">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">{row.source_error.toFixed(1)}</span>
                          <span className="text-gray-600">&rarr;</span>
                          <span className={row.wise_error < row.source_error ? 'text-emerald-400' : 'text-amber-400'}>
                            {row.wise_error.toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 font-mono">
                        <span className={row.improvement_pct > 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {row.improvement_pct > 0 ? '+' : ''}{row.improvement_pct}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right flex justify-end pt-3">
                        {row.status === 'optimal' ? (
                          <CheckCircle2 size={14} className="text-emerald-400" />
                        ) : (
                          <AlertTriangle size={14} className="text-amber-400 animate-pulse" />
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="pb-3 pt-0">
                          <div className="bg-[#080C1A] border border-[#1C2340] rounded-lg p-3 space-y-2 ml-4">
                            <p className="text-[10px] text-gray-400 leading-relaxed">{row.reasoning}</p>
                            <div className="flex gap-3 text-[8px] font-mono text-gray-500">
                              <span>Source Error: {row.source_error.toFixed(2)}{row.unit}</span>
                              <span>Wise Error: {row.wise_error.toFixed(2)}{row.unit}</span>
                              <span>CF: {row.certainty.toFixed(2)}</span>
                            </div>
                            {row.explanation_chain.map((link, i) => (
                              <ExplanationChain key={i} link={link} />
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center text-[10px] font-mono font-bold text-gray-500 pt-3 border-t border-[#161C38]">
        <span>Model comparison based on forecast validation & historical norms.</span>
        <span className="text-blue-400">
          CF: {data.certainty.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

function ExplanationChain({ link }: { link: ExplanationChainLink }) {
  return (
    <div className="bg-[#0D1128] border border-[#1C2340] rounded p-2 space-y-1">
      <div className="flex items-center gap-2 text-[8px] font-mono">
        <span className="text-cyan-400 font-bold">{link.rule_id}</span>
        <span className="text-gray-500">CF: {link.certainty.toFixed(2)}</span>
        <span className="text-gray-400 flex-1 truncate">{link.rule_description}</span>
      </div>
      <div className="space-y-0.5">
        {link.conditions.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[7px] font-mono">
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
      {link.conclusion && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-[#1C2340] mt-1 text-[7px] font-mono">
          <span className="text-cyan-400">&rarr;</span>
          <span className="text-cyan-300">{link.conclusion}</span>
          <span className="text-gray-500">= {String(link.conclusion_value)}</span>
        </div>
      )}
    </div>
  );
}
