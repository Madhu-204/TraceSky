import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { City, LocationData, UserLocationPreferences } from '../types/location.types';
import { POPULAR_CITIES, ALL_CITIES } from '../types/location.types';

interface LocationState extends UserLocationPreferences {
  currentLocation: LocationData | null;
  setCurrentLocation: (location: LocationData) => void;
  setDefaultLocation: (city: City | null) => void;
  addFavorite: (city: City) => void;
  removeFavorite: (cityId: string) => void;
  addRecentSearch: (city: City) => void;
  clearRecentSearches: () => void;
  getCityById: (id: string) => City | undefined;
  searchCities: (query: string) => City[];
  /** Sync defaultLocation to currentLocation if current is null and default exists */
  syncDefaultToCurrent: () => void;
  /** Hydrate location state from backend user data */
  hydrateFromUser: (user: { location_default?: string }) => void;
}

const MAX_RECENT_SEARCHES = 10;

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      defaultLocation: null,
      favorites: [],
      recentSearches: [],
      currentLocation: null,

      setCurrentLocation: (location: LocationData) => {
        set({ currentLocation: location, defaultLocation: location.city });
        get().addRecentSearch(location.city);
      },

      setDefaultLocation: (city: City | null) => {
        set({
          defaultLocation: city,
          ...(city ? { currentLocation: { city, lastUpdated: new Date().toISOString() } } : {}),
        });
      },

      addFavorite: (city: City) => {
        const { favorites } = get();
        if (!favorites.some((f) => f.id === city.id)) {
          set({ favorites: [...favorites, city] });
        }
      },

      removeFavorite: (cityId: string) => {
        const { favorites } = get();
        set({ favorites: favorites.filter((f) => f.id !== cityId) });
      },

      addRecentSearch: (city: City) => {
        const { recentSearches } = get();
        const filtered = recentSearches.filter((c) => c.id !== city.id);
        const updated = [city, ...filtered].slice(0, MAX_RECENT_SEARCHES);
        set({ recentSearches: updated });
      },

      clearRecentSearches: () => {
        set({ recentSearches: [] });
      },

      getCityById: (id: string) => {
        const { favorites, recentSearches } = get();
        return (
          POPULAR_CITIES.find((c) => c.id === id) ||
          ALL_CITIES.find((c) => c.id === id) ||
          favorites.find((c) => c.id === id) ||
          recentSearches.find((c) => c.id === id)
        );
      },

      searchCities: (query: string) => {
        if (!query.trim()) return POPULAR_CITIES.slice(0, 8);
        const lowerQuery = query.toLowerCase();
        return POPULAR_CITIES.filter(
          (city) =>
            city.name.toLowerCase().includes(lowerQuery) ||
            city.country.toLowerCase().includes(lowerQuery) ||
            city.countryCode.toLowerCase().includes(lowerQuery)
        ).slice(0, 10);
      },

      syncDefaultToCurrent: () => {
        const { currentLocation, defaultLocation } = get();
        if (!currentLocation && defaultLocation) {
          set({
            currentLocation: {
              city: defaultLocation,
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      hydrateFromUser: (user) => {
        if (!user.location_default) return;
        const city = ALL_CITIES.find((c) => c.id === user.location_default);
        if (city) {
          set({
            defaultLocation: city,
            currentLocation: { city, lastUpdated: new Date().toISOString() },
          });
        }
      },
    }),
    {
      name: 'tracesky-locations',
      partialize: (state) => ({
        defaultLocation: state.defaultLocation,
        currentLocation: state.currentLocation,
        favorites: state.favorites,
        recentSearches: state.recentSearches,
      }),
    }
  )
);