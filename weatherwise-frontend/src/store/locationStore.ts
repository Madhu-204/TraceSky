import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { City, LocationData, UserLocationPreferences, POPULAR_CITIES } from '../types/location.types';

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
        set({ currentLocation: location });
        get().addRecentSearch(location.city);
      },

      setDefaultLocation: (city: City | null) => {
        set({ defaultLocation: city });
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
    }),
    {
      name: 'weatherwise-locations',
      partialize: (state) => ({
        defaultLocation: state.defaultLocation,
        favorites: state.favorites,
        recentSearches: state.recentSearches,
      }),
    }
  )
);