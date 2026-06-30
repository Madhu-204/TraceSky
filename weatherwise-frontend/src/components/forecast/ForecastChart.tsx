import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { ChartDatapoint } from '../../types/forecast.types';

interface ForecastChartProps {
  data: ChartDatapoint[];
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ data }) => {
  const [activeRange, setActiveRange] = useState<'24H' | '7D' | '30D' | '3M'>('24H');

  return (
    <div className="bg-[#0E1328] border border-[#1C2345] p-6 rounded-2xl space-y-6 relative">
      {/* Header Controls Matrix */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Temperature Trend</p>
          <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">Mean Surface Delta</h3>
        </div>

        {/* Toggle Controls to perfectly mirror the UI */}
        <div className="flex items-center gap-1 bg-[#070A14] p-1 border border-[#1C2340] rounded-xl self-end sm:self-auto">
          {(['24H', '7D', '30D', '3M'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={`px-3 py-1.5 text-[11px] font-bold tracking-wide rounded-lg transition-all ${
                activeRange === range
                  ? 'bg-blue-600 text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Tooltip Legend Overlay */}
      <div className="flex items-center gap-4 text-[11px] font-medium text-gray-400 justify-end">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-blue-400 block" /> Predicted
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 border-t border-dashed border-gray-600 block" /> Historical
        </div>
      </div>

      {/* Primary Spline Rendering Workspace Container */}
      <div className="h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="predictedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#161B33" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#4B5563"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#4B5563"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dx={-5}
              domain={['auto', 'auto']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#111630] border border-[#252E5C] rounded-xl p-3 shadow-2xl max-w-[180px] font-mono">
                      <p className="text-xs font-bold text-gray-400 mb-2">{payload[0].payload.time} - 24.2°C</p>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-500 font-sans">HUMIDITY INFLUENCE</span>
                          <span className="text-blue-400 font-bold">+0.84</span>
                        </div>
                        <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full w-[84%]" />
                        </div>
                        <div className="flex justify-between gap-4 pt-1">
                          <span className="text-gray-500 font-sans">WIND SHEAR</span>
                          <span className="text-red-400 font-bold">-0.32</span>
                        </div>
                        <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                          <div className="bg-red-500 h-full w-[32%]" />
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Native dashed and baseline paths */}
            <Area type="monotone" dataKey="historical" stroke="#374151" strokeDasharray="4 4" fill="none" strokeWidth={1.5} />
            <Area type="monotone" dataKey="predicted" stroke="#60A5FA" strokeWidth={2} fill="url(#predictedGrad)" />
            <ReferenceLine x="16:00" stroke="#2563EB" strokeDasharray="3 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};