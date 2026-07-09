import React, { useEffect } from 'react';
import { CurrentHero } from '../components/dashboard/CurrentHero';
import { MiddleGrid } from '../components/dashboard/MiddleGrid';
import { BottomGrid } from '../components/dashboard/BottomGrid';
import { ExpertRecommendations } from '../components/dashboard/ExpertRecommendations';
import { RiskSummary } from '../components/dashboard/RiskSummary';
import { useWeatherStore } from '../store/weatherStore';
import { useAIStore } from '../store/aiStore';
import { useLocationStore } from '../store/locationStore';

export const DashboardPage: React.FC = () => {
  const { current, forecast, isLoading, fetchCurrent, fetchForecast } = useWeatherStore();
  const { risks, recommendations, fetchRisks, fetchRecommendations } = useAIStore();
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
    fetchRisks(lat, lon);
    fetchRecommendations(lat, lon);
  }, [lat, lon]);

  return (
    <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 space-y-6 lg:ml-64 bg-[#070A14] min-h-screen text-gray-100 transition-all">
      <CurrentHero
        cityName={cityName}
        current={current}
        hourly={forecast?.hourly ?? []}
        isLoading={isLoading}
      />
      <MiddleGrid />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpertRecommendations
          advisories={recommendations.length > 0 ? recommendations : ['Loading advisories...']}
          onAskAI={() => {}}
        />
        <RiskSummary
          risks={risks.length > 0 ? risks.map(r => ({
            id: r.id,
            name: r.name,
            percentage: r.percentage,
            severity: r.severity as 'High' | 'Moderate' | 'Low',
          })) : [
            { id: 'loading', name: 'Loading risks...', percentage: 0, severity: 'Low' as const },
          ]}
        />
      </div>
      <BottomGrid daily={forecast?.daily ?? []} />
    </div>
  );
};
