import React from 'react';
import { useUnitSystem } from '../../utils/unitConversion';
import { MapPin, Droplets, Wind, Sun, Cloud, CloudRain, CloudLightning, CloudSun, CloudFog } from 'lucide-react';
import type { CurrentWeather, HourlyForecast } from '../../services/weatherService';

interface CurrentHeroProps {
  cityName: string;
  current: CurrentWeather | null;
  hourly: HourlyForecast[];
  isLoading: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  sunny: <Sun size={48} className="text-yellow-400" />,
  cloudy: <Cloud size={48} className="text-gray-400" />,
  overcast: <Cloud size={48} className="text-slate-400" />,
  rain: <CloudRain size={48} className="text-cyan-400" />,
  storm: <CloudLightning size={48} className="text-yellow-500" />,
  snow: <CloudFog size={48} className="text-blue-200" />,
  fog: <CloudFog size={48} className="text-gray-400" />,
  drizzle: <CloudRain size={48} className="text-cyan-300" />,
};

const smallIconMap: Record<string, React.ReactNode> = {
  sunny: <Sun size={14} className="text-yellow-400" />,
  cloudy: <Cloud size={14} className="text-gray-400" />,
  overcast: <Cloud size={14} className="text-slate-400" />,
  rain: <CloudRain size={14} className="text-cyan-400" />,
  storm: <CloudLightning size={14} className="text-yellow-500" />,
  snow: <CloudFog size={14} className="text-blue-200" />,
  fog: <CloudFog size={14} className="text-gray-400" />,
  drizzle: <CloudRain size={14} className="text-cyan-300" />,
};

function windDirectionLabel(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

export const CurrentHero: React.FC<CurrentHeroProps> = ({ cityName, current, hourly, isLoading }) => {
  const { temp, wind, precip } = useUnitSystem();
  if (isLoading || !current) {
    return (
      <div className="bg-[#0E1328] border border-[#1C2345] p-6 sm:p-8 rounded-3xl grid grid-cols-1 xl:grid-cols-12 gap-6 relative overflow-hidden shadow-xl min-h-[200px] flex items-center justify-center">
        <p className="text-gray-500 text-sm font-medium">{isLoading ? 'Loading telemetry...' : 'No data available'}</p>
      </div>
    );
  }

  const nextHours = hourly.slice(0, 5);

  return (
    <div className="bg-[#0E1328] border border-[#1C2345] p-6 sm:p-8 rounded-3xl grid grid-cols-1 xl:grid-cols-12 gap-6 relative overflow-hidden shadow-xl">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />

      <div className="xl:col-span-8 space-y-4">
        <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[11px] tracking-widest uppercase">
          <MapPin size={12} className="text-blue-500" /> {cityName}
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-[1.15] max-w-2xl">
          {current.condition}
        </h2>

        <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-2">
          <div className="flex items-baseline">
            <span className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tighter">
              {temp(current.temperature).value}
            </span>
            <span className="text-2xl font-light text-blue-400 ml-0.5">{temp(current.temperature).unit}</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-2 text-[10px] font-mono">
              <span className="bg-[#121836] border border-[#1F2954] text-gray-300 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <Droplets size={11} className="text-blue-400" /> Humidity: {Math.round(current.humidity)}%
              </span>
              <span className="bg-[#121836] border border-[#1F2954] text-gray-300 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <Wind size={11} className="text-cyan-400" /> Wind: {wind(current.wind_speed).value}{wind(current.wind_speed).unit} {windDirectionLabel(current.wind_direction)}
              </span>
              <span className="bg-[#121836] border border-[#1F2954] text-gray-300 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <Sun size={11} className="text-amber-400" /> UV Index: {Math.round(current.uv_index)}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium pl-0.5">
              {current.condition} • Feels like {temp(current.feels_like).value}{temp(current.feels_like).unit}
            </p>
          </div>
        </div>
      </div>

      <div className="xl:col-span-4 flex flex-col justify-between items-end gap-4 border-t xl:border-t-0 xl:border-l border-[#1C2345] pt-4 xl:pt-0 xl:pl-6">
        <div className="relative w-24 h-14 hidden xl:block">
          <div className="absolute top-0 right-2 w-16 h-16 bg-cyan-400/20 rounded-full blur-xl" />
          {iconMap[current.icon] || <Cloud size={48} className="absolute right-0 text-gray-400" />}
        </div>

        <div className="w-full bg-[#111630] border border-[#1D254C] rounded-xl p-3.5 space-y-3">
          <p className="text-[9px] font-bold text-gray-500 tracking-wider uppercase">Next 5 Hours Prediction</p>
          <div className="grid grid-cols-5 gap-1 text-center">
            {nextHours.map((h, i) => (
              <div key={i} className="space-y-1 bg-[#0E1328]/50 p-1.5 rounded-lg border border-[#1A213D]">
                <p className="text-[10px] text-gray-500 font-mono">{h.time}</p>
                <div className="mx-auto">{smallIconMap[h.icon] || <Cloud size={14} className="text-gray-400 mx-auto" />}</div>
                <p className="text-xs font-bold text-white font-mono">{h.temperature != null ? `${temp(h.temperature).value}${temp(h.temperature).unit}` : '--'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
