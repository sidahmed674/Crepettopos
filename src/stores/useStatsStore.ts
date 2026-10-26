import { create } from 'zustand';
import { api } from '@/utils/helpers';
import type { DailyReport } from '@/types';

interface DashboardData {
  today: { sales: number; orders: number; cash: number; card: number };
  week: { sales: number; orders: number; cash: number; card: number; transfer: number };
  month: { sales: number; orders: number; cash: number; card: number; tax: number; discount: number };
  pendingOrders: number;
  topItems: { menuItemId: string; name: string; quantity: number; orders: number }[];
}

interface StatsState {
  dashboard: DashboardData | null;
  dailyReport: DailyReport | null;
  salesByPeriod: { total: number; count: number; cash: number; card: number; transfer: number } | null;
  loading: boolean;
  fetchDashboard: () => Promise<void>;
  fetchDailyReport: (date: string) => Promise<void>;
  fetchWeeklySales: () => Promise<void>;
  fetchSalesByPeriod: (period: string) => Promise<void>;
  closeDay: () => Promise<void>;
}

export const useStatsStore = create<StatsState>((set) => ({
  dashboard: null,
  dailyReport: null,
  salesByPeriod: null,
  loading: false,

  fetchDashboard: async () => {
    set({ loading: true });
    const res = await api.get<DashboardData>('/stats/dashboard');
    set({ dashboard: res, loading: false });
  },

  fetchDailyReport: async (date) => {
    set({ loading: true });
    const res = await api.get<DailyReport>(`/stats/daily-report?date=${date}`);
    set({ dailyReport: res, loading: false });
  },

  fetchWeeklySales: async () => {
    const res = await api.get<{ sales: number; orders: number; cash: number; card: number; transfer: number }>('/stats/weekly-sales');
    set((state) => ({
      dashboard: state.dashboard ? { ...state.dashboard, week: res } : null,
    }));
  },

  fetchSalesByPeriod: async (period: string) => {
    const res = await api.get<{ total: number; count: number; cash: number; card: number; transfer: number }>(`/stats/sales-by-period?period=${period}`);
    set({ salesByPeriod: res });
  },

  closeDay: async () => {
    await api.post('/stats/close-day');
  },
}));
