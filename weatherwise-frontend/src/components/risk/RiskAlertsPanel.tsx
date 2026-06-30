import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { RiskAlert } from '../../types/risk.types';

interface RiskAlertsPanelProps {
  alerts: RiskAlert[];
}

export const RiskAlertsPanel: React.FC<RiskAlertsPanelProps> = ({ alerts }) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Floods' | 'Storms' | 'Wildfire'>('All');

  const getBadgeColors = (type: RiskAlert['type']) => {
    switch (type) {
      case 'FLOOD': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'STORM': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'HEAT': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'LIGHTNING': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  const getStatusColor = (color: RiskAlert['statusColor']) => {
    switch (color) {
      case 'emerald': return 'text-emerald-400';
      case 'amber': return 'text-amber-400';
      case 'blue': return 'text-sky-400';
    }
  };

  return (
    <div className="w-full lg:w-[420px] shrink-0 space-y-4 flex flex-col h-[calc(100vh-140px)] overflow-y-auto pr-1 custom-scrollbar">
      {/* Header Metrics Summary */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white tracking-wide">Active Risk Alerts</h3>
          <span className="text-[10px] font-black bg-rose-500/15 border border-rose-500/30 text-rose-400 px-1.5 py-0.5 rounded-md">
            4 CRITICAL
          </span>
        </div>
      </div>

      {/* Pill Filters Layout Workspace */}
      <div className="flex flex-wrap items-center gap-1.5 bg-[#0A0E22] p-1 border border-[#161D3A] rounded-xl">
        {(['All Alerts', 'Floods', 'Storms', 'Wildfire'] as const).map((tab) => {
          const cleanTab = tab.replace(' Alerts', '') as any;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(cleanTab)}
              className={`px-3 py-1.5 text-[10px] font-bold tracking-wide rounded-lg transition-all ${
                (activeTab === cleanTab || (tab === 'All Alerts' && activeTab === 'All'))
                  ? 'bg-blue-600 text-white shadow-[0_2px_8px_rgba(59,130,246,0.25)]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#121735]/40'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Feed Area Stack Container */}
      <div className="space-y-3 overflow-y-auto flex-1 pr-1">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="bg-[#0E1328] border border-[#1C2345] hover:border-[#283262] rounded-xl p-4 space-y-3 transition-all relative group"
          >
            <div className="flex justify-between items-start gap-4">
              <span className={`text-[9px] font-black tracking-wide uppercase px-2 py-0.5 rounded border ${getBadgeColors(alert.type)}`}>
                {alert.badgeText}
              </span>
              <span className="text-[10px] font-mono text-gray-500 tracking-tight shrink-0">
                {alert.timestamp}
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                {alert.title}
              </h4>
              <p className="text-[11px] leading-relaxed text-gray-400 font-medium">
                {alert.description}
              </p>
            </div>

            {/* Meta Tags Row Array */}
            {alert.metaTags && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {alert.metaTags.map((tag, idx) => (
                  <span key={idx} className="bg-[#151C3A] text-gray-400 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Dynamic Status Action Footer Layer */}
            <div className="flex justify-between items-center pt-2 border-t border-[#161B33]/60 text-[10px] font-bold">
              <span className={`uppercase font-black tracking-wider flex items-center gap-1.5 ${getStatusColor(alert.statusColor)}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {alert.statusText}
              </span>
              <button className="text-blue-400 hover:text-blue-300 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform font-bold">
                VIEW DETAILS <ArrowUpRight size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};