import React from 'react';
import { Droplets, Wind, CloudFog } from 'lucide-react';

export const MetricsGrid: React.FC = () => {
  const rainfallBars = [12, 18, 32, 54, 42, 22, 10];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

      {/* CARD 1: RAINFALL PROBABILITY */}
      <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 flex flex-col justify-between min-h-[180px]">
        <div className="flex justify-between items-start">
          <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Rainfall Probability</p>
          <Droplets size={14} className="text-blue-400" />
        </div>

        {/* Histogram Column Bar Sets */}
        <div className="h-20 flex items-end justify-between gap-2 px-1 mt-4">
          {rainfallBars.map((bar, idx) => (
            <div key={idx} className="w-full bg-[#151B33] rounded-t-sm h-full flex items-end">
              <div
                className={`w-full rounded-t-sm transition-all duration-300 ${idx === 3 ? 'bg-cyan-500' : 'bg-cyan-500/30'}`}
                style={{ height: `${bar}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-gray-600 font-bold tracking-wider mt-2 px-0.5">
          <span>DAY 1</span>
          <span>DAY 7</span>
        </div>
      </div>

      {/* CARD 2: HUMIDITY INDEX */}
      <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 flex flex-col justify-between min-h-[180px]">
        <div className="flex justify-between items-start">
          <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Humidity Index</p>
          <CloudFog size={14} className="text-slate-400" />
        </div>

        {/* Micro Sine Wave Component Node */}
        <div className="h-14 flex items-center justify-center relative my-auto">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 40">
            <path d="M 0 20 Q 50 5, 100 20 T 200 20" fill="none" stroke="#2563EB" strokeWidth={2} />
            <circle cx="120" cy="15" r="3" fill="#60A5FA" className="animate-pulse" />
          </svg>
        </div>

        <div className="flex justify-between items-center mt-2">
          <span className="text-lg font-black text-white font-mono">64% <span className="text-xs font-normal text-gray-500">avg</span></span>
          <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-extrabold uppercase">
            Optimal
          </span>
        </div>
      </div>

      {/* CARD 3: WIND VELOCITY RADIAL GAUGING */}
      <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 flex flex-col justify-between min-h-[180px]">
        <div className="flex justify-between items-start">
          <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Wind Speed</p>
          <Wind size={14} className="text-amber-500" />
        </div>

        {/* Fill Area Chart Layer */}
        <div className="h-16 w-full relative mt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 50" preserveAspectRatio="none">
            <path d="M 0 45 Q 40 10, 100 35 T 200 20 L 200 50 L 0 50 Z" fill="rgba(245,158,11,0.06)" />
            <path d="M 0 45 Q 40 10, 100 35 T 200 20" fill="none" stroke="#F59E0B" strokeWidth={1.5} />
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <span className="text-2xl font-black font-mono tracking-tight text-white">14.2</span>
            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider font-mono">km/h avg</p>
          </div>
        </div>
      </div>

    </div>
  );
};