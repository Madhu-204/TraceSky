import React, { useState } from 'react';
import { Download, Sun, Cloud, CloudRain, CloudLightning, ChevronDown, ChevronUp } from 'lucide-react';
import type { HourlyTelemetry } from '../../types/forecast.types';
import { useUnitSystem } from '../../utils/unitConversion';

interface HourlyGranularityTableProps {
  hours: HourlyTelemetry[];
  totalAvailable: number;
}

export const HourlyGranularityTable: React.FC<HourlyGranularityTableProps> = ({ hours, totalAvailable }) => {
  const { temp, wind } = useUnitSystem();
  const [showAll, setShowAll] = useState(false);
  const displayHours = showAll ? hours : hours.slice(0, 48);

  const fetchIcon = (type: string) => {
    switch (type) {
      case 'sunny': return <Sun size={14} className="text-amber-400" />;
      case 'cloudy': return <Cloud size={14} className="text-blue-400" />;
      case 'overcast': return <Cloud size={14} className="text-slate-400" />;
      case 'rain': return <CloudRain size={14} className="text-cyan-400" />;
      default: return <CloudLightning size={14} className="text-indigo-400" />;
    }
  };

  const handleExportCsv = () => {
    const headers = ['Time', 'Condition', `Temperature (${temp(0).unit})`, 'Precipitation Chance (%)', `Wind Speed (${wind(0).unit})`, 'Wind Direction', 'Pressure (hPa)', 'Confidence', `Historical Temp (${temp(0).unit})`, `Deviation (${temp(0).unit})`];
    const rows = hours.map((h) => [
      h.time,
      h.condition,
      h.temperature.toString(),
      h.precipitationChance.toString(),
      h.windSpeed.toString(),
      h.windDirection,
      h.pressure.toString(),
      h.confidence,
      h.historicalTemp != null ? h.historicalTemp.toString() : 'N/A',
      h.tempDeviation != null ? h.tempDeviation.toString() : 'N/A',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'forecast_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">Hourly Granularity</h3>
          <p className="text-xs text-gray-500 mt-0.5">Deep inspection of atmospheric shifts with historical cross-validation.</p>
        </div>
        <button
          onClick={handleExportCsv}
          className="bg-[#121733] border border-[#1C2340] hover:border-gray-700 text-gray-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
        >
          <Download size={13} /> Export CSV
        </button>
      </div>

      <div className="overflow-x-auto w-full pt-2">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-[#161B33] text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="pb-3 pl-2">Time</th>
              <th className="pb-3">Condition</th>
              <th className="pb-3">Temp ({temp(0).unit})</th>
              <th className="pb-3">Yesterday</th>
              <th className="pb-3">Deviation</th>
              <th className="pb-3">Prec. Chance</th>
              <th className="pb-3">Wind</th>
              <th className="pb-3">Pressure</th>
              <th className="pb-3 pr-2 text-right">Confidence</th>
            </tr>
          </thead>
          <tbody className="text-xs font-medium text-gray-300 divide-y divide-[#161B33]/40">
            {displayHours.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-gray-500 italic">No forecast data available</td>
              </tr>
            )}
            {displayHours.map((row, index) => (
              <tr key={index} className="hover:bg-[#111630]/40 transition-colors group">
                <td className="py-3.5 pl-2 font-mono">
                  <span className="text-white font-bold">{row.time}</span>
                  {row.isToday && <span className="text-[9px] text-gray-500 ml-1.5 font-sans font-medium">Today</span>}
                </td>
                <td className="py-3.5">
                  <div className="flex items-center gap-2">
                    {fetchIcon(row.icon)}
                    <span className="text-gray-200 group-hover:text-white transition-colors">{row.condition}</span>
                  </div>
                </td>
                <td className="py-3.5 font-mono text-white font-semibold">{temp(row.temperature).value}{temp(row.temperature).unit}</td>
                <td className="py-3.5 font-mono text-gray-500">
                  {row.historicalTemp != null ? `${temp(row.historicalTemp).value}${temp(row.historicalTemp).unit}` : '--'}
                </td>
                <td className="py-3.5 font-mono">
                  {row.tempDeviation != null ? (
                    <span className={row.tempDeviation <= 2 ? 'text-emerald-400' : row.tempDeviation <= 5 ? 'text-amber-400' : 'text-red-400'}>
                      {row.tempDeviation > 0 ? '+' : ''}{temp(row.tempDeviation).value}{temp(row.tempDeviation).unit}
                    </span>
                  ) : (
                    <span className="text-gray-600">--</span>
                  )}
                </td>
                <td className="py-3.5">
                  <div className="flex items-center gap-2.5 max-w-[100px]">
                    <div className="w-12 h-1 bg-gray-900 rounded-full overflow-hidden shrink-0">
                      <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${row.precipitationChance}%` }} />
                    </div>
                    <span className="font-mono text-[11px] text-gray-400">{row.precipitationChance}%</span>
                  </div>
                </td>
                <td className="py-3.5 font-mono text-gray-400">
                  {wind(row.windSpeed).value} <span className="text-[10px] text-gray-600 font-sans">{row.windDirection}</span>
                </td>
                <td className="py-3.5 font-mono text-gray-400">{row.pressure} hPa</td>
                <td className="py-3.5 pr-2 text-right">
                  <span className={`text-[9px] font-black tracking-wider px-2 py-0.5 rounded font-mono border uppercase ${
                    row.confidence === 'HIGH'
                      ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10'
                      : row.confidence === 'MEDIUM'
                      ? 'bg-amber-500/5 text-amber-400 border-amber-500/10'
                      : 'bg-red-500/5 text-red-400 border-red-500/10'
                  }`}>
                    {row.confidence}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalAvailable > 48 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-center text-xs font-bold text-blue-400/80 hover:text-blue-400 hover:underline transition-all pt-2 flex items-center justify-center gap-1"
        >
          {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showAll ? 'Show less' : `Show ${totalAvailable - 48} more hours`}
        </button>
      )}
    </div>
  );
};
