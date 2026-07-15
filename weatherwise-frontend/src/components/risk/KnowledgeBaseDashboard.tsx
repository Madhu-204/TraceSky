import React from 'react';
import { Cpu, Shield, Activity, Zap, Clock, Database } from 'lucide-react';
import type { InferenceMetrics, DomainRuleTrace, ExpertRisk } from '../../types/expert.types';
import type { DayMatrixPoint } from '../../types/risk.types';

interface KnowledgeBaseDashboardProps {
  metrics: InferenceMetrics | null;
  evaluatedByDomain: Record<string, DomainRuleTrace[]>;
  risks: ExpertRisk[];
  timelineData: DayMatrixPoint[];
  dataSource?: { provider: string } | null;
}

function computeDomainConfidence(rules: DomainRuleTrace[]): { fired: number; total: number; avgCertainty: number } {
  const fired = rules.filter(r => r.matched).length;
  const total = rules.length;
  const avgCertainty = fired > 0
    ? rules.filter(r => r.matched).reduce((sum, r) => sum + r.propagated_certainty, 0) / fired
    : 0;
  return { fired, total, avgCertainty };
}

function StatRow({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-blue-400">{icon}</span>
        <span className="text-[10px] text-gray-400 font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold text-white font-mono">{value}</span>
        {sub && <span className="text-[8px] text-gray-500 font-mono">({sub})</span>}
      </div>
    </div>
  );
}

