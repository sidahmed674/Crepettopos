import { create } from 'zustand';
import { api } from '@/utils/helpers';
import type { AuditEntry } from '@/types';

interface AuditState {
  entries: AuditEntry[];
  loading: boolean;
  fetchEntries: (filters?: Record<string, string>) => Promise<void>;
}

export const useAuditStore = create<AuditState>((set) => ({
  entries: [],
  loading: false,

  fetchEntries: async (filters) => {
    set({ loading: true });
    const query = filters ? '?' + new URLSearchParams(filters).toString() : '';
    const res = await api.get<AuditEntry[]>(`/audit${query}`);
    set({ entries: Array.isArray(res) ? res : [], loading: false });
  },
}));
