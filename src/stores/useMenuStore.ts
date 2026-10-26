import { create } from 'zustand';
import { api } from '@/utils/helpers';
import type { MenuCategory, MenuItem } from '@/types';

interface MenuState {
  categories: MenuCategory[];
  items: MenuItem[];
  loading: boolean;
  fetchCategories: () => Promise<void>;
  fetchItems: () => Promise<void>;
  fetchAll: () => Promise<void>;
  addCategory: (data: Partial<MenuCategory>) => Promise<MenuCategory>;
  updateCategory: (id: string, data: Partial<MenuCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addItem: (data: Partial<MenuItem>) => Promise<MenuItem>;
  updateItem: (id: string, data: Partial<MenuItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<{ message?: string; deactivated?: boolean } | undefined>;
  toggleAvailability: (id: string, available: boolean) => Promise<void>;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  categories: [],
  items: [],
  loading: false,

  fetchCategories: async () => {
    const res = await api.get<MenuCategory[]>('/menu/categories');
    set({ categories: Array.isArray(res) ? res : [] });
  },

  fetchItems: async () => {
    const res = await api.get<MenuItem[]>('/menu/items');
    set({ items: Array.isArray(res) ? res : [] });
  },

  fetchAll: async () => {
    set({ loading: true });
    await Promise.all([get().fetchCategories(), get().fetchItems()]);
    set({ loading: false });
  },

  addCategory: async (data) => {
    const res = await api.post<MenuCategory>('/menu/categories', data);
    set((s) => ({ categories: [...s.categories, res].sort((a, b) => a.sortOrder - b.sortOrder) }));
    return res;
  },

  updateCategory: async (id, data) => {
    await api.put(`/menu/categories/${id}`, data);
    set((s) => ({
      categories: s.categories.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
  },

  deleteCategory: async (id) => {
    await api.delete(`/menu/categories/${id}`);
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
  },

  addItem: async (data) => {
    const res = await api.post<MenuItem>('/menu/items', data);
    set((s) => ({ items: [...s.items, res] }));
    return res;
  },

  updateItem: async (id, data) => {
    await api.put(`/menu/items/${id}`, data);
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...data } : i)),
    }));
  },

  deleteItem: async (id) => {
    const res = await api.delete<{ message?: string; deactivated?: boolean }>(`/menu/items/${id}`);
    set((s) => ({
      items: res?.deactivated
        ? s.items.map((i) => (i.id === id ? { ...i, available: false } : i))
        : s.items.filter((i) => i.id !== id),
    }));
    return res;
  },

  toggleAvailability: async (id, available) => {
    await api.put(`/menu/items/${id}`, { available });
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, available } : i)),
    }));
  },
}));
