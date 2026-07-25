import React, { useEffect, useCallback } from 'react';
import { RefreshCw, Download, Shield, Radio } from 'lucide-react';
import { ForecastAccuracyCard } from '../components/analytics/ForecastAccuracyCard';
import { ClimaticIntensityCard } from '../components/analytics/ClimaticIntensityCard';
import { EventTrackingCard } from '../components/analytics/EventTrackingCard';
import { PerformanceBenchmarkCard } from '../components/analytics/PerformanceBenchmarkCard';
import { useAIStore } from '../store/aiStore';
import { useLocationStore } from '../store/locationStore';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

export const AnalyticsPage: React.FC = () => {
  const { analyticsReport, isAnalyticsLoading, analyticsError, fetchAnalyticsReport } = useAIStore();
  const { currentLocation } = useLocationStore();
  const city = currentLocation?.city;
  const lat = city?.lat ?? 37.7749;
  const lon = city?.lon ?? -122.4194;

  const refresh = useCallback(() => {
    fetchAnalyticsReport(lat, lon);
  }, [lat, lon, fetchAnalyticsReport]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useAutoRefresh(refresh);

  const handleRefresh = useCallback(() => {
    fetchAnalyticsReport(lat, lon, true);
  }, [lat, lon, fetchAnalyticsReport]);

  const handleExport = useCallback(() => {
    if (!analyticsReport) return;
    const blob = new Blob([JSON.stringify(analyticsReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracesky-analytics-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [analyticsReport]);

  if (isAnalyticsLoading && !analyticsReport) {
    return (
      <div className="pt-4 sm:pt-6 lg:pt-20 pb-6 px-4 sm:px-6 lg:px-8 lg:ml-64 bg-[#070A14] min-h-screen text-gray-100 space-y-6 transition-all flex items-center justify-center">
        <p className="text-gray-500 text-sm">Running inference engine for analytics...</p>
      </div>
    );
  }

  if (analyticsError && !analyticsReport) {
    return (
      <div className="pt-4 sm:pt-6 lg:pt-20 pb-6 px-4 sm:px-6 lg:px-8 lg:ml-64 bg-[#070A14] min-h-screen text-gray-100 space-y-6 transition-all flex items-center justify-center">
        <p className="text-red-400 text-sm">Error loading analytics: {analyticsError}</p>
      </div>
    );
  }

  if (!analyticsReport) {
    return (
      <div className="pt-4 sm:pt-6 lg:pt-20 pb-6 px-4 sm:px-6 lg:px-8 lg:ml-64 bg-[#070A14] min-h-screen text-gray-100 space-y-6 transition-all flex items-center justify-center">
        <p className="text-gray-500 text-sm">No analytics data available.</p>
      </div>
    );
  }

  const report = analyticsReport;
  const im = report.inference_metrics;
  const anomalyCount = report.anomaly_events.length;

  return (
    <div className="pt-4 sm:pt-6 lg:pt-20 pb-6 px-4 sm:px-6 lg:px-8 lg:ml-64 bg-[#070A14] min-h-screen text-gray-100 space-y-6 transition-all">

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-[#1C2345] pb-5">
        <div>
          <h2 className="text-lg font-extrabold text-white tracking-tight">Intelligence Analytics</h2>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">
            Expert system audit of model performance, climatic patterns, and anomaly detection.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto text-xs font-bold">
          <button
            onClick={handleRefresh}
            disabled={isAnalyticsLoading}
            className="flex items-center gap-2 px-3 py-2 bg-[#0E1328] border border-[#1C2345] hover:border-[#2C376B] rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={`text-gray-400 ${isAnalyticsLoading ? 'animate-spin' : ''}`} />
            <span className="text-gray-200">REFRESH</span>
          </button>

          <button
            onClick={handleExport}
            disabled={!analyticsReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0E1328] border border-[#1C2345] hover:bg-[#161C39] hover:border-blue-500/30 text-gray-200 hover:text-white rounded-xl transition-all shadow-md disabled:opacity-40"
          >
            <Download size={14} />
            <span>EXPORT</span>
          </button>
        </div>
      </div>

      <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-5">
        <p className="text-xs text-gray-300 leading-relaxed">{report.summary}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-[#0E1328] border border-[#1C2345] rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10 text-emerald-400">
            <Shield size={14} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-mono font-bold">Forecast Accuracy</p>
            <p className="text-lg font-bold text-white">{report.forecast_accuracy.overall_accuracy}%</p>
            <p className="text-[9px] text-gray-600 font-mono">CF: {report.forecast_accuracy.overall_confidence.toFixed(2)} &middot; {report.forecast_accuracy.overall_status}</p>
          </div>
        </div>
        <div className="bg-[#0E1328] border border-[#1C2345] rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-500/5 rounded-lg border border-amber-500/10 text-amber-400">
            <Radio size={14} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-mono font-bold">Anomalies Detected</p>
            <p className="text-lg font-bold text-white">{anomalyCount}</p>
            <p className="text-[9px] text-gray-600 font-mono">{report.anomaly_events.filter(e => e.severity === 'critical').length} critical</p>
          </div>
        </div>
        <div className="bg-[#0E1328] border border-[#1C2345] rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-500/5 rounded-lg border border-blue-500/10 text-blue-400">
            <Shield size={14} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-mono font-bold">Inference Engine</p>
            <p className="text-lg font-bold text-white">{im.total_rules_evaluated} rules</p>
            <p className="text-[9px] text-gray-600 font-mono">{im.execution_time_ms}ms &middot; {im.total_rules_fired} fired</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ForecastAccuracyCard data={report.forecast_accuracy} />
        <ClimaticIntensityCard data={report.climatic_intensity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <EventTrackingCard events={report.anomaly_events} />
        </div>
        <div className="lg:col-span-3">
          <PerformanceBenchmarkCard data={report.performance_benchmark} />
        </div>
      </div>

      {im && (
        <div className="bg-[#0E1328] border border-[#1C2345] rounded-2xl p-4 flex items-center justify-between text-[10px] font-mono text-gray-500">
          <span>Inference Engine: {im.total_rules_evaluated} rules evaluated &middot; {im.total_rules_fired} fired &middot; {im.execution_time_ms}ms &middot; {im.facts_loaded} facts loaded</span>
          <span className="text-blue-400 font-bold">Overall CF: {im.overall_certainty.toFixed(2)}</span>
        </div>
      )}

    </div>
  );
};
