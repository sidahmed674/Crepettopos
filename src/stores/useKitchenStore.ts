import { create } from 'zustand';
import { api } from '@/utils/helpers';
import type { Order, ItemStatus } from '@/types';

interface KitchenState {
  orders: Order[];
  loading: boolean;
  fetchActiveOrders: () => Promise<void>;
  updateItemStatus: (itemId: string, status: ItemStatus) => Promise<void>;
}

export const useKitchenStore = create<KitchenState>((set, get) => ({
  orders: [],
  loading: false,

  fetchActiveOrders: async () => {
    set({ loading: true });
    const res = await api.get<Order[]>('/orders?active=true');
    set({ orders: Array.isArray(res) ? res : [], loading: false });
  },

  updateItemStatus: async (itemId, status) => {
    await api.put(`/orders/items/${itemId}/status`, { status });
    set((s) => ({
      orders: s.orders.map((o) => ({
        ...o,
        items: o.items.map((i) => (i.id === itemId ? { ...i, status } : i)),
      })),
    }));
  },
}));
