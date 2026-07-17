import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SystemConfig, ThemeAccent } from '../types/settings.types';

const DEFAULT_CONFIG: SystemConfig = {
  unitSystem: 'METRIC',
  refreshInterval: 30,
  alertRadius: 25,
  pushNotifications: true,
  emailAlerts: false,
  smsCriticalAlerts: true,
  apiKey: 'ww_live_8f39a0bc42de711209bcfa66381ea19a',
  apiStatus: 'ACTIVE',
  ingestionMode: 'BALANCED',
  themeAccent: 'blue',
};

interface SettingsState {
  config: SystemConfig;
  updateConfig: (partial: Partial<SystemConfig>) => void;
  setThemeAccent: (accent: ThemeAccent) => void;
  hydrateTheme: (accent?: string) => void;
  regenerateApiKey: () => void;
  resetToDefaults: () => void;
  exportSettings: () => string;
  clearCache: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      config: { ...DEFAULT_CONFIG },

      updateConfig: (partial) => {
        set((state) => ({ config: { ...state.config, ...partial } }));
      },

      setThemeAccent: (accent) => {
        set((state) => ({ config: { ...state.config, themeAccent: accent } }));
        document.documentElement.setAttribute('data-theme', accent);
      },

      hydrateTheme: (accent) => {
        if (!accent) return;
        const valid = ['blue', 'emerald', 'violet', 'amber'];
        if (!valid.includes(accent)) return;
        set((state) => ({ config: { ...state.config, themeAccent: accent as ThemeAccent } }));
        document.documentElement.setAttribute('data-theme', accent);
      },

      regenerateApiKey: () => {
        const hex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        set((state) => ({
          config: { ...state.config, apiKey: `ww_live_${hex}` },
        }));
      },

      resetToDefaults: () => {
        set({ config: { ...DEFAULT_CONFIG } });
        document.documentElement.setAttribute('data-theme', DEFAULT_CONFIG.themeAccent);
      },

      exportSettings: () => {
        const cfg = get().config;
        const rows = Object.entries(cfg).map(([key, val]) => `${key},${val}`);
        return 'Setting,Value\n' + rows.join('\n');
      },

  clearCache: () => {
    // no-op — weather data is in-memory only, nothing to clear from localStorage
  },
    }),
    {
      name: 'weatherwise-settings',
      partialize: (state) => ({ config: state.config }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.setAttribute('data-theme', state.config.themeAccent);
        }
      },
    }
  )
);
