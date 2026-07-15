import React, { useState } from 'react';
import { ArrowUpRight, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import type { ExpertRisk } from '../../types/expert.types';

interface RiskAlertsPanelProps {
  risks: ExpertRisk[];
  onViewDetails: (risk: ExpertRisk) => void;
}

const domainToFilter: Record<string, string> = {
  flood: 'Floods',
  storm: 'Storms',
  heat: 'Wildfire',
};

export const RiskAlertsPanel: React.FC<RiskAlertsPanelProps> = ({ risks, onViewDetails }) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Floods' | 'Storms' | 'Wildfire'>('All');
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);

  const getBadgeColors = (severity: string) => {
    switch (severity) {
      case 'High':
      case 'Extreme': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Moderate': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Low': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusColor = (severity: string) => {
    switch (severity) {
      case 'High':
      case 'Extreme': return 'text-rose-400';
      case 'Moderate': return 'text-amber-400';
      case 'Low': return 'text-emerald-400';
      default: return 'text-gray-400';
    }
  };

  const filteredRisks = activeTab === 'All'
    ? risks
    : risks.filter((r) => {
        const tabKey = Object.entries(domainToFilter).find(([, v]) => v === activeTab)?.[0];
        return tabKey ? r.id === tabKey : true;
      });

  const criticalCount = filteredRisks.filter((r) => r.severity === 'High' || r.severity === 'Extreme').length;

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white tracking-wide">Active Risk Alerts</h3>
          {criticalCount > 0 && (
            <span className="text-[10px] font-black bg-rose-500/15 border border-rose-500/30 text-rose-400 px-1.5 py-0.5 rounded-md">
              {criticalCount} CRITICAL
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 bg-[#0A0E22] p-1 border border-[#161D3A] rounded-xl">
        {(['All Alerts', 'Floods', 'Storms', 'Wildfire'] as const).map((tab) => {
          const cleanTab = tab.replace(' Alerts', '') as any;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(cleanTab)}
              className={`px-3 py-1.5 text-[10px] font-bold tracking-wide rounded-lg transition-all ${
                (activeTab === cleanTab || (tab === 'All Alerts' && activeTab === 'All'))
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#121735]/40'
              }`}
              style={(activeTab === cleanTab || (tab === 'All Alerts' && activeTab === 'All')) ? { boxShadow: 'var(--color-shadow-tab)' } : undefined}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredRisks.length === 0 ? null : (
          filteredRisks.map((risk) => {
            const isExpanded = expandedRisk === risk.id;
            const chainLength = risk.explanation?.chain?.length ?? 0;

            return (
              <div
                key={risk.id}
                className="bg-[#0E1328] border border-[#1C2345] hover:border-[#283262] rounded-xl transition-all relative group"
              >
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <span className={`text-[9px] font-black tracking-wide uppercase px-2 py-0.5 rounded border ${getBadgeColors(risk.severity)}`}>
                      {risk.severity} {risk.name}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500 tracking-tight shrink-0">
                      {risk.percentage}%
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                      {risk.name}
                    </h4>
                    <p className="text-[11px] leading-relaxed text-gray-400 font-medium">
                      {risk.detail}
                    </p>
                  </div>

                  {/* Certainty bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono">
                      <span className="text-gray-500">Certainty</span>
                      <span className={getStatusColor(risk.severity)}>{Math.round(risk.certainty * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0A0E22] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          risk.severity === 'High' || risk.severity === 'Extreme' ? 'bg-rose-500'
                          : risk.severity === 'Moderate' ? 'bg-amber-500'
                          : 'bg-emerald-500'
                        }`}
                        style={{ width: `${risk.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Explanation chain (expandable) */}
                  {chainLength > 0 && (
                    <>
                      <button
                        onClick={() => setExpandedRisk(isExpanded ? null : risk.id)}
                        className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-bold"
                      >
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {isExpanded ? 'Hide reasoning' : `Show reasoning (${chainLength} rules)`}
                      </button>

                      {isExpanded && (
                        <div className="space-y-2 mt-1">
                          {risk.explanation.chain.map((step, idx) => (
                            <div key={idx} className="bg-[#0A0E22] border border-[#161D3A] rounded-lg p-2.5 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-blue-400 font-mono">{step.rule_id}</span>
                                <span className="text-[8px] font-mono text-gray-500">
                                  CF: {Math.round(step.certainty * 100)}%
                                </span>
                              </div>
                              <p className="text-[9px] text-gray-300">{step.rule_description}</p>
                              <div className="space-y-0.5">
                                {step.conditions.map((cond, cIdx) => (
                                  <div key={cIdx} className="flex items-center gap-1 text-[8px] font-mono">
                                    {cond.matched ? (
                                      <CheckCircle size={8} className="text-emerald-400 shrink-0" />
                                    ) : (
                                      <XCircle size={8} className="text-red-400 shrink-0" />
                                    )}
                                    <span className="text-gray-500">{cond.fact}</span>
                                    <span className="text-gray-600">{cond.operator}</span>
                                    <span className="text-gray-300">{String(cond.expected)}</span>
                                    <span className="text-gray-600">→</span>
                                    <span className={cond.matched ? 'text-emerald-400' : 'text-gray-500'}>
                                      {cond.actual !== null ? String(cond.actual) : 'N/A'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-[#161B33]/60 text-[10px] font-bold">
                    <span className={`uppercase font-black tracking-wider flex items-center gap-1.5 ${getStatusColor(risk.severity)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      {risk.severity === 'High' || risk.severity === 'Extreme' ? 'Action Required' : 'Monitoring Active'}
                    </span>
                    <button
                      onClick={() => onViewDetails(risk)}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform font-bold"
                    >
                      VIEW DETAILS <ArrowUpRight size={11} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
