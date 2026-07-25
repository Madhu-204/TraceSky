import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { RiskAlertsPanel } from '../components/risk/RiskAlertsPanel';
import { RiskSensorFacts } from '../components/risk/RiskSensorFacts';
import { RiskDerivedFacts } from '../components/risk/RiskDerivedFacts';
import { HistoricalContextCard } from '../components/risk/HistoricalContextCard';
import { InferenceMetricsCard } from '../components/risk/InferenceMetricsCard';
import { RiskRecommendations } from '../components/risk/RiskRecommendations';
import { RiskRuleDetailModal } from '../components/risk/RiskRuleDetailModal';
import { KnowledgeBaseDashboard } from '../components/risk/KnowledgeBaseDashboard';
import { useAIStore } from '../store/aiStore';
import { useLocationStore } from '../store/locationStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { Cpu, Shield } from 'lucide-react';
import type { ExpertRisk } from '../types/expert.types';
import type { DayMatrixPoint } from '../types/risk.types';

export const RiskMonitorPage: React.FC = () => {
  const { riskMonitorReport, isRiskMonitorLoading, riskMonitorError, fetchRiskMonitor } = useAIStore();
  const { currentLocation } = useLocationStore();
  const city = currentLocation?.city;
  const lat = city?.lat ?? 37.7749;
  const lon = city?.lon ?? -122.4194;
  const alertRadius = useSettingsStore((s) => s.config.alertRadius);

  const [selectedRisk, setSelectedRisk] = useState<ExpertRisk | null>(null);

  const refresh = useCallback(() => {
    fetchRiskMonitor(lat, lon);
  }, [lat, lon, fetchRiskMonitor]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useAutoRefresh(refresh);

  const allRisks = riskMonitorReport?.risks ?? [];
  const risks = useMemo(() => {
    if (alertRadius >= 100) return allRisks;
    const ratio = alertRadius / 100;
    return allRisks.filter((r) => r.percentage <= ratio * 100);
  }, [allRisks, alertRadius]);

  const recommendations = riskMonitorReport?.recommendations ?? [];
  const sensorFacts = riskMonitorReport?.sensor_facts ?? [];
  const derivedFacts = riskMonitorReport?.derived_facts ?? [];
  const metrics = riskMonitorReport?.inference_metrics ?? null;
  const historical = riskMonitorReport?.historical_comparison ?? null;
  const deltaFacts = riskMonitorReport?.delta_facts ?? {};
  const currentTelemetry = riskMonitorReport?.current_telemetry ?? null;
  const evaluatedByDomain = riskMonitorReport?.evaluated_by_domain ?? {};
  const dataSource = riskMonitorReport?.data_source ?? null;

  const overallCertainty = metrics?.overall_certainty ?? 0;

  const timelinePoints: DayMatrixPoint[] = risks.length > 0
    ? risks.slice(0, 7).map((r) => ({
        day: r.name.substring(0, 4).toUpperCase(),
        critical: r.severity === 'High' || r.severity === 'Extreme' ? r.percentage : Math.max(0, r.percentage - 40),
        warning: r.severity === 'Moderate' ? r.percentage : Math.max(0, 60 - r.percentage),
        stable: Math.max(0, 100 - r.percentage),
        hasPeak: r.severity === 'High' || r.severity === 'Extreme',
      }))
    : [
        { day: 'MON', critical: 15, warning: 30, stable: 55 },
        { day: 'TUE', critical: 40, warning: 35, stable: 25, hasPeak: true },
        { day: 'WED', critical: 10, warning: 20, stable: 70 },
        { day: 'THU', critical: 5, warning: 15, stable: 80 },
        { day: 'FRI', critical: 25, warning: 25, stable: 50 },
        { day: 'SAT', critical: 30, warning: 40, stable: 30 },
        { day: 'SUN', critical: 8, warning: 12, stable: 80 },
      ];

  if (isRiskMonitorLoading && !riskMonitorReport) {
    return (
      <div className="pt-4 sm:pt-6 lg:pt-20 pb-6 px-4 sm:px-6 lg:px-8 space-y-5 lg:ml-64 bg-[#070A14] min-h-screen text-gray-100 transition-all flex flex-col items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Running inference engine...</p>
        </div>
      </div>
    );
  }

  if (riskMonitorError) {
    return (
      <div className="pt-4 sm:pt-6 lg:pt-20 pb-6 px-4 sm:px-6 lg:px-8 space-y-5 lg:ml-64 bg-[#070A14] min-h-screen text-gray-100 transition-all flex flex-col items-center justify-center">
        <p className="text-red-400 text-sm">{riskMonitorError}</p>
      </div>
    );
  }

  return (
    <div className="pt-4 sm:pt-6 lg:pt-20 pb-8 px-4 sm:px-6 lg:px-8 space-y-6 lg:ml-64 bg-[#070A14] min-h-screen text-gray-100 transition-all">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Active Risk Alerts</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Expert system risk assessment with forward-chain inference engine.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {overallCertainty > 0 && (
            <span className={`text-[10px] font-black tracking-wider px-3 py-1.5 rounded-lg border uppercase flex items-center gap-1.5 ${
              overallCertainty >= 0.7 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
              overallCertainty >= 0.4 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
              'text-red-400 bg-red-500/10 border-red-500/20'
            }`}>
              <Shield size={12} />
              {Math.round(overallCertainty * 100)}% Certainty
            </span>
          )}
          {dataSource && (
            <span className="text-[9px] font-mono text-gray-500">{dataSource.provider}</span>
          )}
        </div>
      </div>

      {/* Full-width Knowledge Base Dashboard */}
      <KnowledgeBaseDashboard
        metrics={metrics}
        evaluatedByDomain={evaluatedByDomain}
        risks={risks}
        timelineData={timelinePoints}
        dataSource={dataSource}
      />

      {/* Risk alerts horizontal strip — only when risks exist */}
      {risks.length > 0 && (
        <RiskAlertsPanel
          risks={risks}
          onViewDetails={(risk) => setSelectedRisk(risk)}
        />
      )}

      {/* Expert cards grid — matches Dashboard's 3-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RiskSensorFacts sensorFacts={sensorFacts} currentTelemetry={currentTelemetry} />
        <RiskDerivedFacts derivedFacts={derivedFacts} />
        <HistoricalContextCard historical={historical} deltaFacts={deltaFacts} />
        <InferenceMetricsCard metrics={metrics} />
        <RiskRecommendations recommendations={recommendations} />
      </div>

      {/* Domain Rules Explorer — collapsible footer like Dashboard's BottomGrid */}
      {Object.keys(evaluatedByDomain).length > 0 && (
        <details className="group bg-[#0E1328] border border-[#1C2345] rounded-2xl">
          <summary className="flex items-center justify-between cursor-pointer p-4 hover:bg-[#0A0E22] transition-colors rounded-2xl">
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-blue-400" />
              <span className="text-xs font-bold text-white tracking-wide">Rule Evaluation by Domain</span>
              <span className="text-[9px] font-mono text-gray-500">{metrics?.total_rules_evaluated ?? 0} rules</span>
            </div>
            <span className="text-[9px] font-mono text-gray-500 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="px-4 pb-4 space-y-3">
            {Object.entries(evaluatedByDomain).map(([domain, rules]) => {
              const firedCount = rules.filter((r) => r.matched).length;
              return (
                <details key={domain} className="group">
                  <summary className="flex items-center justify-between cursor-pointer bg-[#0A0E22] border border-[#161D3A] rounded-lg p-3 hover:border-[#283262] transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-white capitalize">{domain}</span>
                      <span className="text-[9px] font-mono text-gray-500">{firedCount}/{rules.length} fired</span>
                    </div>
                    <span className="text-[9px] font-mono text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-2 space-y-1.5 pl-2">
                    {rules.map((rule) => (
                      <div key={rule.rule_id} className={`bg-[#0A0E22]/50 border rounded-lg p-2.5 space-y-1 ${rule.matched ? 'border-emerald-500/20' : 'border-[#161D3A]'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${rule.matched ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                            <span className="text-[9px] font-bold text-blue-400 font-mono">{rule.rule_id}</span>
                          </div>
                          <span className="text-[8px] font-mono text-gray-500">CF: {Math.round(rule.propagated_certainty * 100)}%</span>
                        </div>
                        <p className="text-[9px] text-gray-300">{rule.description}</p>
                        <div className="space-y-0.5">
                          {rule.conditions.map((cond, cIdx) => (
                            <div key={cIdx} className="flex items-center gap-1 text-[8px] font-mono">
                              <span className={cond.matched ? 'text-emerald-400' : 'text-red-400'}>{cond.matched ? '✓' : '✗'}</span>
                              <span className="text-gray-500">{cond.fact}</span>
                              <span className="text-gray-600">{cond.operator}</span>
                              <span className="text-gray-300">{String(cond.expected)}</span>
                              <span className="text-gray-600">→</span>
                              <span className={cond.matched ? 'text-emerald-400' : 'text-gray-500'}>{cond.actual !== null ? String(cond.actual) : 'N/A'}</span>
                            </div>
                          ))}
                        </div>
                        {rule.conclusion && (
                          <div className="flex items-center gap-1 text-[8px] font-mono pt-1 border-t border-[#161D3A]/50 mt-1">
                            <span className="text-gray-500">∴</span>
                            <span className="text-emerald-400 font-bold">{rule.conclusion}</span>
                            <span className="text-gray-300">=</span>
                            <span className="text-white font-bold">{rule.conclusion_value !== null ? String(rule.conclusion_value) : ''}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        </details>
      )}

      {selectedRisk && (
        <RiskRuleDetailModal
          risk={selectedRisk}
          onClose={() => setSelectedRisk(null)}
        />
      )}

    </div>
  );
};
