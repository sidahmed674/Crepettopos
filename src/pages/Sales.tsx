import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Search,
  ShoppingBag,
  Receipt,
  Clock,
  TrendingUp,
  Filter,
  X,
  RotateCcw,
} from 'lucide-react';
import { isToday, isThisWeek, isThisMonth, format } from 'date-fns';
import { useI18n } from '@/i18n';
import { cn } from '@/utils/cn';
import { api, formatCurrency } from '@/utils/helpers';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Order } from '@/types';

type Period = 'today' | 'week' | 'month' | 'all';
type PaymentFilter = 'all' | 'cash' | 'card' | 'transfer';

export default function SalesPage() {
  const { t } = useI18n();
  const { settings } = useSettingsStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<Order[]>('/orders?status=paid');
        if (!cancelled) {
          setOrders(Array.isArray(res) ? res : []);
        }
      } catch (err) {
        console.error('[Sales] fetch error:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load');
          setOrders([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const searchFilter = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter((o) =>
      String(o.orderNumber).toLowerCase().includes(q) ||
      (Array.isArray(o.items) && o.items.some((item) => item.name.toLowerCase().includes(q)))
    );
  }, [orders, search]);

  const filtered = useMemo(() => {
    if (period === 'all' && paymentFilter === 'all') return searchFilter;
    return searchFilter.filter((o) => {
      const created = new Date(o.createdAt);
      if (period === 'today' && !isToday(created)) return false;
      if (period === 'week' && !isThisWeek(created, { weekStartsOn: 1 })) return false;
      if (period === 'month' && !isThisMonth(created)) return false;
      if (paymentFilter !== 'all' && o.paymentMethod !== paymentFilter) return false;
      return true;
    });
  }, [searchFilter, period, paymentFilter]);

  const totalRevenue = filtered.reduce((sum, o) => sum + (o.total || 0), 0);
  const avgInvoice = filtered.length > 0 ? totalRevenue / filtered.length : 0;

  const stats = [
    {
      label: t('sales.totalRevenue'),
      value: formatCurrency(totalRevenue, settings.currency),
      icon: TrendingUp,
      color: 'text-luxury-gold',
      bg: 'bg-luxury-gold/10',
    },
    {
      label: t('sales.totalInvoices'),
      value: filtered.length.toString(),
      icon: Receipt,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: t('sales.avgInvoice'),
      value: formatCurrency(avgInvoice, settings.currency),
      icon: ShoppingBag,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
  ];

  const periods: { key: Period; label: string }[] = [
    { key: 'today', label: t('sales.today') },
    { key: 'week', label: t('sales.week') },
    { key: 'month', label: t('sales.month') },
    { key: 'all', label: t('sales.all') },
  ];

  const paymentMethods: { key: PaymentFilter; label: string }[] = [
    { key: 'all', label: t('sales.all') },
    { key: 'cash', label: t('sales.cash') },
    { key: 'card', label: t('sales.card') },
    { key: 'transfer', label: t('sales.transfer') },
  ];

  const paymentVariant = (method?: string) => {
    if (method === 'cash') return 'success';
    if (method === 'card') return 'blue';
    if (method === 'transfer') return 'default';
    return 'secondary';
  };

  const paymentLabel = (method?: string) => {
    if (method === 'cash') return t('sales.cash');
    if (method === 'card') return t('sales.card');
    if (method === 'transfer') return t('sales.transfer');
    return '—';
  };

  const safeFormatDate = (dateStr?: string) => {
    try {
      if (!dateStr) return '';
      return format(new Date(dateStr), 'HH:mm - DD/MM/YYYY');
    } catch {
      return '';
    }
  };

  const handleRefund = async (orderId: string) => {
    if (!confirm(t('sales.refundConfirm'))) return;
    try {
      await api.post(`/orders/${orderId}/refund`, { reason: 'Refunded from Sales' });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'refunded' as const } : o))
      );
      toast.success(t('sales.refunded'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('sales.title')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              className="bg-white/70 backdrop-blur-md border-white/40 rounded-2xl"
              style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={cn('p-3 rounded-xl', stat.bg)}>
                    <stat.icon className={cn('w-5 h-5', stat.color)} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card
        className="bg-white/70 backdrop-blur-md border-white/40 rounded-2xl"
        style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}
      >
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-gray-500" />
              {periods.map((p) => (
                <Button
                  key={p.key}
                  size="sm"
                  variant={period === p.key ? 'default' : 'outline'}
                  onClick={() => setPeriod(p.key)}
                  className={cn(
                    'rounded-xl text-xs',
                    period === p.key
                      ? 'bg-luxury-gold hover:bg-luxury-gold/90 text-white'
                      : 'bg-white/60 border-gray-200 text-gray-700 hover:bg-white/80'
                  )}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">{t('sales.payment')}:</span>
              {paymentMethods.map((pm) => (
                <Button
                  key={pm.key}
                  size="sm"
                  variant={paymentFilter === pm.key ? 'default' : 'outline'}
                  onClick={() => setPaymentFilter(pm.key)}
                  className={cn(
                    'rounded-xl text-xs',
                    paymentFilter === pm.key
                      ? 'bg-luxury-gold hover:bg-luxury-gold/90 text-white'
                      : 'bg-white/60 border-gray-200 text-gray-700 hover:bg-white/80'
                  )}
                >
                  {pm.label}
                </Button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={t('sales.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 bg-white/60 border-gray-200 text-gray-900 rounded-xl text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className="bg-white/70 backdrop-blur-md border-white/40 rounded-2xl"
        style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}
      >
        <CardContent className="p-4">
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          ) : loading ? (
            <p className="text-center py-8 text-gray-500">{t('common.loading')}</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('sales.noSales')}</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-3">
                {filtered.map((order, i) => {
                  const isExpanded = expandedId === order.id;
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
                        className={cn(
                          'w-full text-left p-4 rounded-xl border transition-all',
                          isExpanded
                            ? 'bg-white/80 border-luxury-gold/30 shadow-sm'
                            : 'bg-white/50 border-white/40 hover:bg-white/70'
                        )}
                      >
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-sm font-bold text-gray-900 shrink-0">
                              {order.orderNumber}
                            </span>
                            {order.isTakeaway ? (
                              <Badge variant="warning" className="text-[10px] shrink-0">
                                {t('sales.takeaway')}
                              </Badge>
                            ) : order.table ? (
                              <Badge variant="secondary" className="text-[10px] shrink-0">
                                {t('sales.table')} {order.table.number}
                              </Badge>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge variant={paymentVariant(order.paymentMethod)} className="text-[10px]">
                              {paymentLabel(order.paymentMethod)}
                            </Badge>
                            <span className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                              <Clock className="w-3 h-3" />
                              {safeFormatDate(order.createdAt)}
                            </span>
                            <span className="text-xs text-gray-500 shrink-0">
                              {order.items?.length || 0} {t('sales.items')}
                            </span>
                            <span className="text-sm font-bold text-luxury-gold shrink-0">
                              {formatCurrency(order.total, settings.currency)}
                            </span>
                          </div>
                        </div>

                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="mt-4 pt-4 border-t border-gray-200 space-y-2"
                          >
                            {(order.items || []).map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-gray-900 truncate">{item.name}</span>
                                  <span className="text-gray-400">×{item.quantity}</span>
                                  {item.discount > 0 && (
                                    <Badge variant="destructive" className="text-[10px]">
                                      -{formatCurrency(item.discount, settings.currency)}
                                    </Badge>
                                  )}
                                </div>
                                <span className="font-medium text-gray-700 shrink-0">
                                  {formatCurrency(item.unitPrice * item.quantity - item.discount, settings.currency)}
                                </span>
                              </div>
                            ))}
                            {order.note && (
                              <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                                {order.note}
                              </div>
                            )}
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                              <span className="text-sm font-bold text-luxury-gold">
                                {formatCurrency(order.total, settings.currency)}
                              </span>
                              {order.status === 'paid' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRefund(order.id); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  {t('sales.refund')}
                                </button>
                              )}
                              {order.status === 'refunded' && (
                                <Badge variant="destructive" className="text-[10px]">
                                  {t('sales.refunded')}
                                </Badge>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
