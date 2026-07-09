import React, { useEffect } from 'react';
import { RiskAlertsPanel } from '../components/risk/RiskAlertsPanel';
import { GeospatialCanvas } from '../components/risk/GeospatialCanvas';
import { useAIStore } from '../store/aiStore';
import { useLocationStore } from '../store/locationStore';
import type { DayMatrixPoint } from '../types/risk.types';

const severityColorMap: Record<string, 'emerald' | 'amber' | 'blue'> = {
  Low: 'emerald',
  Moderate: 'amber',
  High: 'blue',
};

const typeMap: Record<string, 'FLOOD' | 'STORM' | 'HEAT' | 'LIGHTNING'> = {
  flood: 'FLOOD',
  storm: 'STORM',
  heat: 'HEAT',
};

export const RiskMonitorPage: React.FC = () => {
  const { risks, isLoading, fetchRisks } = useAIStore();
  const { currentLocation } = useLocationStore();
  const city = currentLocation?.city;
  const lat = city?.lat ?? 37.7749;
  const lon = city?.lon ?? -122.4194;

  useEffect(() => {
    fetchRisks(lat, lon);
  }, [lat, lon]);

  const riskAlerts = risks.map((r) => ({
    id: r.id,
    type: typeMap[r.id] || 'LIGHTNING',
    badgeText: `${r.severity} ${r.name}`,
    timestamp: 'Live',
    title: r.name,
    description: r.detail,
    statusText: r.severity === 'High' ? 'Action Required' : 'Monitoring Active',
    statusColor: severityColorMap[r.severity] || 'emerald',
  }));

  const timelinePoints: DayMatrixPoint[] = (risks.length > 0
    ? [
        { day: 'RISK 1', critical: risks[0]?.percentage ?? 0, warning: Math.max(0, 100 - (risks[0]?.percentage ?? 0)), stable: Math.max(0, 50) },
        { day: 'RISK 2', critical: risks[1]?.percentage ?? 0, warning: Math.max(0, 100 - (risks[1]?.percentage ?? 0)), stable: Math.max(0, 50) },
        { day: 'RISK 3', critical: risks[2]?.percentage ?? 0, warning: Math.max(0, 100 - (risks[2]?.percentage ?? 0)), stable: Math.max(0, 50) },
      ]
    : [
        { day: 'MON', critical: 15, warning: 30, stable: 55 },
        { day: 'TUE', critical: 40, warning: 35, stable: 25, hasPeak: true },
        { day: 'WED', critical: 10, warning: 20, stable: 70 },
        { day: 'THU', critical: 5, warning: 15, stable: 80 },
        { day: 'FRI', critical: 25, warning: 25, stable: 50 },
        { day: 'SAT', critical: 30, warning: 40, stable: 30 },
        { day: 'SUN', critical: 8, warning: 12, stable: 80 },
      ]
  );

  return (
    <div className="pt-20 pb-6 px-4 sm:px-6 lg:px-8 space-y-5 lg:ml-64 bg-[#070A14] min-h-screen text-gray-100 transition-all flex flex-col">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Active Risk Alerts</h2>
          <p className="text-xs text-gray-500 mt-0.5">Real-time localized hazard monitoring with ultra-low latency detection analytics.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 items-stretch">
        {isLoading && risks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center bg-[#0E1328] border border-[#1C2345] rounded-2xl">
            <p className="text-gray-500 text-sm">Loading risk telemetry...</p>
          </div>
        ) : (
          <>
            <RiskAlertsPanel alerts={riskAlerts} />
            <GeospatialCanvas timelineData={timelinePoints} />
          </>
        )}
      </div>

    </div>
  );
};