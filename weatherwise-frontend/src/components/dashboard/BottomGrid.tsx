import React from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, CloudSun, Droplets, Shield } from 'lucide-react';

const getWeatherIcon = (icon: string) => {
  switch (icon) {
    case 'sun': return <Sun size={18} className="text-yellow-400" />;
    case 'cloud': return <Cloud size={18} className="text-gray-400" />;
    case 'rain': return <CloudRain size={18} className="text-cyan-400" />;
    case 'storm': return <CloudLightning size={18} className="text-yellow-500" />;
    case 'partly': return <CloudSun size={18} className="text-blue-400" />;
    default: return <Sun size={18} className="text-yellow-400" />;
  }
};

export const BottomGrid: React.FC = () => {
  const forecastDays = [
    { day: 'MON', icon: 'sun', high: 22, low: 14, pop: 0 },
    { day: 'TUE', icon: 'cloud', high: 18, low: 12, pop: 15, current: true },
    { day: 'WED', icon: 'rain', high: 16, low: 11, pop: 85 },
    { day: 'THU', icon: 'storm', high: 14, low: 9, pop: 92 },
    { day: 'FRI', icon: 'partly', high: 17, low: 12, pop: 48 },
    { day: 'SAT', icon: 'sun', high: 28, low: 15, pop: 5 },
    { day: 'SUN', icon: 'sun', high: 24, low: 16, pop: 0 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* 7-DAY MATRIX BLOCK PANEL */}
      <div className="lg:col-span-8 bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 space-y-5">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Extended 7-Day Matrix</p>
          <button className="text-[11px] text-blue-400 font-bold hover:underline transition-all flex items-center gap-1 uppercase tracking-wider">
            Detailed View &gt;
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {forecastDays.map((d, index) => (
            <div
              key={index}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-between gap-3 relative ${
                d.current
                  ? 'bg-[#121A3B] border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.05)]'
                  : 'bg-[#11162E]/40 border-[#1B2240]'
              }`}
            >
              {d.current && (
                <span className="absolute -top-2 bg-blue-500 text-white text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded uppercase">
                  Today
                </span>
              )}
              <span className="text-[10px] font-bold text-gray-500 tracking-wider">{d.day}</span>
              <span className="text-lg">{getWeatherIcon(d.icon)}</span>
              <div className="text-center font-mono">
                <p className="text-xs font-bold text-white">{d.high}°</p>
                <div className="w-3 h-[1px] bg-gray-800 my-0.5 mx-auto" />
                <p className="text-[11px] text-gray-500">{d.low}°</p>
              </div>
              <span className="text-[9px] font-mono font-bold text-blue-400 flex items-center gap-0.5">
                <Droplets size={10} className="text-blue-400" />{d.pop}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* XAI INTERPRETABILITY SYSTEM CARD */}
      <div className="lg:col-span-4 bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 flex flex-col justify-between min-h-[250px]">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">XAI Core Logic</p>
            <button className="text-[9px] bg-blue-600/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold tracking-wide uppercase">
              Why this forecast?
            </button>
          </div>
          <p className="text-xs text-gray-400 italic leading-relaxed pl-3 border-l border-blue-500">
            "The 85% precipitation probability is driven primarily by a deepening low-pressure trough over the Pacific, reinforced by anomalous humidity readings from IOT buoy-77."
          </p>
        </div>

        {/* Confidence Progress Matrix */}
        <div className="space-y-2 font-mono text-[10px] pt-4 border-t border-[#1C2340]">
          <div className="space-y-1">
            <div className="flex justify-between text-gray-400"><span className="font-sans">HUMIDITY GRADIENT</span><span className="text-emerald-400 font-bold">+0.42 SHAP</span></div>
            <div className="w-full h-1 bg-gray-900 rounded-full"><div className="h-full bg-emerald-500 rounded-full w-[65%]" /></div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-gray-400"><span className="font-sans">PRESSURE TROUGH</span><span className="text-emerald-400 font-bold">+0.28 SHAP</span></div>
            <div className="w-full h-1 bg-gray-900 rounded-full"><div className="h-full bg-emerald-500 rounded-full w-[45%]" /></div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-gray-400"><span className="font-sans">WIND SHEAR</span><span className="text-red-400 font-bold">-0.12 SHAP</span></div>
            <div className="w-full h-1 bg-gray-900 rounded-full"><div className="h-full bg-red-400 rounded-full w-[20%]" /></div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#1C2340] flex items-center gap-2">
          <Shield size={14} className="text-green-400" />
          <div>
            <p className="text-[11px] font-bold text-white font-mono">Confidence Score: 94.2%</p>
            <p className="text-[10px] text-gray-500">Based on 1.4B ingestion endpoints</p>
          </div>
        </div>
      </div>

    </div>
  );
};