import React from 'react';
import { Info } from 'lucide-react';
import type { HeatmapSquare } from '../../types/analytics.types';

interface ClimaticIntensityCardProps {
  squares: HeatmapSquare[];
}

export const ClimaticIntensityCard: React.FC<ClimaticIntensityCardProps> = ({ squares }) => {
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const getIntensityColorClass = (val: HeatmapSquare['intensityValue']) => {
    switch (val) {
      case 'none': return 'bg-[#131935]/40';
      case 'low': return 'bg-blue-600/30 border border-blue-500/10';
      case 'medium': return 'bg-sky-400/60';
      case 'high': return 'bg-rose-500/80';
      case 'extreme': return 'bg-amber-400';
    }
  };

  return (
    <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 space-y-5 flex flex-col justify-between shadow-xl">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-black tracking-wider text-gray-500 font-mono uppercase">Climatic Intensity</span>
          <h3 className="text-sm font-bold text-white mt-0.5">Pattern Heatmap</h3>
        </div>
        <button className="text-gray-500 hover:text-gray-300 transition-all">
          <Info size={14} />
        </button>
      </div>

      {/* Calendar Style Chronological Multi-Week Heatmap Matrix Grid */}
      <div className="space-y-3 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-7 gap-2.5 text-center text-[9px] font-mono font-bold text-gray-500">
          {dayLabels.map((lbl, idx) => <span key={idx}>{lbl}</span>)}
        </div>

        <div className="grid grid-cols-7 gap-2.5">
          {squares.map((sq, index) => (
            <div
              key={index}
              className={`aspect-square rounded-sm ${getIntensityColorClass(sq.intensityValue)} transition-all hover:scale-110 cursor-pointer`}
            />
          ))}
        </div>
      </div>

      {/* Dynamic Spectrum Color Gradient Threshold Footnote Legend */}
      <div className="flex justify-between items-center text-[9px] font-mono font-bold text-gray-500 pt-2 border-t border-[#151B35]">
        <span>Low Intensity</span>
        <div className="w-24 h-1.5 rounded bg-gradient-to-r from-blue-600/40 via-rose-500/60 to-amber-400 mx-2" />
        <span>Extreme</span>
      </div>
    </div>
  );
};