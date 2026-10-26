import { create } from 'zustand';
import { api } from '@/utils/helpers';
import type { Settings } from '@/types';

const defaultSettings: Settings = {
  storeName: 'Crepettoo',
  storeNameAr: 'كريبتتو',
  currency: 'DZD',
  taxRate: 0,
  receiptFooter: 'Merci pour votre visite!',
  receiptFooterAr: 'شكراً لزيارتكم!',
  lowStockThreshold: 5,
  autoPrint: true,
  paperSize: '80mm',
  storeAddress: '',
  storePhone: '',
  nif: '',
  nis: '',
  rc: '',
  nfl: '',
};

interface SettingsState {
  settings: Settings;
  loading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  loading: false,

  fetchSettings: async () => {
    try {
      set({ loading: true });
      // API returns flat key-value object directly (not wrapped)
      const res = await api.get<Record<string, unknown>>('/settings');
      if (res && typeof res === 'object') {
        set({ settings: { ...defaultSettings, ...res } as Settings, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  updateSettings: async (data) => {
    const body: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
      body[k] = JSON.stringify(v);
    }
    await api.put('/settings', body);
    set((s) => ({ settings: { ...s.settings, ...data } }));
  },
}));
