import { create } from 'zustand';
import type { User, UserRole } from '../types/auth.types';

const API_URL = 'http://localhost:8000/api/v1/auth';

const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000; // Refresh 1 minute before expiry

interface AuthState {
  user: User | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initAuth: () => Promise<boolean>;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
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

  login: async (email, password, role) => {
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

  register: async (name, email, password, role) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

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

  clearError: () => set({ error: null })
}));