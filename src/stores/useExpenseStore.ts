import { create } from 'zustand';
import { api } from '@/utils/helpers';
import type { Expense } from '@/types';

interface ExpenseState {
  expenses: Expense[];
  loading: boolean;
  fetchExpenses: (date?: string) => Promise<void>;
  addExpense: (data: Partial<Expense>) => Promise<void>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getTotalByDate: (date: string) => number;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  loading: false,

  fetchExpenses: async (date) => {
    set({ loading: true });
    const query = date ? `?date=${date}` : '';
    const res = await api.get<Expense[]>(`/expenses${query}`);
    set({ expenses: Array.isArray(res) ? res : [], loading: false });
  },

  addExpense: async (data) => {
    await api.post('/expenses', data);
    await get().fetchExpenses(data.date);
  },

  updateExpense: async (id, data) => {
    await api.put(`/expenses/${id}`, data);
    set((s) => ({
      expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...data } as Expense : e)),
    }));
  },

  deleteExpense: async (id) => {
    await api.delete(`/expenses/${id}`);
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }));
  },

  getTotalByDate: (date) => {
    return get().expenses
      .filter((e) => e.date === date)
      .reduce((sum, e) => sum + e.amount, 0);
  },
}));
