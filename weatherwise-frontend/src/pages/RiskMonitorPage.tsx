import React from 'react';
import { RiskAlertsPanel } from '../components/risk/RiskAlertsPanel';
import { GeospatialCanvas } from '../components/risk/GeospatialCanvas';
import type { RiskAlert, DayMatrixPoint } from '../types/risk.types';

export const RiskMonitorPage: React.FC = () => {
  // Datasets tailored to explicitly mirror the entries on screen 6
  const liveRiskAlerts: RiskAlert[] = [
    {
      id: 'alert-1',
      type: 'FLOOD',
      badgeText: 'Severe Flood',
      timestamp: '12m ago',
      title: 'South Coastal Basin',
      description: 'Extreme precipitation causing 40% overflow risk at Dam Delta-4. Immediate evacuation recommended for Zone B.',
      metaTags: ['SF', 'JD'],
      statusText: 'Monitoring Active',
      statusColor: 'amber',
    },
    {
      id: 'alert-2',
      type: 'STORM',
      badgeText: 'Storm Warning',
      timestamp: '1h 04m ago',
      title: 'Northwestern Ridge',
      description: 'Wind speeds reaching 85km/h. Structural damage risk moderate. Monitoring secondary convective cells.',
      statusText: 'Monitoring Active',
      statusColor: 'amber',
    },
    {
      id: 'alert-3',
      type: 'HEAT',
      badgeText: 'Elevated Heat',
      timestamp: '3h ago',
      title: 'Central Metro Area',
      description: 'Heat index 42°C. Grid strain expected between 14:00 - 18:00 local time.',
      statusText: 'Status: Stable',
      statusColor: 'emerald',
    },
    {
      id: 'alert-4',
      type: 'LIGHTNING',
      badgeText: 'Lightning Observed',
      timestamp: 'Just now',
      title: 'Eastern Sector',
      description: 'Low frequency atmospheric discharges detected. No immediate risk reported.',
      statusText: 'No Action Required',
      statusColor: 'emerald',
    }
  ];

  const timelinePoints: DayMatrixPoint[] = [
    { day: 'MON', critical: 15, warning: 30, stable: 55 },
    { day: 'TUE', critical: 40, warning: 35, stable: 25, hasPeak: true },
    { day: 'WED', critical: 10, warning: 20, stable: 70 },
    { day: 'THU', critical: 5, warning: 15, stable: 80 },
    { day: 'FRI', critical: 25, warning: 25, stable: 50 },
    { day: 'SAT', critical: 30, warning: 40, stable: 30 },
    { day: 'SUN', critical: 8, warning: 12, stable: 80 }
  ];

  return (
    <div className="pt-20 pb-6 px-4 sm:px-6 lg:px-8 space-y-5 lg:ml-64 bg-[#070A14] min-h-screen text-gray-100 transition-all flex flex-col">

      {/* SECTION 1: Page Header Meta Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Active Risk Alerts</h2>
          <p className="text-xs text-gray-500 mt-0.5">Real-time localized hazard monitoring with ultra-low latency detection analytics.</p>
        </div>
      </div>

      {/* SECTION 2: Split View Workspace Layout */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 items-stretch">
        <RiskAlertsPanel alerts={liveRiskAlerts} />
        <GeospatialCanvas timelineData={timelinePoints} />
      </div>

    </div>
  );
};