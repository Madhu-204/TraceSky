import React, { useEffect, useCallback } from 'react';
import { CurrentConditions } from '../components/dashboard/CurrentConditions';
import { InferenceRiskProfile } from '../components/dashboard/InferenceRiskProfile';
import { DerivedActions } from '../components/dashboard/DerivedActions';
import { ReasoningTrace } from '../components/dashboard/ReasoningTrace';
import { BottomGrid } from '../components/dashboard/BottomGrid';
import { useWeatherStore } from '../store/weatherStore';
import { useAIStore } from '../store/aiStore';
import { useLocationStore } from '../store/locationStore';
import { useAuthorization } from '../hooks/useAuthorization';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

interface DashboardPageProps {
  onNavigateToForecast?: () => void;
  onNavigateToAssistant?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateToForecast, onNavigateToAssistant }) => {
  const { current, forecast, isLoading, fetchCurrent, fetchForecast } = useWeatherStore();
  const {
    expertAnalysis, isExpertLoading,
    fetchExpertAnalysis,
  } = useAIStore();
  const { currentLocation } = useLocationStore();
  const { canAccess } = useAuthorization();

  const city = currentLocation?.city;
  const lat = city?.lat ?? 37.7749;
  const lon = city?.lon ?? -122.4194;
  const cityName = city
    ? city.state
      ? `${city.name}, ${city.state}`
      : `${city.name}, ${city.countryCode}`
    : 'San Francisco, US';

  const hasExpert = canAccess('expert-analysis');

  const refresh = useCallback(() => {
    fetchCurrent(lat, lon);
    fetchForecast(lat, lon, 7);
    if (hasExpert) {
      fetchExpertAnalysis(lat, lon);
    }
  }, [lat, lon, fetchCurrent, fetchForecast, fetchExpertAnalysis, hasExpert]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useAutoRefresh(refresh);

  const expertRisks = hasExpert ? (expertAnalysis?.risks ?? []) : [];
  const expertRecs = hasExpert ? (expertAnalysis?.recommendations ?? []) : [];
  const expertMetrics = hasExpert ? (expertAnalysis?.inference_metrics ?? null) : null;
  const forecastValidation = hasExpert ? (expertAnalysis?.forecast_validation ?? null) : null;

  return (
    <div className="pt-4 sm:pt-6 lg:pt-20 pb-8 px-4 sm:px-6 lg:px-8 space-y-6 lg:ml-64 bg-[#070A14] min-h-screen text-gray-100 transition-all">
      <CurrentConditions
        cityName={cityName}
        current={current}
        hourly={forecast?.hourly ?? []}
        dataSource={hasExpert ? expertAnalysis?.data_source : undefined}
        isLoading={isLoading || isExpertLoading}
        forecastValidation={forecastValidation}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hasExpert ? (
          <>
            <InferenceRiskProfile risks={expertRisks} />
            <DerivedActions
              recommendations={expertRecs}
              metrics={expertMetrics}
              onAskAI={onNavigateToAssistant ?? (() => {})}
              isLoading={isExpertLoading}
            />
            <ReasoningTrace
              sensorFacts={expertAnalysis?.sensor_facts ?? []}
              derivedFacts={expertAnalysis?.derived_facts ?? []}
              executionTimeMs={expertAnalysis?.inference_metrics?.execution_time_ms ?? 0}
            />
          </>
        ) : (
          <div className="col-span-full bg-[#0E1328] border border-[#1C2345] rounded-xl p-6 text-center">
            <p className="text-sm text-gray-400">Sign in as an <span className="text-blue-400 font-bold">Officer</span> to view the expert analysis dashboard.</p>
          </div>
        )}
      </div>

      <BottomGrid
        daily={forecast?.daily ?? []}
        evaluatedByDomain={hasExpert ? expertAnalysis?.evaluated_by_domain : undefined}
        inferenceMetrics={expertMetrics}
        onDetailedView={onNavigateToForecast}
      />
    </div>
  );
};
