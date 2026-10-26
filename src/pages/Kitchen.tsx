import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChefHat, Check, Play, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import { useI18n } from '@/i18n';
import { useKitchenStore } from '@/stores/useKitchenStore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Order, OrderItem, ItemStatus } from '@/types';

function getElapsedMinutes(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

function formatElapsed(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

const STATUS_BADGE: Record<ItemStatus, 'default' | 'gold' | 'green' | 'blue'> = {
  pending: 'default',
  preparing: 'gold',
  ready: 'green',
  served: 'blue',
  cancelled: 'default',
};

const ORDER_STATUS_BADGE: Record<string, 'default' | 'gold' | 'green' | 'blue'> = {
  pending: 'default',
  confirmed: 'gold',
  preparing: 'gold',
  ready: 'green',
  served: 'blue',
};

export default function KitchenPage() {
  const { t } = useI18n();
  const { orders, loading, fetchActiveOrders, updateItemStatus } = useKitchenStore();
  const [, setTick] = useState(0);

  useEffect(() => {
    fetchActiveOrders();
    const interval = setInterval(() => {
      fetchActiveOrders();
      setTick((v) => v + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchActiveOrders]);

  const activeOrders = useMemo(
    () => orders.filter((o) => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)),
    [orders]
  );

  const handleItemStatus = async (itemId: string, newStatus: ItemStatus) => {
    try {
      await updateItemStatus(itemId, newStatus);
    } catch {
      toast.error(t('common.error'));
    }
  };

  const getItemName = (item: OrderItem) => {
    return item.menuItem?.nameAr || item.name;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-luxury-gold/10 border border-luxury-gold/20">
            <ChefHat className="w-5 h-5 text-luxury-gold" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t('kitchen.activeOrders', { count: activeOrders.length })}
          </h2>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchActiveOrders}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-white/60 hover:backdrop-blur-md border border-white/40 transition-colors"
        >
          <Clock className="w-4 h-4" />
          {t('common.refresh', 'Refresh')}
        </motion.button>
      </div>

      {activeOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-white/40 mb-4">
            <ChefHat className="w-12 h-12 opacity-30 text-luxury-gold" />
          </div>
          <p className="text-lg text-gray-900">{t('kitchen.noOrders')}</p>
        </div>
      )}

      <ScrollArea className="h-[calc(100vh-10rem)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pr-4">
          <AnimatePresence>
            {activeOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                getItemName={getItemName}
                onItemStatus={handleItemStatus}
                t={t}
              />
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}

function OrderCard({
  order,
  getItemName,
  onItemStatus,
  t,
}: {
  order: Order;
  getItemName: (item: OrderItem) => string;
  onItemStatus: (itemId: string, status: ItemStatus) => void;
  t: (key: string, vars?: any) => string;
}) {
  const elapsed = getElapsedMinutes(order.createdAt);
  const isUrgent = elapsed > 15;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <Card
        className={cn(
          'rounded-2xl overflow-hidden bg-white/70 backdrop-blur-md border-white/40',
          isUrgent && 'border-red-400/50'
        )}
        style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}
      >
        <div className="p-4 border-b border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">
                {t('kitchen.orderNumber', { number: order.orderNumber })}
              </p>
              <p className="text-xs text-luxury-slate">
                {order.isTakeaway
                  ? t('kitchen.takeaway')
                  : order.table
                  ? t('kitchen.table', { number: order.table.number })
                  : '—'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isUrgent && (
                <Badge variant="destructive">{t('kitchen.urgent')}</Badge>
              )}
              <Badge variant={ORDER_STATUS_BADGE[order.status] || 'default'}>
                {order.status}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-luxury-slate">
            <Clock className="w-3 h-3" />
            <span className="text-xs">
              {t('kitchen.elapsed', { time: formatElapsed(elapsed) })}
            </span>
          </div>
        </div>

        <CardContent className="p-4 space-y-2">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-luxury-gold bg-luxury-gold/10 px-1.5 py-0.5 rounded-md">
                    {item.quantity}x
                  </span>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getItemName(item)}
                  </p>
                </div>
                {item.note && (
                  <p className="text-xs text-luxury-slate mt-1 ml-8">
                    {t('kitchen.itemNote', { note: item.note })}
                  </p>
                )}
                <Badge variant={STATUS_BADGE[item.status] || 'default'} className="mt-1.5 ml-8">
                  {t(`kitchen.status.${item.status}`)}
                </Badge>
              </div>

              <div className="flex flex-col gap-1 shrink-0">
                <AnimatePresence mode="wait">
                  {item.status === 'pending' && (
                    <motion.div
                      key="preparing"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onItemStatus(item.id, 'preparing')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20 text-xs font-medium hover:bg-luxury-gold/20 transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        {t('kitchen.startPreparing')}
                      </motion.button>
                    </motion.div>
                  )}
                  {item.status === 'preparing' && (
                    <motion.div
                      key="ready"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onItemStatus(item.id, 'ready')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium hover:bg-emerald-100 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        {t('kitchen.markReady')}
                      </motion.button>
                    </motion.div>
                  )}
                  {item.status === 'ready' && (
                    <motion.div
                      key="served"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onItemStatus(item.id, 'served')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 text-xs font-medium hover:bg-sky-100 transition-colors"
                      >
                        <Package className="w-3 h-3" />
                        {t('kitchen.markServed')}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
