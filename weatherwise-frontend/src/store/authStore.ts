import { create } from 'zustand';
import type { User } from '../types/auth.types';
import { useLocationStore } from './locationStore';
import { useSettingsStore } from './settingsStore';

const API_URL = 'http://localhost:8000/api/v1/auth';

const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000; // Refresh 1 minute before expiry

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
      // Call /me to verify session with cookie
      const response = await fetch(`${API_URL}/me`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const user = await response.json();
        set({ user, isAuthenticated: true, isLoading: false });
        useLocationStore.getState().hydrateFromUser(user);
        useSettingsStore.getState().hydrateTheme(user.theme_accent);
        return true;
      } else {
        // Not authenticated
        set({ user: null, isAuthenticated: false, isLoading: false });
        return false;
      }
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
      set({
        user: data.user,
        refreshToken: data.refresh_token,
        isAuthenticated: true,
        isLoading: false
      });

      // Schedule token refresh
      setTimeout(() => {
        get().refreshAccessToken();
      }, (data.expires_in * 1000) - TOKEN_EXPIRY_BUFFER_MS);
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
      set({
        user: data.user,
        refreshToken: data.refresh_token,
        isAuthenticated: true,
        isLoading: false
      });

      if (data.expires_in) {
        setTimeout(() => {
          get().refreshAccessToken();
        }, (data.expires_in * 1000) - TOKEN_EXPIRY_BUFFER_MS);
      }
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
    set({ user: null, refreshToken: null, isAuthenticated: false });
  },

  refreshAccessToken: async () => {
    const { refreshToken } = get();
    if (!refreshToken) {
      set({ isAuthenticated: false, refreshToken: null });
      return false;
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
        // Refresh failed - force logout
        set({ isAuthenticated: false, refreshToken: null, user: null });
        return false;
      }

      // Schedule next refresh
      setTimeout(() => {
        get().refreshAccessToken();
      }, (data.expires_in * 1000) - TOKEN_EXPIRY_BUFFER_MS);

      return true;
    } catch {
      set({ isAuthenticated: false, refreshToken: null });
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