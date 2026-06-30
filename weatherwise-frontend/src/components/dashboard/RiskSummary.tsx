import React from 'react';
import { ShieldAlert } from 'lucide-react';
import type { RiskFactor } from '../../types/weather.types';

interface RiskSummaryProps {
  risks: RiskFactor[];
}

export const RiskSummary: React.FC<RiskSummaryProps> = ({ risks }) => {
  return (
    <div className="bg-[#111827] border border-gray-800/80 p-6 rounded-2xl flex flex-col justify-between h-full min-h-[250px]">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-sm text-gray-200 flex items-center gap-2 tracking-wide">
            <ShieldAlert size={16} className="text-red-400" /> CRITICAL RISK ASSESSMENT
          </h3>
          <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
            {risks.length} Active Risks
          </span>
        </div>

        <div className="space-y-4">
          {risks.map((risk) => (
            <div key={risk.id} className="group">
              <div className="flex justify-between text-xs font-medium mb-2">
                <span className="text-gray-300 group-hover:text-white transition-colors">{risk.name}</span>
                <span className={`font-bold ${
                  risk.severity === 'High' ? 'text-red-400' : risk.severity === 'Moderate' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {risk.percentage}% {risk.severity}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    risk.severity === 'High' ? 'bg-red-500' : risk.severity === 'Moderate' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${risk.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};