export const KnowledgeBaseDashboard: React.FC<KnowledgeBaseDashboardProps> = ({
  metrics,
  evaluatedByDomain,
  risks,
  timelineData,
  dataSource,
}) => {
  const overallCertainty = metrics?.overall_certainty ?? 0;
  const totalEvaluated = metrics?.total_rules_evaluated ?? 0;
  const totalFired = metrics?.total_rules_fired ?? 0;
  const factsLoaded = metrics?.facts_loaded ?? 0;
  const execTimeMs = metrics?.execution_time_ms ?? 0;

  const domainEntries = Object.entries(evaluatedByDomain);
  const topRisks = [...risks].sort((a, b) => b.percentage - a.percentage).slice(0, 5);

  const gaugeRadius = 54;
  const gaugeStroke = 8;
  const normalizedRadius = gaugeRadius - gaugeStroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const strokeDashoffset = circumference - overallCertainty * circumference;

  const gaugeColor =
    overallCertainty >= 0.7 ? '#34d399' :
    overallCertainty >= 0.4 ? '#f59e0b' :
    '#f43f5e';

  return (
    <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu size={14} className="text-blue-400" />
          <p className="text-xs font-bold text-white tracking-wide">Expert System Status</p>
          <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Live
          </span>
        </div>
        {dataSource && (
          <span className="text-[9px] font-mono text-gray-500">{dataSource.provider}</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#0A0E22] border border-[#161D3A] rounded-xl p-4 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            <svg width="120" height="120" className="-rotate-90">
              <circle
                cx="60" cy="60" r={normalizedRadius}
                fill="none" stroke="#1C2345" strokeWidth={gaugeStroke}
              />
              <circle
                cx="60" cy="60" r={normalizedRadius}
                fill="none" stroke={gaugeColor} strokeWidth={gaugeStroke}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-white">{Math.round(overallCertainty * 100)}%</span>
              <span className="text-[9px] text-gray-500 font-medium">Certainty</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[9px] font-mono text-gray-500">
            <span className="flex items-center gap-1"><Shield size={10} /> {risks.length} risks</span>
            <span className="flex items-center gap-1"><Activity size={10} /> {domainEntries.length} domains</span>
          </div>
        </div>

        <div className="bg-[#0A0E22] border border-[#161D3A] rounded-xl p-4">
          <p className="text-[9px] font-bold text-gray-500 tracking-wider uppercase mb-3">Domain Activity</p>
          <div className="grid grid-cols-2 gap-2">
            {domainEntries.length > 0 ? domainEntries.map(([domain, rules]) => {
              const { fired, total, avgCertainty } = computeDomainConfidence(rules);
              const confPct = Math.round(avgCertainty * 100);
              const activityPct = total > 0 ? Math.round((fired / total) * 100) : 0;
              return (
                <div key={domain} className="bg-[#0E1328] border border-[#1C2345] rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold text-white capitalize">{domain}</span>
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${
                      activityPct >= 50 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'
                    }`}>
                      {fired}/{total}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#161D3A] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${confPct}%`,
                        background: confPct >= 50 ? '#34d399' : confPct >= 25 ? '#f59e0b' : '#f43f5e',
                      }}
                    />
                  </div>
                  <span className="text-[8px] font-mono text-gray-500 mt-1 block">{confPct}% confidence</span>
                </div>
              );
            }) : (
              <div className="col-span-2 text-center py-4 text-[10px] text-gray-500 font-mono">
                No domain data available
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#0A0E22] border border-[#161D3A] rounded-xl p-4">
          <p className="text-[9px] font-bold text-gray-500 tracking-wider uppercase mb-3">Engine Stats</p>
          <div className="space-y-3">
            <StatRow icon={<Zap size={12} />} label="Rules Evaluated" value={totalEvaluated.toString()} sub={`${totalFired} fired`} />
            <StatRow icon={<Database size={12} />} label="Facts Loaded" value={factsLoaded.toString()} />
            <StatRow icon={<Clock size={12} />} label="Execution Time" value={`${execTimeMs}ms`} />
            <StatRow icon={<Activity size={12} />} label="Facts / Rule" value={factsLoaded > 0 ? (totalEvaluated / factsLoaded).toFixed(1) : '0'} />
          </div>
        </div>
      </div>

      {topRisks.length > 0 && (
        <div className="bg-[#0A0E22] border border-[#161D3A] rounded-xl p-4 space-y-3">
          <p className="text-[9px] font-bold text-gray-500 tracking-wider uppercase">Top Risks by Severity</p>
          <div className="space-y-2">
            {topRisks.map((risk) => (
              <div key={risk.id} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: risk.color }} />
                <span className="text-[10px] font-bold text-white w-28 truncate shrink-0">{risk.name}</span>
                <div className="flex-1 h-3 bg-[#161D3A] rounded-full overflow-hidden min-w-0">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${risk.percentage}%`, backgroundColor: risk.color }}
                  />
                </div>
                <span className="text-[10px] font-mono text-gray-400 w-8 text-right shrink-0">{risk.percentage}%</span>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                  risk.severity === 'High' || risk.severity === 'Extreme' ? 'bg-rose-500/10 text-rose-400' :
                  risk.severity === 'Moderate' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {risk.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">7-Day Risk Matrix</p>
          <div className="flex items-center gap-3 text-[9px] font-mono">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-rose-500 rounded-sm" /> Critical</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-amber-500 rounded-sm" /> Warning</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-500 rounded-sm" /> Stable</span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 h-16 px-2">
          {timelineData.length > 0 ? timelineData.map((point, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 flex-1">
              <div className="w-full flex items-end gap-0.5 h-10">
                {point.critical > 0 && <div className="flex-1 bg-rose-500/60 rounded-t-sm" style={{ height: `${(point.critical / 100) * 100}%` }} />}
                {point.warning > 0 && <div className="flex-1 bg-amber-500/60 rounded-t-sm" style={{ height: `${(point.warning / 100) * 100}%` }} />}
                {point.stable > 0 && <div className="flex-1 bg-emerald-500/60 rounded-t-sm" style={{ height: `${(point.stable / 100) * 100}%` }} />}
              </div>
              {point.hasPeak && <span className="text-[8px] font-black text-rose-400 uppercase">Peak</span>}
              <span className="text-[9px] font-bold text-gray-500">{point.day}</span>
            </div>
          )) : (
            <div className="w-full text-center py-4 text-[10px] text-gray-500 font-mono">
              No timeline data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
