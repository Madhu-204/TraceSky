import React from 'react';
import { ForecastChart } from '../components/forecast/ForecastChart';
import { MetricsGrid } from '../components/forecast/MetricsGrid';
import { HourlyGranularityTable } from '../components/forecast/HourlyGranularityTable';
import type { ChartDatapoint, HourlyTelemetry } from '../types/forecast.types';
import { Cpu } from 'lucide-react';

export const ForecastPage: React.FC = () => {
  // Pure static datasets matching the metrics of screen 4 & 5
  const splinesDataset: ChartDatapoint[] = [
    { time: '00:00', predicted: 20.5, historical: 19.8 },
    { time: '04:00', predicted: 19.1, historical: 18.5 },
    { time: '08:00', predicted: 21.4, historical: 20.0 },
    { time: '12:00', predicted: 26.8, historical: 23.2 },
    { time: '16:00', predicted: 24.2, historical: 21.0 },
    { time: '20:00', predicted: 28.5, historical: 25.4 },
    { time: '23:59', predicted: 22.1, historical: 20.8 },
  ];

  const granularityRows: HourlyTelemetry[] = [
    { time: '14:00', isToday: true, condition: 'Partly Cloudy', icon: 'cloudy', temperature: 24.2, precipitationChance: 15, windSpeed: 12.5, windDirection: 'NW', pressure: 1012, confidence: 'HIGH' },
    { time: '15:00', isToday: true, condition: 'Clear Sky', icon: 'sunny', temperature: 25.1, precipitationChance: 5, windSpeed: 10.2, windDirection: 'W', pressure: 1011, confidence: 'HIGH' },
    { time: '16:00', isToday: true, condition: 'Overcast', icon: 'overcast', temperature: 23.8, precipitationChance: 40, windSpeed: 15.8, windDirection: 'N', pressure: 1009, confidence: 'MEDIUM' },
    { time: '17:00', isToday: true, condition: 'Light Rain', icon: 'rain', temperature: 21.5, precipitationChance: 85, windSpeed: 22.4, windDirection: 'NW', pressure: 1005, confidence: 'LOW' },
  ];

  return (
    <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 space-y-6 lg:ml-64 bg-[#070A14] min-h-screen text-gray-100 transition-all">

      {/* SECTION 1: Page Title Header Node */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">Atmospheric Forecast</h2>
        <p className="text-xs text-gray-500 mt-0.5">Predictive environmental modeling for the next 48 hours and long-term trends.</p>
      </div>

      {/* SECTION 2: Spline Analytic Workbench */}
      <ForecastChart data={splinesDataset} />

      {/* SECTION 3: Tri-Item Subscale Visual Grid */}
      <MetricsGrid />

      {/* SECTION 4: Comprehensive Granular Tabular Component Layout */}
      <HourlyGranularityTable hours={granularityRows} />

      {/* SECTION 5: Core Active LLM Parameter Dashboard Footer */}
      <div className="bg-[#0A0E22] border border-[#161D3A] px-5 py-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/5 rounded-lg border border-blue-500/20 text-blue-400">
            <Cpu size={14} />
          </div>
          <div>
            <p className="text-white font-bold tracking-wide">W-AI-Core V4.2 Model Active</p>
            <p className="text-[10px] text-gray-500 font-medium">Latest sync: 2 minutes ago. Data ingested from 42 local sensor nodes.</p>
          </div>
        </div>

        <div className="flex items-center gap-6 font-mono text-[11px] w-full sm:w-auto justify-between sm:justify-end text-gray-400 border-t sm:border-t-0 border-[#1C2340] pt-2 sm:pt-0">
          <div>Overall Confidence: <span className="text-white font-bold">98.4%</span></div>
          <div>Inference Latency: <span className="text-white font-bold">0.12s</span></div>
          <div>Training Delta: <span className="text-white font-bold">4.8TB</span></div>
        </div>
      </div>

    </div>
  );
};