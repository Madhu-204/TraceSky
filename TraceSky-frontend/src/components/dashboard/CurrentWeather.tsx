import React from 'react';
import { useUnitSystem } from '../../utils/unitConversion';
import { CloudRainWind, Droplets, Wind, Sun } from 'lucide-react';
import type { CurrentTelemetry } from '../../types/weather.types';

interface CurrentWeatherProps {
  data: CurrentTelemetry;
}

export const CurrentWeather: React.FC<CurrentWeatherProps> = ({ data }) => {
  const { temp, wind, precip } = useUnitSystem();
  return (
    <div className="bg-gradient-to-br from-[#111827] via-[#0E1322] to-[#1E1B4B]/20 border border-gray-800/80 p-6 md:p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.06),transparent_55%)] pointer-events-none" />

      <div className="space-y-3 w-full">
        <p className="text-xs font-bold tracking-widest text-blue-400 uppercase flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
          {data.location}
        </p>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight max-w-xl">
          {data.condition}
        </h2>

        <div className="flex flex-wrap items-end gap-6 sm:gap-10 pt-4">
          <div>
            <span className="text-5xl sm:text-6xl font-black tracking-tighter text-white relative">
              {temp(data.temperature).value}
              <span className="text-2xl sm:text-3xl font-light text-blue-400 align-top ml-0.5">{temp(data.temperature).unit}</span>
            </span>
            <p className="text-xs text-gray-400 mt-1 font-medium">Partly Cloudy • Feels like {temp(data.feelsLike).value}{temp(data.feelsLike).unit}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 border-t sm:border-t-0 sm:border-l border-gray-800/80 pt-3 sm:pt-0 sm:pl-8 text-xs text-gray-400 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-gray-800/30">
              <Droplets size={14} className="text-blue-400" />
              <span>Humidity: <strong className="text-white font-semibold">{data.humidity}%</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-gray-800/30">
              <Wind size={14} className="text-cyan-400" />
              <span>Wind: <strong className="text-white font-semibold">{wind(data.windSpeed).value}{wind(data.windSpeed).unit}</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-gray-800/30">
              <Sun size={14} className="text-amber-400" />
              <span>UV Index: <strong className="text-white font-semibold">{data.uvIndex}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden sm:flex w-24 h-24 md:w-32 md:h-32 bg-blue-500/10 rounded-2xl md:rounded-3xl items-center justify-center border border-blue-500/20 shrink-0 self-end md:self-center" style={{ boxShadow: 'var(--color-shadow-card)' }}>
        <CloudRainWind size={54} className="text-blue-400" style={{ filter: 'drop-shadow(var(--color-drop-shadow))' }} />
      </div>
    </div>
  );
};