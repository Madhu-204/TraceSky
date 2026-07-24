import { create } from 'zustand';
import type { User } from '../types/auth.types';
import { useLocationStore } from './locationStore';
import { useSettingsStore } from './settingsStore';

const API_URL = `${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/auth`;
const REFRESH_TOKEN_KEY = 'tracesky_refresh_token';
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000; // Refresh 1 minute before expiry

function persistRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

function getPersistedRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

interface AuthState {
  user: User | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initAuth: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  googleSignIn: (googleToken: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  scheduleTokenRefresh: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (data: { name: string; location_default?: string; theme_accent?: string }) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  initAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_URL}/me`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const user = await response.json();
        set({ user, isAuthenticated: true, isLoading: false });
        useLocationStore.getState().hydrateFromUser(user);
        useSettingsStore.getState().hydrateTheme(user.theme_accent);

        const storedRefreshToken = getPersistedRefreshToken();
        if (storedRefreshToken) {
          set({ refreshToken: storedRefreshToken });
          get().scheduleTokenRefresh();
        }

        return true;
      }

      // Access token expired or missing — try refresh with persisted token
      const storedRefreshToken = getPersistedRefreshToken();
      if (storedRefreshToken) {
        set({ refreshToken: storedRefreshToken });
        const refreshed = await get().refreshAccessToken();
        if (refreshed) {
          const retryResponse = await fetch(`${API_URL}/me`, {
            method: 'GET',
            credentials: 'include'
          });
          if (retryResponse.ok) {
            const user = await retryResponse.json();
            set({ user, isAuthenticated: true, isLoading: false });
            useLocationStore.getState().hydrateFromUser(user);
            useSettingsStore.getState().hydrateTheme(user.theme_accent);
            return true;
          }
        }
      }

      set({ user: null, isAuthenticated: false, isLoading: false });
      return false;
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return false;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Send cookies with request
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Invalid credentials');
      }

      useLocationStore.getState().hydrateFromUser(data.user);
      useSettingsStore.getState().hydrateTheme(data.user.theme_accent);
      persistRefreshToken(data.refresh_token);
      set({
        user: data.user,
        refreshToken: data.refresh_token,
        isAuthenticated: true,
        isLoading: false
      });

      get().scheduleTokenRefresh();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Login failed', isLoading: false });
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      useLocationStore.getState().hydrateFromUser(data.user);
      useSettingsStore.getState().hydrateTheme(data.user.theme_accent);
      persistRefreshToken(data.refresh_token);
      set({
        user: data.user,
        refreshToken: data.refresh_token,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Registration failed', isLoading: false });
    }
  },

  googleSignIn: async (googleToken) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ google_token: googleToken })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Google Sign In failed');
      }

      useLocationStore.getState().hydrateFromUser(data.user);
      useSettingsStore.getState().hydrateTheme(data.user.theme_accent);
      persistRefreshToken(data.refresh_token);
      set({
        user: data.user,
        refreshToken: data.refresh_token,
        isAuthenticated: true,
        isLoading: false
      });

      get().scheduleTokenRefresh();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Google Sign In failed', isLoading: false });
    }
  },

  logout: async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch {
      // Ignore logout errors
    }
    persistRefreshToken(null);
    set({ user: null, refreshToken: null, isAuthenticated: false });
  },

  scheduleTokenRefresh: () => {
    setTimeout(() => {
      get().refreshAccessToken();
    }, (15 * 60 * 1000) - TOKEN_EXPIRY_BUFFER_MS);
  },

  refreshAccessToken: async () => {
    let { refreshToken } = get();
    if (!refreshToken) {
      refreshToken = getPersistedRefreshToken();
      if (!refreshToken) {
        persistRefreshToken(null);
        set({ isAuthenticated: false, user: null, refreshToken: null });
        return false;
      }
      set({ refreshToken });
    }

    try {
      const response = await fetch(`${API_URL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      const data = await response.json();

      if (!response.ok) {
        persistRefreshToken(null);
        set({ isAuthenticated: false, refreshToken: null, user: null });
        return false;
      }

      // Store the new refresh token (token rotation)
      persistRefreshToken(data.refresh_token);
      set({ refreshToken: data.refresh_token });

      get().scheduleTokenRefresh();

      return true;
    } catch {
      persistRefreshToken(null);
      set({ isAuthenticated: false, refreshToken: null, user: null });
      return false;
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send reset link');
      }

      set({ isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to send reset link', isLoading: false });
      throw err;
    }
  },

  resetPassword: async (token, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to reset password');
      }

      set({ isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to reset password', isLoading: false });
      throw err;
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: data.name,
          location_default: data.location_default,
          theme_accent: data.theme_accent,
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to update profile');
      }

      set({ user: result, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update profile', isLoading: false });
      throw err;
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    console.log('[authStore] changePassword called', { oldPassword: oldPassword ? '***' : 'empty', newPassword: newPassword ? '***' : 'empty' });
    set({ isLoading: true, error: null });
    try {
      console.log('[authStore] sending fetch to', `${API_URL}/change-password`);
      const response = await fetch(`${API_URL}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to change password');
      }

      set({ isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to change password', isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null })
}));