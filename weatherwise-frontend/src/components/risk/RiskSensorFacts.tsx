import React from 'react';
import type { SensorFact } from '../../types/expert.types';
import type { CurrentTelemetry } from '../../types/riskMonitor.types';
import { Thermometer, Droplets, Wind, CloudRain, Sun, Eye } from 'lucide-react';

interface RiskSensorFactsProps {
  sensorFacts: SensorFact[];
  currentTelemetry: CurrentTelemetry | null;
}

const factIconMap: Record<string, React.ReactNode> = {
  temperature: <Thermometer size={14} />,
  humidity: <Droplets size={14} />,
  wind_speed: <Wind size={14} />,
  precipitation: <CloudRain size={14} />,
  uv_index: <Sun size={14} />,
  feels_like: <Thermometer size={14} />,
};

const factLabelMap: Record<string, string> = {
  temperature: 'Temperature',
  feels_like: 'Feels Like',
  humidity: 'Humidity',
  wind_speed: 'Wind Speed',
  precipitation: 'Precipitation',
  uv_index: 'UV Index',
  weather_code: 'Weather Code',
  wind_direction: 'Wind Direction',
};

const factUnitMap: Record<string, string> = {
  temperature: '°C',
  feels_like: '°C',
  humidity: '%',
  wind_speed: 'km/h',
  precipitation: 'mm',
  uv_index: '',
};

export const RiskSensorFacts: React.FC<RiskSensorFactsProps> = ({ sensorFacts, currentTelemetry }) => {
  if (!sensorFacts.length && !currentTelemetry) {
    return (
      <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5">
        <p className="text-xs text-gray-500">No sensor data available</p>
      </div>
    );
  }

  const displayFacts = sensorFacts.filter(f => f.source === 'sensor').slice(0, 8);

  return (
    <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-2">
          <Eye size={14} className="text-blue-400" />
          Today's Telemetry
        </h3>
        <span className="text-[9px] font-mono text-gray-500">Sensor Input</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {displayFacts.map((fact) => {
          const label = factLabelMap[fact.name] || fact.name.replace(/_/g, ' ');
          const unit = factUnitMap[fact.name] || '';
          const displayValue = typeof fact.value === 'number' ? fact.value.toFixed(1) : fact.value;

          return (
            <div key={fact.name} className="bg-[#0A0E22] border border-[#161D3A] rounded-lg p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                  {factIconMap[fact.name] || null}
                  {label}
                </div>
                <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${fact.certainty >= 0.9 ? 'text-emerald-400 bg-emerald-500/10' : fact.certainty >= 0.7 ? 'text-amber-400 bg-amber-500/10' : 'text-red-400 bg-red-500/10'}`}>
                  {Math.round(fact.certainty * 100)}%
                </span>
              </div>
              <p className="text-sm font-bold text-white font-mono">
                {displayValue}{unit}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
