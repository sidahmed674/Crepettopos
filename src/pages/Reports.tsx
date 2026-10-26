import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Banknote,
  TrendingUp,
  ShoppingBag,
  BarChart3,
  Calendar,
  AlertTriangle,
  Download,
  CreditCard,
  BanknoteIcon,
  ArrowRightLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '@/i18n';
import { cn } from '@/utils/cn';
import { useStatsStore } from '@/stores/useStatsStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { formatCurrency, api } from '@/utils/helpers';
import { exportSalesToExcel } from '@/utils/exporters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Order } from '@/types';

type Period = 'today' | 'week' | 'month' | 'all';

const PERIODS: Period[] = ['today', 'week', 'month', 'all'];

export default function ReportsPage() {
  const { t } = useI18n();
  const {
    dashboard,
    dailyReport,
    salesByPeriod,
    loading,
    fetchDashboard,
    fetchDailyReport,
    fetchWeeklySales,
    fetchSalesByPeriod,
    closeDay,
  } = useStatsStore();
  const { settings } = useSettingsStore();

  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [closing, setClosing] = useState(false);
  const [activePeriod, setActivePeriod] = useState<Period>('today');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchDailyReport(selectedDate);
    fetchWeeklySales();
  }, [fetchDashboard, fetchDailyReport, fetchWeeklySales, selectedDate]);

  useEffect(() => {
    fetchSalesByPeriod(activePeriod);
  }, [fetchSalesByPeriod, activePeriod]);

  const handleCloseDay = async () => {
    if (!confirm(t('reports.closeDay'))) return;
    setClosing(true);
    try {
      await closeDay();
      toast.success(t('reports.dayClosed'));
      fetchDashboard();
      fetchDailyReport(selectedDate);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setClosing(false);
    }
  };

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const orders = await api.get<Order[]>('/orders?status=paid');
      await exportSalesToExcel(orders, settings);
      toast.success(t('reports.exportExcel'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setExporting(false);
    }
  }, [settings, t]);

  const periodLabels: Record<Period, string> = {
    today: t('common.today'),
    week: t('common.thisWeek'),
    month: t('common.thisMonth'),
    all: t('common.all'),
  };

  const getPeriodOrders = (): number => {
    if (!dashboard) return 0;
    switch (activePeriod) {
      case 'today': return dashboard.today.orders;
      case 'week': return dashboard.week.orders;
      case 'month': return dashboard.month.orders;
      default: return dashboard.month.orders;
    }
  };

  const getPeriodSales = (): number => {
    if (!dashboard) return 0;
    switch (activePeriod) {
      case 'today': return dashboard.today.sales;
      case 'week': return dashboard.week.sales;
      case 'month': return dashboard.month.sales;
      default: return dashboard.month.sales;
    }
  };

  const avgOrderValue = getPeriodOrders() > 0 ? getPeriodSales() / getPeriodOrders() : 0;

  const summaryCards = [
    {
      label: t('common.today') + ' - ' + t('reports.totalSales'),
      value: dashboard ? formatCurrency(dashboard.today.sales, settings.currency) : '—',
      icon: Banknote,
      color: 'text-luxury-gold',
      bg: 'bg-luxury-gold/10',
    },
    {
      label: t('common.thisWeek') + ' - ' + t('reports.totalSales'),
      value: dashboard ? formatCurrency(dashboard.week?.sales || 0, settings.currency) : '—',
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: t('common.thisMonth') + ' - ' + t('reports.totalSales'),
      value: dashboard ? formatCurrency(dashboard.month.sales, settings.currency) : '—',
      icon: BarChart3,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: t('reports.avgOrder'),
      value: formatCurrency(avgOrderValue, settings.currency),
      icon: ShoppingBag,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  const paymentMethods = [
    { key: 'cash', label: t('common.cash'), icon: BanknoteIcon, color: 'bg-emerald-500' },
    { key: 'card', label: t('common.card'), icon: CreditCard, color: 'bg-blue-500' },
    { key: 'transfer', label: t('common.transfer'), icon: ArrowRightLeft, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('reports.title')}</h1>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="bg-luxury-gold hover:bg-luxury-gold/90 text-white rounded-xl gap-2"
          >
            <Download className="w-4 h-4" />
            {exporting ? t('common.loading') : t('reports.exportExcel')}
          </Button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((stat, i) => (
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
        <CardHeader>
          <CardTitle className="text-gray-900">{t('reports.period')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((period) => (
              <motion.button
                key={period}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActivePeriod(period)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  activePeriod === period
                    ? 'bg-luxury-gold text-white shadow-sm'
                    : 'bg-white/60 border border-gray-200 text-gray-600 hover:bg-white/80',
                )}
              >
                {periodLabels[period]}
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          className="bg-white/70 backdrop-blur-md border-white/40 rounded-2xl"
          style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}
        >
          <CardHeader>
            <CardTitle className="text-gray-900">{t('reports.salesReport')}</CardTitle>
          </CardHeader>
          <CardContent>
            {salesByPeriod ? (
              <div className="space-y-4">
                {paymentMethods.map((pm) => {
                  const amount = pm.key === 'cash' ? salesByPeriod.cash
                    : pm.key === 'card' ? salesByPeriod.card
                    : salesByPeriod.transfer;
                  const percentage = salesByPeriod.total > 0 ? (amount / salesByPeriod.total) * 100 : 0;

                  return (
                    <div key={pm.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <pm.icon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">{pm.label}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(amount, settings.currency)}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={cn('h-full rounded-full', pm.color)}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{t('common.total')}</span>
                    <span className="text-lg font-bold text-luxury-gold">
                      {formatCurrency(salesByPeriod.total, settings.currency)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {salesByPeriod.count} {t('reports.totalOrders').toLowerCase()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">{t('reports.noData')}</p>
            )}
          </CardContent>
        </Card>

        <Card
          className="bg-white/70 backdrop-blur-md border-white/40 rounded-2xl"
          style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}
        >
          <CardHeader>
            <CardTitle className="text-gray-900">{t('reports.topItems')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[400px]">
              {dashboard?.topItems && dashboard.topItems.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.topItems.map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-white/40 hover:bg-white/70 transition-colors"
                    >
                      <span className="text-sm font-bold text-luxury-gold bg-luxury-gold/10 w-7 h-7 rounded-full flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {item.quantity} {t('reports.itemsSold').toLowerCase()}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-luxury-gold">
                        {item.orders}
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">{t('reports.noData')}</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card
        className="bg-white/70 backdrop-blur-md border-white/40 rounded-2xl"
        style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-gray-900">{t('reports.dailyReport')}</CardTitle>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white/60 border-gray-200 text-gray-900 text-sm py-1 px-2 w-auto rounded-xl"
            />
          </div>
        </CardHeader>
        <CardContent>
          {dailyReport ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/50 border border-white/40">
                  <p className="text-xs text-gray-500">{t('reports.totalSales')}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(dailyReport.totalSales, settings.currency)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/50 border border-white/40">
                  <p className="text-xs text-gray-500">{t('reports.totalOrders')}</p>
                  <p className="text-lg font-bold text-gray-900">{dailyReport.totalOrders}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/50 border border-white/40">
                  <p className="text-xs text-gray-500">{t('reports.cashTotal')}</p>
                  <p className="text-lg font-bold text-emerald-500">
                    {formatCurrency(dailyReport.cashTotal, settings.currency)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/50 border border-white/40">
                  <p className="text-xs text-gray-500">{t('reports.cardTotal')}</p>
                  <p className="text-lg font-bold text-blue-500">
                    {formatCurrency(dailyReport.cardTotal, settings.currency)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/50 border border-white/40">
                  <p className="text-xs text-gray-500">{t('reports.discountTotal')}</p>
                  <p className="text-lg font-bold text-red-500">
                    -{formatCurrency(dailyReport.discountTotal, settings.currency)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/50 border border-white/40">
                  <p className="text-xs text-gray-500">{t('reports.cancelledOrders')}</p>
                  <p className="text-lg font-bold text-gray-900">{dailyReport.cancelledOrders}</p>
                </div>
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-xs text-red-600">{t('reports.totalExpenses')}</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(dailyReport.totalExpenses || 0, settings.currency)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-xs text-emerald-600">{t('reports.profit')}</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {formatCurrency(dailyReport.profit || 0, settings.currency)}
                  </p>
                </div>
              </div>

              {dailyReport.cancelledOrders > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-red-50 border border-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-red-500">
                    {dailyReport.cancelledOrders} {t('reports.cancelledOrders').toLowerCase()}
                  </span>
                </div>
              )}

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  onClick={handleCloseDay}
                  disabled={closing}
                  className="w-full bg-luxury-gold hover:bg-luxury-gold/90 text-white rounded-xl"
                >
                  {closing ? t('common.loading') : t('reports.closeDay')}
                </Button>
              </motion.div>
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">{t('reports.noData')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
