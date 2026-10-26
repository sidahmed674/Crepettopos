import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Printer,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '@/i18n';
import { useMenuStore } from '@/stores/useMenuStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useTableStore } from '@/stores/useTableStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePrint } from '@/hooks/usePrint';
import { useRealtime } from '@/hooks/useRealtime';
import { formatCurrency } from '@/utils/helpers';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { MenuItem, Order } from '@/types';

export default function POSPage() {
  const { t } = useI18n();
  const { categories, items } = useMenuStore();
  const {
    cart, selectedTableId, isTakeaway, setTable, setTakeaway,
    addToCart, removeFromCart, updateQuantity, updateDiscount, updateNote,
    clearCart, cartTotal, submitOrder, payOrder,
  } = useOrderStore();
  const { tables, fetchTables } = useTableStore();
  const { settings, updateSettings } = useSettingsStore();
  const { user } = useAuthStore();
  const { printReceipt, printKitchen } = usePrint();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [submitting, setSubmitting] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  const availableTables = useMemo(() => tables.filter((t) => t.status === 'available'), [tables]);

  const filteredItems = useMemo(() => {
    let result = items.filter((i) => i.available);
    if (activeCategory) result = result.filter((i) => i.categoryId === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) =>
        i.name.toLowerCase().includes(q) || i.nameAr.toLowerCase().includes(q) || i.nameFr.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, activeCategory, searchQuery]);

  const totals = useMemo(() => cartTotal(0), [cart]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  useRealtime(fetchTables, ['tables']);

  const handleAddToCart = (item: MenuItem) => addToCart(item);

  // Single POS action:
  // - Table order: create pending + table auto-occupied + print KITCHEN only.
  //   Payment happens later from the Tables page (customer invoice only).
  // - Takeaway: create + pay immediately + print BOTH pages.
  const handleConfirm = async () => {
    if (cart.length === 0) return toast.error(t('pos.emptyCart'));
    if (!isTakeaway && !selectedTableId) return toast.error(t('pos.selectTable'));
    setSubmitting(true);
    try {
      const order = await submitOrder(user!.id, user!.name, 0);
      setLastOrder(isTakeaway
        ? { ...order, status: 'paid' as const, paymentMethod, paidAt: new Date().toISOString() }
        : order);
      if (isTakeaway) {
        await payOrder(order.id, paymentMethod);
        toast.success(t('pos.orderPaid'));
        if (settings.autoPrint) {
          setTimeout(() => printReceipt({ ...order, status: 'paid' as const, paymentMethod, paidAt: new Date().toISOString() }), 500);
        }
      } else {
        toast.success(t('pos.orderSent'));
        if (settings.autoPrint) {
          setTimeout(() => printKitchen(order), 500);
        }
      }
      setPaymentMethod('cash');
      fetchTables();
    } catch { toast.error(t('common.error')); }
    finally { setSubmitting(false); }
  };

  const getItemName = (item: MenuItem) => {
    const lang = localStorage.getItem('crepettoo_lang') || 'ar';
    if (lang === 'fr') return item.nameFr || item.name;
    if (lang === 'en') return item.name;
    return item.nameAr || item.name;
  };

  const getCategoryName = (cat: { name: string; nameAr: string; nameFr: string }) => {
    const lang = localStorage.getItem('crepettoo_lang') || 'ar';
    if (lang === 'fr') return cat.nameFr || cat.name;
    if (lang === 'en') return cat.name;
    return cat.nameAr || cat.name;
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-0 gap-4" dir="ltr">
      {/* LEFT PANEL */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('pos.searchItems')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-12 w-full rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm pr-10 pl-4 py-2 text-base text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold focus-visible:ring-offset-2 transition-all duration-200"
            style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
              !activeCategory
                ? 'bg-luxury-gold text-white border-luxury-gold shadow-sm'
                : 'bg-white/70 text-gray-500 border-gray-200 hover:text-gray-700'
            }`}
          >
            {t('pos.allCategories')}
          </button>
          {categories.filter((c) => c.active).sort((a, b) => a.sortOrder - b.sortOrder).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id === activeCategory ? null : cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                activeCategory === cat.id
                  ? 'bg-luxury-gold text-white border-luxury-gold shadow-sm'
                  : 'bg-white/70 text-gray-500 border-gray-200 hover:text-gray-700'
              }`}
            >
              {getCategoryName(cat)}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 2xl:grid-cols-7 gap-2">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.button
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAddToCart(item)}
                  className="relative flex flex-col items-center p-2 rounded-xl border border-white/40 bg-white/70 backdrop-blur-sm transition-all duration-200 text-right w-full hover:shadow-gold hover:border-luxury-gold/30 group"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                >
                  {item.image ? (
                    <div className="w-full h-12 rounded-lg bg-luxury-cream mb-1.5 overflow-hidden border border-luxury-gold/10">
                      <img src={item.image} alt={getItemName(item)} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full h-12 rounded-lg bg-gradient-to-br from-luxury-cream to-luxury-champagne mb-1.5 flex items-center justify-center border border-luxury-gold/10">
                      <ShoppingBag className="w-4 h-4 text-luxury-gold/50 group-hover:text-luxury-gold transition-colors" />
                    </div>
                  )}
                  <p className="font-medium text-xs text-gray-900 text-center leading-tight truncate w-full">
                    {getItemName(item)}
                  </p>
                  <p className="text-xs font-bold text-luxury-gold mt-0.5">
                    {formatCurrency(item.price, settings.currency)}
                  </p>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
          {filteredItems.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              {t('pos.noItems')}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* RIGHT PANEL - Cart */}
      <div className="w-[280px] xl:w-[320px] shrink-0 flex flex-col bg-white/60 backdrop-blur-md rounded-2xl border border-white/40"
        style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}>
        {/* Header */}
        <div className="p-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1.5">
            <ShoppingBag className="w-4 h-4 text-luxury-gold" />
            <span className="font-bold text-sm text-gray-900">{t('pos.cart', 'Cart')}</span>
            {cart.length > 0 && (
              <span className="bg-luxury-gold text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
                {cart.length}
              </span>
            )}
          </div>

          {/* Table Selector */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <button
              onClick={() => setTakeaway(!isTakeaway)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                isTakeaway
                  ? 'bg-luxury-gold/10 text-luxury-gold-dark border-luxury-gold/30'
                  : 'bg-white/50 text-gray-400 border-gray-200 hover:text-gray-600'
              }`}
            >
              <ShoppingBag className="w-3 h-3" />
              {t('pos.takeaway')}
            </button>
          </div>

          {!isTakeaway && (
            <div className="flex flex-wrap gap-1">
              {availableTables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => setTable(selectedTableId === table.id ? null : table.id)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-all duration-200 border ${
                    selectedTableId === table.id
                      ? 'bg-luxury-gold text-white border-luxury-gold'
                      : 'bg-white/50 text-gray-400 border-gray-200 hover:text-gray-600 hover:border-luxury-gold/30'
                  }`}
                >
                  {table.name || `#${table.number}`}
                </button>
              ))}
              {availableTables.length === 0 && (
                <p className="text-[10px] text-gray-400">{t('tables.noTables')}</p>
              )}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1 p-1.5">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <ShoppingBag className="w-10 h-10 mb-1 opacity-30" />
              <p className="text-xs">{t('pos.emptyCart')}</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <AnimatePresence>
                {cart.map((cartItem, index) => (
                  <motion.div
                    key={`${cartItem.menuItem.id}-${index}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-white/60 border border-gray-100 transition-all hover:border-luxury-gold/30"
                  >
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button onClick={() => updateQuantity(index, cartItem.quantity - 1)}
                        className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:text-luxury-gold hover:border-luxury-gold/40 transition-colors">
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-[11px] font-bold text-gray-900 w-4 text-center">{cartItem.quantity}</span>
                      <button onClick={() => updateQuantity(index, cartItem.quantity + 1)}
                        className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:text-luxury-gold hover:border-luxury-gold/40 transition-colors">
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <p className="flex-1 min-w-0 text-[11px] font-medium text-gray-900 truncate">
                      {getItemName(cartItem.menuItem)}
                    </p>
                    <p className="text-[11px] font-bold text-luxury-gold shrink-0">
                      {formatCurrency(cartItem.menuItem.price * cartItem.quantity - cartItem.discount, settings.currency)}
                    </p>
                    <button onClick={() => removeFromCart(index)} className="p-0.5 rounded text-gray-300 hover:text-red-500 transition-colors shrink-0">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {/* Footer - Summary & Payment */}
        <div className="border-t border-gray-100 p-2 space-y-1.5">
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>{t('pos.subtotal')}</span>
              <span>{formatCurrency(totals.subtotal, settings.currency)}</span>
            </div>
            {totals.discountTotal > 0 && (
              <div className="flex justify-between text-red-500">
                <span>{t('pos.discountTotal')}</span>
                <span>-{formatCurrency(totals.discountTotal, settings.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-luxury-gold pt-1 border-t border-gray-100">
              <span>{t('pos.grandTotal')}</span>
              <span>{formatCurrency(totals.total, settings.currency)}</span>
            </div>
          </div>

          {/* Payment Methods (takeaway only: table orders pay later) */}
          {isTakeaway && (
          <div className="flex gap-1">
            {[
              { key: 'cash' as const, icon: Banknote, label: t('pos.cash') },
              { key: 'card' as const, icon: CreditCard, label: t('pos.card') },
              { key: 'transfer' as const, icon: ArrowRightLeft, label: t('pos.transfer') },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setPaymentMethod(key)}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 border ${
                  paymentMethod === key
                    ? 'bg-luxury-gold/10 text-luxury-gold-dark border-luxury-gold/30'
                    : 'bg-white/50 text-gray-400 border-gray-200 hover:text-gray-600'
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-1">
            <button
              onClick={() => { clearCart(); setPaymentMethod('cash'); }}
              disabled={cart.length === 0}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-medium transition-all duration-200 h-9 w-9 shrink-0 bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleConfirm}
              disabled={submitting || cart.length === 0 || (!isTakeaway && !selectedTableId)}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-medium transition-all duration-200 h-9 flex-1 bg-luxury-gold text-white hover:bg-luxury-gold-dark shadow-sm disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (isTakeaway ? t('pos.pay') : t('pos.sendKitchen'))}
            </motion.button>
            <button
              onClick={() => updateSettings({ autoPrint: !settings.autoPrint })}
              title={t('pos.autoPrint')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-medium transition-all duration-200 h-9 w-9 shrink-0 border ${
                settings.autoPrint
                  ? 'bg-luxury-gold text-white border-luxury-gold shadow-sm'
                  : 'bg-white/50 text-gray-400 border-gray-200 hover:text-gray-600'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Print Copy Buttons */}
          <div className="flex gap-1">
            <button
              onClick={() => lastOrder && printKitchen(lastOrder, 1)}
              disabled={!lastOrder}
              className="flex-1 inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-lg text-[11px] font-medium transition-all duration-200 h-8 bg-white/60 text-gray-600 border border-gray-200 hover:border-luxury-gold/40 hover:text-luxury-gold disabled:opacity-40 disabled:pointer-events-none"
            >
              <Printer className="w-3 h-3" />
              {t('pos.copy1')}
            </button>
            <button
              onClick={() => lastOrder && printKitchen(lastOrder, 2)}
              disabled={!lastOrder}
              className="flex-1 inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-lg text-[11px] font-medium transition-all duration-200 h-8 bg-white/60 text-gray-600 border border-gray-200 hover:border-luxury-gold/40 hover:text-luxury-gold disabled:opacity-40 disabled:pointer-events-none"
            >
              <Printer className="w-3 h-3" />
              {t('pos.copy2')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
