import React from 'react';
import { useUnitSystem } from '../../utils/unitConversion';
import { Droplets } from 'lucide-react';
import type { MatrixDay } from '../../types/weather.types';

interface ForecastCardProps {
  days: MatrixDay[];
  onDetailedView?: () => void;
}

export const ForecastCard: React.FC<ForecastCardProps> = ({ days, onDetailedView }) => {
  const { temp, wind, precip } = useUnitSystem();
  return (
    <div className="bg-[#111827] border border-gray-800/80 p-6 rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-sm text-gray-200 tracking-wide">EXTENDED 7-DAY MATRIX</h3>
        <button
          onClick={onDetailedView}
          className="text-[11px] text-blue-400 font-bold hover:underline transition-all uppercase tracking-wider cursor-pointer"
        >
          Detailed View &gt;
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {days.map((day, index) => {
          const isToday = index === 1;
          return (
            <div
              key={index}
              className={`p-4 rounded-xl border flex flex-col items-center justify-between gap-4 transition-all duration-200 ${
                isToday
                  ? 'bg-blue-600/10 border-blue-500/40 relative'
                  : 'bg-slate-900/40 border-gray-800/60 hover:border-gray-700/80'
              }`}
              style={isToday ? { boxShadow: 'var(--color-shadow-subtle)' } : undefined}
            >
              {isToday && (
                <span className="absolute -top-2 bg-blue-500 text-white text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded-md uppercase transform scale-90">
                  Today
                </span>
              )}
              <span className="text-[11px] font-bold text-gray-400 tracking-wider">{day.day}</span>
              <div className="text-xl font-mono p-1">{day.icon}</div>
              <div className="text-center font-mono">
                <p className="text-sm font-bold text-white">{temp(day.high).value}{temp(day.high).unit}</p>
                <div className="w-4 h-[1px] bg-gray-800 my-1 mx-auto" />
                <p className="text-xs text-gray-500">{temp(day.low).value}{temp(day.low).unit}</p>
              </div>
              <span className="text-[10px] text-blue-400 font-bold font-mono tracking-tighter bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/10 flex items-center gap-1">
                <Droplets size={10} />{day.pop}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};