import React, { useState } from 'react';
import { Shield, Check, X } from 'lucide-react';
import type { DomainRuleTrace, ConditionEvaluation, InferenceMetrics } from '../../types/expert.types';

interface KnowledgeBasePanelProps {
  evaluatedByDomain: Record<string, DomainRuleTrace[]>;
  metrics: InferenceMetrics | null;
}

const DOMAIN_TABS = ['flood', 'storm', 'heat', 'farm', 'solar'];

const domainLabels: Record<string, string> = {
  flood: 'Coastal Flood & Precipitation',
  storm: 'Wind & Storm',
  heat: 'Temperature & Heatwave',
  farm: 'Agriculture & Farming',
  solar: 'Solar Energy',
};

const domainColors: Record<string, string> = {
  flood: 'text-blue-400',
  storm: 'text-amber-400',
  heat: 'text-red-400',
  farm: 'text-emerald-400',
  solar: 'text-yellow-400',
};

export const KnowledgeBasePanel: React.FC<KnowledgeBasePanelProps> = ({ evaluatedByDomain, metrics }) => {
  const [activeTab, setActiveTab] = useState('flood');

  const traces = evaluatedByDomain[activeTab] ?? [];
  const fired = traces.filter((t) => t.matched);
  const notMatched = traces.filter((t) => !t.matched);

  return (
    <div className="lg:col-span-4 bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 flex flex-col min-h-[250px]">
      <div className="space-y-4 flex-1 flex flex-col">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Knowledge Base — Rule Evaluator</p>
          {metrics && (
            <span className="text-[9px] bg-blue-600/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold tracking-wide uppercase">
              {metrics.total_rules_evaluated} Rules
            </span>
          )}
        </div>

        <div className="flex gap-1 flex-wrap border-b border-[#1C2340] pb-2">
          {DOMAIN_TABS.map((domain) => {
            const domainTraces = evaluatedByDomain[domain] ?? [];
            const domainFired = domainTraces.filter((t) => t.matched).length;
            return (
              <button
                key={domain}
                onClick={() => setActiveTab(domain)}
                className={`text-[9px] font-bold px-2 py-1 rounded transition-all uppercase tracking-wider ${
                  activeTab === domain
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
              >
                {domain.toUpperCase()}
                {domainFired > 0 && (
                  <span className="ml-1 text-emerald-400">({domainFired})</span>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-[9px] text-gray-600 font-mono">
          {domainLabels[activeTab]} &mdash; {traces.length} rules evaluated, {fired.length} fired
        </p>

        <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[280px]">
          {traces.length === 0 && (
            <p className="text-xs text-gray-500 italic">No rules evaluated for this domain.</p>
          )}
          {fired.map((t) => (
            <RuleRow key={t.rule_id} trace={t} fired />
          ))}
          {notMatched.map((t) => (
            <RuleRow key={t.rule_id} trace={t} fired={false} />
          ))}
        </div>
      </div>

      {metrics && (
        <div className="mt-4 pt-3 border-t border-[#1C2340] flex items-center gap-2">
          <Shield size={14} className="text-green-400" />
          <div>
            <p className="text-[11px] font-bold text-white font-mono">
              Certainty: {metrics.overall_certainty.toFixed(2)}
              <span className="text-gray-500 font-normal text-[10px] ml-1">
                (propagated from {metrics.total_rules_fired} rules)
              </span>
            </p>
            <p className="text-[10px] text-gray-500">
              Data ingested from Open-Meteo API network
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

function RuleRow({ trace, fired }: { trace: DomainRuleTrace; fired: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition-all ${
          fired ? 'bg-[#12202A] border border-emerald-500/20' : 'bg-[#0D1128] border border-[#1C2340] opacity-60'
        }`}
      >
        <span className={`text-[9px] font-mono shrink-0 ${fired ? 'text-emerald-400' : 'text-gray-600'}`}>
          {fired ? <Check size={10} /> : <X size={10} />}
        </span>
        <span className="text-[9px] font-bold text-gray-400 font-mono shrink-0">{trace.rule_id}</span>
        <span className="text-[9px] font-mono text-gray-600 shrink-0">CF: {trace.certainty.toFixed(2)}</span>
        <span className="text-[8px] text-gray-500 truncate flex-1">{trace.description}</span>
        {trace.propagated_certainty > 0 && (
          <span className="text-[8px] text-emerald-500 font-mono shrink-0">{trace.propagated_certainty.toFixed(2)}</span>
        )}
      </button>
      {expanded && (
        <div className="ml-5 mt-1 mb-2 px-2.5 py-2 bg-[#080C1A] border border-[#1C2340] rounded space-y-1">
          {trace.conditions.map((c, i) => (
            <ConditionRow key={i} condition={c} />
          ))}
          {trace.conclusion && (
            <div className="flex items-center gap-1.5 pt-1 border-t border-[#1C2340] mt-1">
              <span className="text-[8px] text-cyan-400 font-bold">&rarr;</span>
              <span className="text-[9px] font-mono text-cyan-300">{trace.conclusion}</span>
              <span className="text-[9px] font-mono text-gray-500">= {String(trace.conclusion_value)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConditionRow({ condition }: { condition: ConditionEvaluation }) {
  return (
    <div className="flex items-center gap-1.5 text-[9px] font-mono">
      <span className={condition.matched ? 'text-emerald-400' : 'text-red-400'}>
        {condition.matched ? 'T' : 'F'}
      </span>
      <span className="text-gray-500">{condition.fact}</span>
      <span className="text-gray-600">{condition.operator}</span>
      <span className="text-gray-400">{String(condition.expected)}</span>
      <span className="text-gray-600">| actual:</span>
      <span className={condition.matched ? 'text-emerald-300' : 'text-red-300'}>
        {condition.actual ?? 'N/A'}
      </span>
    </div>
  );
}
