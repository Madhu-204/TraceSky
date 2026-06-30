import { useState, useCallback } from 'react';
import { useLocationStore } from '../store/locationStore';
import { City, POPULAR_CITIES, COUNTRIES } from '../types/location.types';

export const useLocations = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  const store = useLocationStore();

  const handleSelectLocation = useCallback(
    (city: City) => {
      store.setCurrentLocation({
        city,
        lastUpdated: new Date().toISOString(),
      });
      setIsLocationPickerOpen(false);
      setSearchQuery('');
    },
    [store]
  );

  const toggleFavorite = useCallback(
    (city: City) => {
      const isFav = store.favorites.some((f) => f.id === city.id);
      if (isFav) {
        store.removeFavorite(city.id);
      } else {
        store.addFavorite(city);
      }
    },
    [store]
  );

  const isFavorite = useCallback(
    (cityId: string) => {
      return store.favorites.some((f) => f.id === cityId);
    },
    [store.favorites]
  );

  const initializeDefaultLocation = useCallback(() => {
    const loc = store.defaultLocation || POPULAR_CITIES[0];
    store.setCurrentLocation({
      city: loc,
      lastUpdated: new Date().toISOString(),
    });
  }, [store]);

  const filteredCities = searchQuery.trim()
    ? store.searchCities(searchQuery)
    : POPULAR_CITIES.slice(0, 8);

  return {
    currentLocation: store.currentLocation,
    defaultLocation: store.defaultLocation,
    favorites: store.favorites,
    recentSearches: store.recentSearches,
    searchQuery,
    setSearchQuery,
    isLocationPickerOpen,
    setIsLocationPickerOpen,
    filteredCities,
    searchCities: store.searchCities,
    handleSelectLocation,
    setDefaultLocation: store.setDefaultLocation,
    addFavorite: store.addFavorite,
    removeFavorite: store.removeFavorite,
    toggleFavorite,
    isFavorite,
    clearRecentSearches: store.clearRecentSearches,
    initializeDefaultLocation,
    getCountries: () => COUNTRIES,
    getCitiesByCountry: (countryCode: string) => POPULAR_CITIES.filter((city) => city.countryCode === countryCode),
  };
};