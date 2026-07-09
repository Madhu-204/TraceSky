import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { ChartDatapoint } from '../../types/forecast.types';

interface ForecastChartProps {
  data: ChartDatapoint[];
  activeRange: string;
  onRangeChange: (range: string) => void;
  averageConfidence?: number;
  averageDeviation?: number | null;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  data, activeRange, onRangeChange, averageConfidence, averageDeviation,
}) => {
  const ranges = ['24H', '7D', '30D', '3M'];

  return (
    <div className="bg-[#0E1328] border border-[#1C2345] p-6 rounded-2xl space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Temperature Trend</p>
            <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">Predicted vs Historical</h3>
          </div>
          {averageDeviation != null && (
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
              (averageDeviation ?? 99) <= 2 ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
              (averageDeviation ?? 99) <= 5 ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' :
              'text-red-400 border-red-500/20 bg-red-500/10'
            }`}>
              &Delta;{averageDeviation}°C avg
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-[#070A14] p-1 border border-[#1C2340] rounded-xl self-end sm:self-auto">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => onRangeChange(range)}
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

      <div className="flex items-center gap-4 text-[11px] font-medium text-gray-400 justify-end">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-blue-400 block" /> Predicted
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 border-t border-dashed border-gray-600 block" /> Yesterday
        </div>
      </div>

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
                  const d = payload[0]?.payload as ChartDatapoint;
                  return (
                    <div className="bg-[#111630] border border-[#252E5C] rounded-xl p-3 shadow-2xl min-w-[160px] font-mono">
                      <p className="text-xs font-bold text-gray-400 mb-2">{d.time}</p>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-500 font-sans">PREDICTED</span>
                          <span className="text-blue-400 font-bold">{d.predicted}°C</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-500 font-sans">YESTERDAY</span>
                          <span className="text-gray-400">{d.historical}°C</span>
                        </div>
                        {d.tempDeviation != null && (
                          <>
                            <div className="border-t border-[#1C2340] pt-1 mt-1" />
                            <div className="flex justify-between gap-4">
                              <span className="text-gray-500 font-sans">DEVIATION</span>
                              <span className={d.tempDeviation <= 2 ? 'text-emerald-400' : d.tempDeviation <= 5 ? 'text-amber-400' : 'text-red-400'}>
                                {d.tempDeviation > 0 ? '+' : ''}{d.tempDeviation}°C
                              </span>
                            </div>
                          </>
                        )}
                        {d.humidityDeviation != null && (
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-500 font-sans">HUMIDITY</span>
                            <span className="text-blue-400">{d.humidityDeviation > 0 ? '+' : ''}{d.humidityDeviation}%</span>
                          </div>
                        )}
                        {d.windDeviation != null && (
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-500 font-sans">WIND</span>
                            <span className="text-amber-400">{d.windDeviation > 0 ? '+' : ''}{d.windDeviation}km/h</span>
                          </div>
                        )}
                        {d.rateDeviation != null && (
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-500 font-sans">RATE CHANGE</span>
                            <span className={d.rateDeviation <= 2 ? 'text-emerald-400' : d.rateDeviation <= 4 ? 'text-amber-400' : 'text-red-400'}>
                              &Delta;{d.rateDeviation}°C/h
                            </span>
                          </div>
                        )}
                        {d.forecastRate != null && d.historicalRate != null && (
                          <div className="flex justify-between gap-4 text-[10px]">
                            <span className="text-gray-600 font-sans">Forecast {d.forecastRate > 0 ? '+' : ''}{d.forecastRate}°C · Yesterday {d.historicalRate > 0 ? '+' : ''}{d.historicalRate}°C</span>
                          </div>
                        )}
                        {d.confidenceStatus && (
                          <div className="flex justify-between gap-4 pt-1">
                            <span className="text-gray-500 font-sans">CONFIDENCE</span>
                            <span className={
                              d.confidenceStatus === 'HIGH' ? 'text-emerald-400' :
                              d.confidenceStatus === 'MEDIUM' ? 'text-amber-400' : 'text-red-400'
                            }>
                              {d.confidenceStatus}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area type="monotone" dataKey="historical" stroke="#374151" strokeDasharray="4 4" fill="none" strokeWidth={1.5} />
            <Area type="monotone" dataKey="predicted" stroke="#60A5FA" strokeWidth={2} fill="url(#predictedGrad)" />
            <ReferenceLine x="16:00" stroke="#2563EB" strokeDasharray="3 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
