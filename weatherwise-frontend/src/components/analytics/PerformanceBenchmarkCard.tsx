import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import type { BenchmarkRow } from '../../types/analytics.types';

interface PerformanceBenchmarkCardProps {
  rows: BenchmarkRow[];
}

export const PerformanceBenchmarkCard: React.FC<PerformanceBenchmarkCardProps> = ({ rows }) => {
  return (
    <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 shadow-xl flex flex-col justify-between h-[320px]">
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-black tracking-wider text-gray-500 font-mono uppercase">Performance Benchmark</span>
          <h3 className="text-sm font-bold text-white mt-0.5">Model Comparison Audit</h3>
        </div>

        {/* Dense Ingestion Verification Data Table Ledger Matrix */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#161C38] text-[9px] font-mono font-black text-gray-500 uppercase tracking-wider">
                <th className="pb-2 font-black">Variable (Last 24h)</th>
                <th className="pb-2">OpenWeather</th>
                <th className="pb-2 text-blue-400 font-bold">WeatherWise AI</th>
                <th className="pb-2">Actual Observed</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151B35]/40 text-xs font-semibold">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#131936]/30 transition-all">
                  <td className="py-2.5 text-gray-400 font-medium">
                    {row.variable} <span className="text-[10px] font-mono text-gray-500">{row.unit}</span>
                  </td>
                  <td className="py-2.5 text-gray-400 font-mono font-medium">{row.openWeatherVal}</td>
                  <td className="py-2.5 text-white font-mono font-bold">{row.weatherWiseVal}</td>
                  <td className="py-2.5 text-gray-300 font-mono">{row.actualObserved}</td>
                  <td className="py-2.5 text-right flex justify-end pt-3">
                    {row.status === 'optimal' ? (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    ) : (
                      <AlertTriangle size={14} className="text-amber-400 animate-pulse" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Source Architecture Ledger Footer Metadata */}
      <div className="flex justify-between items-center text-[10px] font-mono font-bold text-gray-500 pt-3 border-t border-[#161C38]">
        <span>Audit conducted automatically every 6 hours via edge nodes.</span>
        <button className="text-blue-400 hover:text-blue-300 transition-all font-bold">
          View Detailed Audit Logs &rarr;
        </button>
      </div>
    </div>
  );
};