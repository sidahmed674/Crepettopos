import { create } from 'zustand';
import { api } from '@/utils/helpers';
import type { CartItem, MenuItem, Order, PaymentMethod } from '@/types';
import { calcOrderTotals } from '@/utils/helpers';

interface OrderState {
  cart: CartItem[];
  selectedTableId: string | null;
  isTakeaway: boolean;
  orders: Order[];
  loading: boolean;

  setTable: (id: string | null) => void;
  setTakeaway: (v: boolean) => void;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, qty: number) => void;
  updateDiscount: (index: number, discount: number) => void;
  updateNote: (index: number, note: string) => void;
  clearCart: () => void;
  cartTotal: (taxRate: number) => ReturnType<typeof calcOrderTotals>;

  submitOrder: (cashierId: string, cashierName: string, taxRate: number) => Promise<Order>;
  fetchOrders: (filters?: Record<string, string>) => Promise<void>;
  fetchActiveOrders: () => Promise<void>;
  fetchOrderById: (orderId: string) => Promise<Order | null>;
  addItemToOrder: (orderId: string, items: { menuItemId: string; name: string; quantity: number; unitPrice: number; discount?: number; note?: string }[]) => Promise<Order>;
  removeItemFromOrder: (orderId: string, itemId: string) => Promise<Order>;
  payOrder: (orderId: string, method: PaymentMethod) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  cart: [],
  selectedTableId: null,
  isTakeaway: false,
  orders: [],
  loading: false,

  setTable: (id) => set({ selectedTableId: id }),
  setTakeaway: (v) => set({ isTakeaway: v, selectedTableId: v ? null : get().selectedTableId }),

  addToCart: (item) => {
    const existing = get().cart.findIndex((c) => c.menuItem.id === item.id);
    if (existing >= 0) {
      set((s) => ({
        cart: s.cart.map((c, i) => i === existing ? { ...c, quantity: c.quantity + 1 } : c),
      }));
    } else {
      set((s) => ({ cart: [...s.cart, { menuItem: item, quantity: 1, discount: 0 }] }));
    }
  },

  removeFromCart: (index) => set((s) => ({ cart: s.cart.filter((_, i) => i !== index) })),

  updateQuantity: (index, qty) => {
    if (qty <= 0) { get().removeFromCart(index); return; }
    set((s) => ({ cart: s.cart.map((c, i) => i === index ? { ...c, quantity: qty } : c) }));
  },

  updateDiscount: (index, discount) => {
    set((s) => ({ cart: s.cart.map((c, i) => i === index ? { ...c, discount } : c) }));
  },

  updateNote: (index, note) => {
    set((s) => ({ cart: s.cart.map((c, i) => i === index ? { ...c, note } : c) }));
  },

  clearCart: () => set({ cart: [], selectedTableId: null }),

  cartTotal: (taxRate) => calcOrderTotals(get().cart, taxRate),

  submitOrder: async (cashierId, cashierName, taxRate) => {
    const { cart, selectedTableId, isTakeaway } = get();
    const totals = calcOrderTotals(cart, taxRate);
    // API returns order directly (not wrapped)
    const res = await api.post<Order>('/orders', {
      tableId: selectedTableId,
      isTakeaway,
      items: cart.map((c) => {
        const lang = localStorage.getItem('crepettoo_lang') || 'ar';
        const itemName = lang === 'fr' ? (c.menuItem.nameFr || c.menuItem.name) :
                         lang === 'en' ? c.menuItem.name :
                         (c.menuItem.nameAr || c.menuItem.name);
        return {
          menuItemId: c.menuItem.id,
          name: itemName,
          quantity: c.quantity,
          unitPrice: c.menuItem.price,
          discount: c.discount,
          note: c.note,
        };
      }),
      ...totals,
      cashierId,
      cashierName,
    });
    get().clearCart();
    return res;
  },

  fetchOrders: async (filters) => {
    set({ loading: true });
    const query = filters ? '?' + new URLSearchParams(filters).toString() : '';
    // API returns array directly
    const res = await api.get<Order[]>(`/orders${query}`);
    set({ orders: Array.isArray(res) ? res : [], loading: false });
  },

  fetchActiveOrders: async () => {
    set({ loading: true });
    const res = await api.get<Order[]>('/orders?active=true');
    set({ orders: Array.isArray(res) ? res : [], loading: false });
  },

  fetchOrderById: async (orderId) => {
    const res = await api.get<Order>(`/orders/${orderId}`);
    return res || null;
  },

  addItemToOrder: async (orderId, items) => {
    const res = await api.post<Order>(`/orders/${orderId}/items`, { items });
    set((s) => ({
      orders: s.orders.map((o) => o.id === orderId ? res : o),
    }));
    return res;
  },

  removeItemFromOrder: async (orderId, itemId) => {
    const res = await api.delete<Order>(`/orders/${orderId}/items/${itemId}`);
    set((s) => ({
      orders: s.orders.map((o) => o.id === orderId ? res : o),
    }));
    return res;
  },

  payOrder: async (orderId, method) => {
    await api.post(`/orders/${orderId}/pay`, { paymentMethod: method });
    set((s) => ({
      orders: s.orders.map((o) => o.id === orderId ? { ...o, status: 'paid', paymentMethod: method, paidAt: new Date().toISOString() } : o),
    }));
  },

  cancelOrder: async (orderId) => {
    await api.post(`/orders/${orderId}/cancel`);
    set((s) => ({
      orders: s.orders.map((o) => o.id === orderId ? { ...o, status: 'cancelled' } : o),
    }));
  },
}));
