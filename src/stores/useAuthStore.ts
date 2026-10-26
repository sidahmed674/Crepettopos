import { create } from 'zustand';
import { api } from '@/utils/helpers';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  initialized: boolean;
  init: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (newPassword: string, currentPassword?: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  initialized: false,

  init: async () => {
    try {
      const token = api.getToken();
      if (!token) { set({ initialized: true }); return; }
      const res = await api.get<User & { user?: User }>('/auth/me');
      set({ user: res.user ?? res, initialized: true });
    } catch {
      api.clearToken();
      set({ initialized: true });
    }
  },

  login: async (username, password) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { username, password });
    api.setToken(res.token);
    set({ user: res.user });
  },

  logout: () => {
    api.clearToken();
    set({ user: null });
  },

  changePassword: async (newPassword, currentPassword?) => {
    await api.post('/auth/change-password', { newPassword, currentPassword });
    set((s) => s.user ? { user: { ...s.user, mustChangePassword: false } } : {});
  },
}));
