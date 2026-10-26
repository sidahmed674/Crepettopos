import { create } from 'zustand';
import { api } from '@/utils/helpers';
import type { Table } from '@/types';

interface TableState {
  tables: Table[];
  loading: boolean;
  fetchTables: () => Promise<void>;
  addTable: (data: Partial<Table>) => Promise<void>;
  updateTable: (id: string, data: Partial<Table>) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  updateStatus: (id: string, status: Table['status']) => Promise<void>;
  getAvailable: () => Table[];
}

export const useTableStore = create<TableState>((set, get) => ({
  tables: [],
  loading: false,

  fetchTables: async () => {
    set({ loading: true });
    const res = await api.get<Table[]>('/tables');
    set({ tables: Array.isArray(res) ? res : [], loading: false });
  },

  addTable: async (data) => {
    await api.post('/tables', data);
    await get().fetchTables();
  },

  updateTable: async (id, data) => {
    await api.put(`/tables/${id}`, data);
    await get().fetchTables();
  },

  deleteTable: async (id) => {
    await api.delete(`/tables/${id}`);
    set((s) => ({ tables: s.tables.filter((t) => t.id !== id) }));
  },

  updateStatus: async (id, status) => {
    await api.put(`/tables/${id}/status`, { status });
    set((s) => ({
      tables: s.tables.map((t) => (t.id === id ? { ...t, status } : t)),
    }));
  },

  getAvailable: () => get().tables.filter((t) => t.status === 'available'),
}));
