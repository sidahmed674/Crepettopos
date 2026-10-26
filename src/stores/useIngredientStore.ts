import { create } from 'zustand';
import { api } from '@/utils/helpers';
import type { Ingredient } from '@/types';

interface IngredientState {
  ingredients: Ingredient[];
  loading: boolean;
  fetchIngredients: () => Promise<void>;
  addIngredient: (data: Partial<Ingredient>) => Promise<void>;
  updateIngredient: (id: string, data: Partial<Ingredient>) => Promise<void>;
  deleteIngredient: (id: string) => Promise<void>;
  addMovement: (ingredientId: string, type: string, change: number, note?: string) => Promise<void>;
  getLowStock: () => Ingredient[];
}

export const useIngredientStore = create<IngredientState>((set, get) => ({
  ingredients: [],
  loading: false,

  fetchIngredients: async () => {
    set({ loading: true });
    const res = await api.get<Ingredient[]>('/ingredients');
    set({ ingredients: Array.isArray(res) ? res : [], loading: false });
  },

  addIngredient: async (data) => {
    await api.post('/ingredients', data);
    await get().fetchIngredients();
  },

  updateIngredient: async (id, data) => {
    await api.put(`/ingredients/${id}`, data);
    set((s) => ({
      ingredients: s.ingredients.map((i) => (i.id === id ? { ...i, ...data } : i)),
    }));
  },

  deleteIngredient: async (id) => {
    await api.delete(`/ingredients/${id}`);
    set((s) => ({ ingredients: s.ingredients.filter((i) => i.id !== id) }));
  },

  addMovement: async (ingredientId, type, change, note) => {
    await api.post(`/ingredients/${ingredientId}/movement`, { type, change, note });
    await get().fetchIngredients();
  },

  getLowStock: () => get().ingredients.filter((i) => i.stock <= i.minStock),
}));
