import React from 'react';
import { Calendar, Download } from 'lucide-react';
import { ForecastAccuracyCard } from '../components/analytics/ForecastAccuracyCard';
import { ClimaticIntensityCard } from '../components/analytics/ClimaticIntensityCard';
import { EventTrackingCard } from '../components/analytics/EventTrackingCard';
import { PerformanceBenchmarkCard } from '../components/analytics/PerformanceBenchmarkCard';
import type { HeatmapSquare, AnomalyEvent, BenchmarkRow } from '../types/analytics.types';

export const AnalyticsPage: React.FC = () => {
  // Generates 28 matrix components to perfectly match the grid array visualization footprint
  const designHeatmapData: HeatmapSquare[] = [
    { dayIndex: 0, weekIndex: 0, intensityValue: 'low' },
    { dayIndex: 1, weekIndex: 0, intensityValue: 'none' },
    { dayIndex: 2, weekIndex: 0, intensityValue: 'low' },
    { dayIndex: 3, weekIndex: 0, intensityValue: 'none' },
    { dayIndex: 4, weekIndex: 0, intensityValue: 'low' },
    { dayIndex: 5, weekIndex: 0, intensityValue: 'medium' },
    { dayIndex: 6, weekIndex: 0, intensityValue: 'low' },

    { dayIndex: 0, weekIndex: 1, intensityValue: 'low' },
    { dayIndex: 1, weekIndex: 1, intensityValue: 'none' },
    { dayIndex: 2, weekIndex: 1, intensityValue: 'medium' },
    { dayIndex: 3, weekIndex: 1, intensityValue: 'medium' },
    { dayIndex: 4, weekIndex: 1, intensityValue: 'none' },
    { dayIndex: 5, weekIndex: 1, intensityValue: 'low' },
    { dayIndex: 6, weekIndex: 1, intensityValue: 'none' },

    { dayIndex: 0, weekIndex: 2, intensityValue: 'low' },
    { dayIndex: 1, weekIndex: 2, intensityValue: 'none' },
    { dayIndex: 2, weekIndex: 2, intensityValue: 'high' },
    { dayIndex: 3, weekIndex: 2, intensityValue: 'high' },
    { dayIndex: 4, weekIndex: 2, intensityValue: 'none' },
    { dayIndex: 5, weekIndex: 2, intensityValue: 'low' },
    { dayIndex: 6, weekIndex: 2, intensityValue: 'none' },

    { dayIndex: 0, weekIndex: 3, intensityValue: 'high' },
    { dayIndex: 1, weekIndex: 3, intensityValue: 'extreme' },
    { dayIndex: 2, weekIndex: 3, intensityValue: 'medium' },
    { dayIndex: 3, weekIndex: 3, intensityValue: 'none' },
    { dayIndex: 4, weekIndex: 3, intensityValue: 'none' },
    { dayIndex: 5, weekIndex: 3, intensityValue: 'none' },
    { dayIndex: 6, weekIndex: 3, intensityValue: 'none' },
  ];

  const designAnomalyEvents: AnomalyEvent[] = [
    {
      id: 'evt-1',
      timestamp: 'Oct 26, 14:22',
      title: 'Flash Flood Alert - Alpha Sector',
      description: 'Intensity exceeded predicted threshold by 12.4% within 15 minutes of onset.',
      severity: 'critical'
    },
    {
      id: 'evt-2',
      timestamp: 'Oct 24, 09:10',
      title: 'Thermal Pocket Deviation',
      description: 'Micro-climate heat spike (+4°C) detected against static models.',
      severity: 'warning'
    },
    {
      id: 'evt-3',
      timestamp: 'Oct 21, 23:55',
      title: 'Barometric Drop Sequence',
      description: 'Sub-mesoscale vortex formation 42km Offshore tracked via satellite arrays.',
      severity: 'info'
    }
  ];

  const designBenchmarkData: BenchmarkRow[] = [
    { variable: 'Mean Temp', unit: '(°C)', openWeatherVal: 24.2, weatherWiseVal: 21.9, actualObserved: 21.8, status: 'optimal' },
    { variable: 'Precipitation', unit: '(mm)', openWeatherVal: 0.0, weatherWiseVal: 1.4, actualObserved: 1.5, status: 'optimal' },
    { variable: 'Wind Vector', unit: '(km/h)', openWeatherVal: 12.5, weatherWiseVal: 18.2, actualObserved: 19.0, status: 'divergent' },
    { variable: 'Dew Point', unit: '(°C)', openWeatherVal: 15.1, weatherWiseVal: 14.0, actualObserved: 14.1, status: 'optimal' }
  ];

  return (
    <div className="pt-20 pb-6 px-4 sm:px-6 lg:px-8 lg:ml-64 bg-[#070A14] min-h-screen text-gray-100 space-y-6 transition-all">

      {/* SECTION 1: Analytics Toolbar Action Header Controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-[#1C2345] pb-5">
        <div>
          <h2 className="text-lg font-extrabold text-white tracking-tight">Intelligence Analytics</h2>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">
            Historical performance audit and deep-pattern identification.
          </p>
        </div>

        {/* Interactive Query Filters and Export Nodes */}
        <div className="flex items-center gap-3 self-end sm:self-auto text-xs font-bold">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#0E1328] border border-[#1C2345] hover:border-[#2C376B] rounded-xl transition-all cursor-pointer">
            <Calendar size={14} className="text-gray-400" />
            <span className="text-gray-200">Oct 01 - Oct 31, 2023</span>
          </div>

          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#0E1328] border border-[#1C2345] hover:bg-[#161C39] hover:border-blue-500/30 text-gray-200 hover:text-white rounded-xl transition-all shadow-md">
            <Download size={14} />
            <span>EXPORT</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: Upper Metric Visualization Panel Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ForecastAccuracyCard accuracyPercentage="91.4%" />
        <ClimaticIntensityCard squares={designHeatmapData} />
      </div>

      {/* SECTION 3: Lower Comparative Ingestion Audit Records Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <EventTrackingCard events={designAnomalyEvents} />
        </div>
        <div className="lg:col-span-3">
          <PerformanceBenchmarkCard rows={designBenchmarkData} />
        </div>
      </div>

    </div>
  );
};