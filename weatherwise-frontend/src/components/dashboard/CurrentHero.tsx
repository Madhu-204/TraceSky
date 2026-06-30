import React from 'react';
import { MapPin, Droplets, Wind, Sun, Cloud, CloudRain, CloudLightning, CloudSun } from 'lucide-react';

export const CurrentHero: React.FC = () => {
  return (
    <div className="bg-[#0E1328] border border-[#1C2345] p-6 sm:p-8 rounded-3xl grid grid-cols-1 xl:grid-cols-12 gap-6 relative overflow-hidden shadow-xl">
      {/* Decorative Blur Backing */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />

      {/* Left Data Content */}
      <div className="xl:col-span-8 space-y-4">
        <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[11px] tracking-widest uppercase">
          <MapPin size={12} className="text-blue-500" /> San Francisco, CA
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-[1.15] max-w-2xl">
          Unstable atmospheric pressure detected.
        </h2>

        <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-2">
          <div className="flex items-baseline">
            <span className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tighter">18.5</span>
            <span className="text-2xl font-light text-blue-400 ml-0.5">°C</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-2 text-[10px] font-mono">
              <span className="bg-[#121836] border border-[#1F2954] text-gray-300 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <Droplets size={11} className="text-blue-400" /> Humidity: 64%
              </span>
              <span className="bg-[#121836] border border-[#1F2954] text-gray-300 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <Wind size={11} className="text-cyan-400" /> Wind: 14km/h NW
              </span>
              <span className="bg-[#121836] border border-[#1F2954] text-gray-300 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <Sun size={11} className="text-amber-400" /> UV Index: 4 (Mod)
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium pl-0.5">Partly Cloudy • Feels like 16°</p>
          </div>
        </div>
      </div>

      {/* Right Hourly Micro Panel */}
      <div className="xl:col-span-4 flex flex-col justify-between items-end gap-4 border-t xl:border-t-0 xl:border-l border-[#1C2345] pt-4 xl:pt-0 xl:pl-6">
        {/* Visual Cloud Indicator Icon */}
        <div className="relative w-24 h-14 hidden xl:block">
          <div className="absolute top-0 right-2 w-16 h-16 bg-cyan-400/20 rounded-full blur-xl" />
          <Cloud size={48} className="absolute right-0 text-gray-400" />
        </div>

        {/* Next 5 Hours Forecast Panel Box Container */}
        <div className="w-full bg-[#111630] border border-[#1D254C] rounded-xl p-3.5 space-y-3">
          <p className="text-[9px] font-bold text-gray-500 tracking-wider uppercase">Next 5 Hours Prediction</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="space-y-1 bg-[#0E1328]/50 p-1.5 rounded-lg border border-[#1A213D]">
              <p className="text-[10px] text-gray-500 font-mono">14:00</p>
              <Sun size={14} className="text-yellow-400 mx-auto" />
              <p className="text-xs font-bold text-white font-mono">19°</p>
            </div>
            <div className="space-y-1 bg-[#0E1328]/50 p-1.5 rounded-lg border border-[#1A213D]">
              <p className="text-[10px] text-gray-500 font-mono">15:00</p>
              <Cloud size={14} className="text-gray-400 mx-auto" />
              <p className="text-xs font-bold text-white font-mono">18°</p>
            </div>
            <div className="space-y-1 bg-[#0E1328]/50 p-1.5 rounded-lg border border-[#1A213D]">
              <p className="text-[10px] text-gray-500 font-mono">16:00</p>
              <CloudRain size={14} className="text-cyan-400 mx-auto" />
              <p className="text-xs font-bold text-white font-mono">17°</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};