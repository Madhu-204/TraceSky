import React, { useEffect } from 'react';
import { CurrentConditions } from '../components/dashboard/CurrentConditions';
import { InferenceRiskProfile } from '../components/dashboard/InferenceRiskProfile';
import { DerivedActions } from '../components/dashboard/DerivedActions';
import { ReasoningTrace } from '../components/dashboard/ReasoningTrace';
import { BottomGrid } from '../components/dashboard/BottomGrid';
import { useWeatherStore } from '../store/weatherStore';
import { useAIStore } from '../store/aiStore';
import { useLocationStore } from '../store/locationStore';

export const DashboardPage: React.FC = () => {
  const { current, forecast, isLoading, fetchCurrent, fetchForecast } = useWeatherStore();
  const {
    expertAnalysis, isExpertLoading,
    fetchExpertAnalysis,
  } = useAIStore();
  const { currentLocation } = useLocationStore();

  const city = currentLocation?.city;
  const lat = city?.lat ?? 37.7749;
  const lon = city?.lon ?? -122.4194;
  const cityName = city
    ? city.state
      ? `${city.name}, ${city.state}`
      : `${city.name}, ${city.countryCode}`
    : 'San Francisco, US';

  useEffect(() => {
    fetchCurrent(lat, lon);
    fetchForecast(lat, lon, 7);
    fetchExpertAnalysis(lat, lon);
  }, [lat, lon]);

  const expertRisks = expertAnalysis?.risks ?? [];
  const expertRecs = expertAnalysis?.recommendations ?? [];
  const expertMetrics = expertAnalysis?.inference_metrics ?? null;
  const forecastValidation = expertAnalysis?.forecast_validation ?? null;

  return (
    <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 space-y-6 lg:ml-64 bg-[#070A14] min-h-screen text-gray-100 transition-all">
      <CurrentConditions
        cityName={cityName}
        current={current}
        hourly={forecast?.hourly ?? []}
        dataSource={expertAnalysis?.data_source}
        isLoading={isLoading || isExpertLoading}
        forecastValidation={forecastValidation}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InferenceRiskProfile
          risks={expertRisks}
        />
        <DerivedActions
          recommendations={expertRecs}
          metrics={expertMetrics}
          onAskAI={() => {}}
          isLoading={isExpertLoading}
        />
        <ReasoningTrace
          sensorFacts={expertAnalysis?.sensor_facts ?? []}
          derivedFacts={expertAnalysis?.derived_facts ?? []}
          executionTimeMs={expertAnalysis?.inference_metrics?.execution_time_ms ?? 0}
        />
      </div>

      <BottomGrid
        daily={forecast?.daily ?? []}
        evaluatedByDomain={expertAnalysis?.evaluated_by_domain}
        inferenceMetrics={expertMetrics}
      />
    </div>
  );
};
