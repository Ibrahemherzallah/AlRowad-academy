import { create } from 'zustand';
import { api, setAccessToken, unwrap } from '@/lib/api';
import type { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  bootstrap: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export interface RegisterPayload {
  name: string;
  phone: string;
  email: string;
  password: string;
  city?: string;
  referralCode?: string;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',

  /** On app load, try to restore a session via the refresh cookie. */
  bootstrap: async () => {
    set({ status: 'loading' });
    try {
      const { data } = await api.post('/auth/refresh');
      const { user, accessToken } = unwrap<{ user: User; accessToken: string }>(data);
      setAccessToken(accessToken);
      set({ user, status: 'authenticated' });
    } catch {
      setAccessToken(null);
      set({ user: null, status: 'unauthenticated' });
    }
  },

  login: async (identifier, password) => {
    const { data } = await api.post('/auth/login', { identifier, password });
    const { user, accessToken } = unwrap<{ user: User; accessToken: string }>(data);
    setAccessToken(accessToken);
    set({ user, status: 'authenticated' });
  },

  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    const { user, accessToken } = unwrap<{ user: User; accessToken: string }>(data);
    setAccessToken(accessToken);
    set({ user, status: 'authenticated' });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      set({ user: null, status: 'unauthenticated' });
    }
  },

  setUser: (user) => set({ user }),
}));
