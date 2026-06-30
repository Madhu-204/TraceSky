import { create } from 'zustand';
import type { User, UserRole } from '../types/auth.types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, role: UserRole) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, role) => {
    set({ isLoading: true, error: null });
    try {
      // Mocking API response delay matching your high-fidelity theme
      await new Promise((resolve) => setTimeout(resolve, 800));

      const mockUser: User = {
        id: 'usr_9921',
        name: role === 'Officer' ? 'Dr. Aris Thorne' : 'Alex Rivera',
        email: email,
        role: role,
        tier: 'Premium Intelligence',
        locationDefault: 'San Francisco, CA'
      };

      set({
        user: mockUser,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        isAuthenticated: true,
        isLoading: false
      });
    } catch (err) {
      set({ error: 'Invalid atmospheric credentials.', isLoading: false });
    }
  },

  register: async (name, email, role) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        role,
        tier: 'Free Account',
      };
      set({
        user: newUser,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        isAuthenticated: true,
        isLoading: false
      });
    } catch (err) {
      set({ error: 'Registration failed. Network node rejection.', isLoading: false });
    }
  },

  logout: () => set({ user: null, token: null, isAuthenticated: false }),
  clearError: () => set({ error: null })
}));