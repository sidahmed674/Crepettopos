import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  MapPin,
  ShoppingBag,
  Clock,
  Receipt,
  Search,
  X,
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Printer,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import { useI18n } from '@/i18n';
import { useTableStore } from '@/stores/useTableStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useMenuStore } from '@/stores/useMenuStore';
import { usePrint } from '@/hooks/usePrint';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useRealtime } from '@/hooks/useRealtime';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Table, Order, MenuItem } from '@/types';

const STATUS_COLORS: Record<Table['status'], string> = {
  available: 'emerald',
  occupied: 'red',
  reserved: 'blue',
  cleaning: 'orange',
} as const;

const STATUS_LABEL_CLASSES: Record<Table['status'], string> = {
  available: 'bg-emerald-500 text-white',
  occupied: 'bg-red-500 text-white',
  reserved: 'bg-blue-500 text-white',
  cleaning: 'bg-orange-500 text-white',
} as const;

const STATUS_RING: Record<Table['status'], string> = {
  available: 'ring-emerald-400/40',
  occupied: 'ring-red-400/40',
  reserved: 'ring-blue-400/40',
  cleaning: 'ring-orange-400/40',
} as const;

const emptyTable: Partial<Table> = {
  number: 0,
  name: '',
  capacity: 4,
  zone: '',
  status: 'available',
};

export default function TablesPage() {
  const { t } = useI18n();
  const { tables, fetchTables, addTable, updateTable, deleteTable, updateStatus } = useTableStore();
  const { orders, fetchActiveOrders, addItemToOrder, removeItemFromOrder, fetchOrderById, payOrder } = useOrderStore();
  const { items } = useMenuStore();
  const { printCustomer } = usePrint();
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Partial<Table> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Table | null>(null);
  const [statusMenu, setStatusMenu] = useState<string | null>(null);
  const [zoneFilter, setZoneFilter] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [payCopies, setPayCopies] = useState<1 | 2>(1);
  const [paying, setPaying] = useState(false);

  const selectedOrderIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedOrderIdRef.current = selectedOrder?.id ?? null;
  }, [selectedOrder]);

  const refreshData = useCallback(() => {
    fetchActiveOrders();
    fetchTables();
    const id = selectedOrderIdRef.current;
    if (id) {
      fetchOrderById(id).then((fresh) => {
        if (fresh) setSelectedOrder(fresh);
      });
    }
  }, [fetchActiveOrders, fetchTables, fetchOrderById]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useRealtime(refreshData);

  const tableOrderMap = useMemo(() => {
    const map: Record<string, Order> = {};
    for (const order of orders) {
      if (order.tableId && order.status !== 'paid' && order.status !== 'cancelled') {
        if (!map[order.tableId]) {
          map[order.tableId] = order;
        }
      }
    }
    return map;
  }, [orders]);

  const filteredMenuItems = useMemo(() => {
    const available = items.filter((i) => i.available);
    if (!itemSearchQuery.trim()) return available;
    const q = itemSearchQuery.toLowerCase();
    return available.filter((i) =>
      i.name.toLowerCase().includes(q) || i.nameAr.toLowerCase().includes(q) || i.nameFr.toLowerCase().includes(q)
    );
  }, [items, itemSearchQuery]);

  const zones = useMemo(() => {
    const zoneSet = new Set(tables.filter((t) => t.zone).map((t) => t.zone!));
    return Array.from(zoneSet);
  }, [tables]);

  const filteredTables = useMemo(() => {
    if (!zoneFilter) return tables;
    return tables.filter((t) => t.zone === zoneFilter);
  }, [tables, zoneFilter]);

  const getStatusLabel = (status: Table['status']) => {
    return t(`tables.${status}`);
  };

  const getErrorMessage = (err: unknown): string => {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('already exists')) return t('tables.numberExists');
    if (msg.includes('access required') || msg.includes('Unauthorized')) return t('common.adminRequired');
    return msg || t('common.error');
  };

  const handleSave = async () => {
    if (!editingTable) return;
    if (!editingTable.number || editingTable.number < 1) {
      toast.error(t('tables.invalidNumber'));
      return;
    }
    try {
      if (editingTable.id) {
        await updateTable(editingTable.id, editingTable);
      } else {
        await addTable(editingTable);
      }
      setDialogOpen(false);
      setEditingTable(null);
      toast.success(t('common.success'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteTable(deleteConfirm.id);
      setDeleteConfirm(null);
      toast.success(t('common.success'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleStatusChange = async (tableId: string, status: Table['status']) => {
    try {
      await updateStatus(tableId, status);
      setStatusMenu(null);
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleTableClick = (table: Table) => {
    const activeOrder = tableOrderMap[table.id];
    const effStatus: Table['status'] = activeOrder ? 'occupied' : table.status;
    if (effStatus === 'occupied') {
      if (activeOrder) {
        setSelectedOrder(activeOrder);
        setOrderDialogOpen(true);
        fetchOrderById(activeOrder.id).then((fresh) => {
          if (fresh) setSelectedOrder(fresh);
        });
      } else {
        setStatusMenu(statusMenu === table.id ? null : table.id);
      }
    } else {
      setStatusMenu(statusMenu === table.id ? null : table.id);
    }
  };

  const handleAddItem = async (menuItem: MenuItem) => {
    if (!selectedOrder) return;
    try {
      const updated = await addItemToOrder(selectedOrder.id, [{
        menuItemId: menuItem.id,
        name: menuItem.nameAr,
        quantity: 1,
        unitPrice: menuItem.price,
      }]);
      setSelectedOrder(updated);
      toast.success(t('tables.itemAdded'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!selectedOrder) return;
    try {
      const updated = await removeItemFromOrder(selectedOrder.id, itemId);
      setSelectedOrder(updated);
      toast.success(t('tables.itemRemoved'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const recalculateTotal = (order: Order) => {
    return order.items.reduce((sum, item) => {
      return sum + (item.unitPrice * item.quantity - (item.discount || 0));
    }, 0);
  };

  const handlePayFromTable = async () => {
    if (!selectedOrder || paying) return;
    setPaying(true);
    try {
      await payOrder(selectedOrder.id, payMethod);
      toast.success(t('tables.orderPaid'));
      setPayMethod('cash');
      setOrderDialogOpen(false);
      const paidOrder = {
        ...selectedOrder,
        status: 'paid' as const,
        paymentMethod: payMethod,
        paidAt: new Date().toISOString(),
      };
      setSelectedOrder(null);
      refreshData();
      // Customer invoice only: kitchen already printed at order time.
      if (settings.autoPrint) {
        setTimeout(() => printCustomer(paidOrder, payCopies), 500);
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center flex-wrap">
          <MapPin className="w-4 h-4 text-luxury-slate" />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setZoneFilter(null)}
            className={cn(
              'px-3 py-1 rounded-xl text-xs font-medium transition-all backdrop-blur-sm',
              !zoneFilter
                ? 'bg-luxury-gold text-white shadow-sm'
                : 'bg-white/60 text-luxury-slate border border-white/40 hover:text-gray-900'
            )}
          >
            {t('common.all')}
          </motion.button>
          {zones.map((zone) => (
            <motion.button
              key={zone}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setZoneFilter(zone === zoneFilter ? null : zone)}
              className={cn(
                'px-3 py-1 rounded-xl text-xs font-medium transition-all backdrop-blur-sm',
                zoneFilter === zone
                  ? 'bg-luxury-gold text-white shadow-sm'
                  : 'bg-white/60 text-luxury-slate border border-white/40 hover:text-gray-900'
              )}
            >
              {zone}
            </motion.button>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            const maxNum = tables.reduce((max, t) => Math.max(max, t.number), 0);
            setEditingTable({ ...emptyTable, number: maxNum + 1 });
            setDialogOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-luxury-gold text-white text-sm font-medium shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          {t('tables.addTable')}
        </motion.button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-3">
        {filteredTables.map((table) => {
          const activeOrder = tableOrderMap[table.id];
          const effStatus: Table['status'] = activeOrder ? 'occupied' : table.status;
          return (
          <motion.div
            key={table.id}
            layout
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'relative bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl p-4 cursor-pointer transition-all',
              'ring-2 ring-offset-1 ring-offset-transparent',
              STATUS_RING[effStatus]
            )}
            style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}
            onClick={() => handleTableClick(table)}
          >
            {/* Actions */}
            <div className="absolute top-2 left-2 flex gap-1" onClick={(e) => e.stopPropagation()}>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setEditingTable({ ...table });
                  setDialogOpen(true);
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-luxury-gold transition-colors bg-white/50"
              >
                <Pencil className="w-3 h-3" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setDeleteConfirm(table)}
                className="p-1 rounded-lg text-gray-400 hover:text-red-500 transition-colors bg-white/50"
              >
                <Trash2 className="w-3 h-3" />
              </motion.button>
            </div>

            {/* Table Info */}
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{table.number}</p>
              {table.name && (
                <p className="text-xs text-luxury-slate mt-0.5">{table.name}</p>
              )}
              <div className="flex items-center justify-center gap-1 mt-2 text-luxury-slate">
                <Users className="w-3 h-3" />
                <span className="text-xs">{table.capacity}</span>
              </div>
              {table.zone && (
                <p className="text-[10px] text-luxury-slate/60 mt-1">{table.zone}</p>
              )}
              <span
                className={cn(
                  'inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                  STATUS_LABEL_CLASSES[effStatus]
                )}
              >
                {getStatusLabel(effStatus)}
              </span>
              {activeOrder && (
                <div className="mt-2 flex items-center justify-center gap-1 text-luxury-gold">
                  <Receipt className="w-3 h-3" />
                  <span className="text-[10px] font-medium">
                    {tableOrderMap[table.id].orderNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Status Menu Overlay */}
            <AnimatePresence>
              {statusMenu === table.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 bg-white/80 backdrop-blur-md rounded-2xl border border-white/50 p-3 z-10 flex flex-col justify-center gap-1.5"
                  style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-xs text-luxury-slate text-center mb-1 font-medium">
                    {t('tables.status')}
                  </p>
                  {(['available', 'occupied', 'reserved', 'cleaning'] as const).map((status) => (
                    <motion.button
                      key={status}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleStatusChange(table.id, status)}
                      className={cn(
                        'w-full py-1.5 rounded-xl text-xs font-medium transition-all',
                        table.status === status
                          ? 'bg-luxury-gold text-white shadow-sm'
                          : 'bg-white/60 text-luxury-slate border border-white/40 hover:text-gray-900'
                      )}
                    >
                      {getStatusLabel(status)}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          );
        })}
      </div>

      {filteredTables.length === 0 && (
        <p className="text-center py-12 text-luxury-slate">{t('tables.noTables')}</p>
      )}

      {/* Order Details Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="bg-white/90 backdrop-blur-xl border border-white/40 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-luxury-gold" />
              {t('tables.currentOrder')}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-2">
              {/* Live table status (from store, not the stale copy inside the order) */}
              {(() => {
                const liveTable = tables.find((tb) => tb.id === selectedOrder.tableId);
                if (liveTable) selectedOrder.table = liveTable;
                return null;
              })()}
              {/* Header Info */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="gold" className="text-xs">
                    {t('tables.table')} {selectedOrder.table?.number ?? '—'}
                  </Badge>
                  <span className="text-luxury-slate font-mono text-xs">
                    {selectedOrder.orderNumber}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-luxury-slate text-xs">
                  <Clock className="w-3 h-3" />
                  {format(new Date(selectedOrder.createdAt), 'HH:mm')}
                </div>
              </div>

              {/* Status & Cashier */}
              <div className="flex items-center justify-between text-xs text-luxury-slate">
                <span>{t('tables.cashier')}: {selectedOrder.cashierName || '—'}</span>
                <Badge variant={selectedOrder.status === 'ready' ? 'green' : 'blue'} className="text-[10px]">
                  {selectedOrder.status}
                </Badge>
              </div>

              {/* Table Status Change */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">{t('tables.status')}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {(['available', 'occupied', 'reserved', 'cleaning'] as const).map((status) => (
                    <motion.button
                      key={status}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const tableId = selectedOrder.tableId;
                        if (tableId) handleStatusChange(tableId, status);
                        if (status !== 'occupied') setOrderDialogOpen(false);
                      }}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all',
                        selectedOrder.table?.status === status
                          ? 'bg-luxury-gold text-white shadow-sm'
                          : 'bg-white/60 text-luxury-slate border border-white/40 hover:text-gray-900'
                      )}
                    >
                      {getStatusLabel(status)}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-xs font-semibold text-gray-700">{t('tables.orderItems')}</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setItemSearchQuery('');
                      setAddItemDialogOpen(true);
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-luxury-gold text-white text-[10px] font-medium hover:shadow-md transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    {t('tables.addItem')}
                  </motion.button>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedOrder.items.length === 0 ? (
                    <p className="text-xs text-luxury-slate text-center py-4">{t('tables.noItems')}</p>
                  ) : (
                    selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-luxury-cream/50 rounded-xl px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-3.5 h-3.5 text-luxury-gold" />
                          <div>
                            <p className="text-xs font-medium text-gray-800">{item.name}</p>
                            {item.note && (
                              <p className="text-[10px] text-luxury-slate italic">{item.note}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-luxury-slate">×{item.quantity}</span>
                          <span className="font-semibold text-gray-800">
                            {(item.unitPrice * item.quantity - (item.discount || 0)).toFixed(2)} دج
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </motion.button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-luxury-gold/20 pt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">{t('tables.orderTotal')}</span>
                <span className="text-lg font-bold text-luxury-gold">
                  {recalculateTotal(selectedOrder).toFixed(2)} دج
                </span>
              </div>

              {/* Payment (only for open orders) */}
              {!['paid', 'cancelled', 'refunded'].includes(selectedOrder.status) && (
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">{t('tables.payment')}</p>
                  <div className="flex gap-1.5">
                    {([
                      { key: 'cash' as const, icon: Banknote, label: t('pos.cash') },
                      { key: 'card' as const, icon: CreditCard, label: t('pos.card') },
                      { key: 'transfer' as const, icon: ArrowRightLeft, label: t('pos.transfer') },
                    ]).map(({ key, icon: Icon, label }) => (
                      <motion.button
                        key={key}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setPayMethod(key)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all border',
                          payMethod === key
                            ? 'bg-luxury-gold/10 text-luxury-gold-dark border-luxury-gold/40'
                            : 'bg-white/60 text-luxury-slate border-gray-200 hover:text-gray-700'
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {label}
                      </motion.button>
                    ))}
                  </div>
                  {/* Print controls: auto-print toggle + copies count */}
                  <div className="flex gap-1.5 items-center">
                    <button
                      type="button"
                      onClick={() => updateSettings({ autoPrint: !settings.autoPrint })}
                      title={t('pos.autoPrint')}
                      className={cn(
                        'inline-flex items-center justify-center h-8 w-8 shrink-0 rounded-lg border transition-all',
                        settings.autoPrint
                          ? 'bg-luxury-gold text-white border-luxury-gold shadow-sm'
                          : 'bg-white/60 text-gray-400 border-gray-200 hover:text-gray-600'
                      )}
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    {([1, 2] as const).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setPayCopies(n)}
                        className={cn(
                          'flex-1 inline-flex items-center justify-center h-8 rounded-lg text-[11px] font-medium border transition-all',
                          payCopies === n
                            ? 'bg-luxury-gold/10 text-luxury-gold-dark border-luxury-gold/40'
                            : 'bg-white/60 text-gray-500 border-gray-200 hover:text-gray-700'
                        )}
                      >
                        {n === 1 ? t('pos.copy1') : t('pos.copy2')}
                      </button>
                    ))}
                  </div>
                  <Button
                    onClick={handlePayFromTable}
                    disabled={paying}
                    className="w-full h-10 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all disabled:opacity-60"
                  >
                    {paying ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      `${t('tables.confirmPayment')} · ${recalculateTotal(selectedOrder).toFixed(2)} دج`
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setOrderDialogOpen(false)}
              className="text-sm bg-luxury-gold text-white hover:shadow-md transition-all rounded-xl"
            >
              {t('tables.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
        <DialogContent className="bg-white/90 backdrop-blur-xl border border-white/40 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-luxury-gold" />
              {t('tables.selectItem')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-luxury-slate" />
              <Input
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
                placeholder={t('tables.searchItems')}
                className="pl-9 bg-white/60 border-white/40 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {/* Items List */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {filteredMenuItems.length === 0 ? (
                <p className="text-xs text-luxury-slate text-center py-4">{t('tables.noItems')}</p>
              ) : (
                filteredMenuItems.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      handleAddItem(item);
                      setAddItemDialogOpen(false);
                    }}
                    className="w-full flex items-center justify-between bg-luxury-cream/50 hover:bg-luxury-gold/10 rounded-xl px-3 py-2.5 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-3.5 h-3.5 text-luxury-gold" />
                      <div className="text-left">
                        <p className="text-xs font-medium text-gray-800">{item.nameAr}</p>
                        {item.name !== item.nameAr && (
                          <p className="text-[10px] text-luxury-slate">{item.name}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-luxury-gold">
                      {item.price.toFixed(2)} دج
                    </span>
                  </motion.button>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setAddItemDialogOpen(false)}
              className="text-sm text-luxury-slate hover:text-gray-900"
            >
              {t('common.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white/80 backdrop-blur-xl border border-white/40">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {editingTable?.id ? t('tables.editTable') : t('tables.addTable')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-luxury-slate mb-1 block">{t('tables.tableNumber')}</label>
              <Input
                type="number"
                value={editingTable?.number || ''}
                onChange={(e) => setEditingTable((p) => ({ ...p!, number: Number(e.target.value) }))}
                className="bg-white/60 border-white/40 text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="text-sm text-luxury-slate mb-1 block">{t('tables.tableName')}</label>
              <Input
                value={editingTable?.name || ''}
                onChange={(e) => setEditingTable((p) => ({ ...p!, name: e.target.value }))}
                className="bg-white/60 border-white/40 text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="text-sm text-luxury-slate mb-1 block">{t('tables.capacity')}</label>
              <Input
                type="number"
                min="1"
                value={editingTable?.capacity || 1}
                onChange={(e) => setEditingTable((p) => ({ ...p!, capacity: Number(e.target.value) }))}
                className="bg-white/60 border-white/40 text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="text-sm text-luxury-slate mb-1 block">{t('tables.zone')}</label>
              <Input
                value={editingTable?.zone || ''}
                onChange={(e) => setEditingTable((p) => ({ ...p!, zone: e.target.value }))}
                placeholder="Terrace, Interior, VIP..."
                className="bg-white/60 border-white/40 text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              className="text-sm text-luxury-slate hover:text-gray-900"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              className="text-sm bg-luxury-gold text-white hover:shadow-md transition-all rounded-xl"
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-white/80 backdrop-blur-xl border border-white/40">
          <DialogHeader>
            <DialogTitle className="text-gray-900">{t('common.confirm')}</DialogTitle>
          </DialogHeader>
          <p className="text-luxury-slate py-4">
            {t('tables.confirmDelete', { number: deleteConfirm?.number || 0 })}
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirm(null)}
              className="text-sm text-luxury-slate hover:text-gray-900"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleDelete}
              className="text-sm bg-red-500 text-white hover:bg-red-600 rounded-xl"
            >
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
