import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Receipt, TrendingUp, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useI18n } from '@/i18n';
import { cn } from '@/utils/cn';
import { useExpenseStore } from '@/stores/useExpenseStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { formatCurrency } from '@/utils/helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Expense } from '@/types';

export default function IngredientsPage() {
  const { t } = useI18n();
  const { settings } = useSettingsStore();
  const { expenses, loading, fetchExpenses, addExpense, updateExpense, deleteExpense } = useExpenseStore();

  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Expense> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Expense | null>(null);

  useEffect(() => {
    fetchExpenses(selectedDate);
  }, [fetchExpenses, selectedDate]);

  const dayExpenses = useMemo(() => {
    return expenses.filter((e) => e.date === selectedDate);
  }, [expenses, selectedDate]);

  const dayTotal = useMemo(() => {
    return dayExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [dayExpenses]);

  const handleSave = async () => {
    if (!editing?.description?.trim()) {
      toast.error(t('common.error'));
      return;
    }
    try {
      if (editing.id) {
        await updateExpense(editing.id, {
          description: editing.description,
          amount: editing.amount,
          notes: editing.notes,
        });
      } else {
        await addExpense({
          description: editing.description,
          amount: editing.amount || 0,
          notes: editing.notes,
          date: selectedDate,
        });
      }
      setDialogOpen(false);
      setEditing(null);
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteExpense(deleteConfirm.id);
      setDeleteConfirm(null);
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('expenses.title')}</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white/60 border-gray-200 text-gray-900 text-sm py-1 px-2 w-auto rounded-xl"
            />
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => {
                setEditing({ description: '', amount: 0, notes: '' });
                setDialogOpen(true);
              }}
              className="bg-luxury-gold hover:bg-luxury-gold/90 text-white rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('expenses.add')}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="bg-white/70 backdrop-blur-md border-white/40 rounded-2xl" style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-500/10">
                  <ShoppingCart className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('expenses.totalExpenses')}</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(dayTotal, settings.currency)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="bg-white/70 backdrop-blur-md border-white/40 rounded-2xl" style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-luxury-gold/10">
                  <Receipt className="w-5 h-5 text-luxury-gold" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('expenses.entries')}</p>
                  <p className="text-xl font-bold text-gray-900">{dayExpenses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-white/70 backdrop-blur-md border-white/40 rounded-2xl" style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('expenses.avgPerEntry')}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {dayExpenses.length > 0 ? formatCurrency(dayTotal / dayExpenses.length, settings.currency) : formatCurrency(0, settings.currency)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Expenses List */}
      <Card className="bg-white/70 backdrop-blur-md border-white/40 rounded-2xl" style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}>
        <CardHeader>
          <CardTitle className="text-gray-900">
            {t('expenses.list')} — {format(new Date(selectedDate + 'T00:00:00'), 'dd/MM/yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            {loading ? (
              <p className="text-center py-12 text-gray-500">{t('common.loading')}</p>
            ) : dayExpenses.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('expenses.noExpenses')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('expenses.noExpensesHint')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {dayExpenses.map((expense, i) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/50 border border-white/40 hover:bg-white/70 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-red-500/10 shrink-0">
                          <ShoppingCart className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{expense.description}</p>
                          {expense.notes && (
                            <p className="text-xs text-gray-500 truncate">{expense.notes}</p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {expense.createdBy} — {format(new Date(expense.createdAt), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant="destructive" className="text-xs">
                          {formatCurrency(expense.amount, settings.currency)}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-luxury-gold hover:bg-luxury-gold/10"
                            onClick={() => {
                              setEditing({ ...expense });
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50"
                            onClick={() => setDeleteConfirm(expense)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Total Row */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-luxury-gold/10 border border-luxury-gold/20 mt-2">
                  <span className="text-sm font-semibold text-gray-900">{t('common.total')}</span>
                  <span className="text-lg font-bold text-luxury-gold">{formatCurrency(dayTotal, settings.currency)}</span>
                </div>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white/90 backdrop-blur-md border-white/40 rounded-2xl" style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}>
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {editing?.id ? t('expenses.edit') : t('expenses.add')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-gray-700">{t('expenses.description')}</Label>
              <Input
                value={editing?.description || ''}
                onChange={(e) => setEditing((p) => ({ ...p!, description: e.target.value }))}
                placeholder={t('expenses.descriptionPlaceholder')}
                className="bg-white/60 border-gray-200 text-gray-900 rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-700">{t('expenses.amount')}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editing?.amount || ''}
                onChange={(e) => setEditing((p) => ({ ...p!, amount: Number(e.target.value) }))}
                className="bg-white/60 border-gray-200 text-gray-900 rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-700">{t('expenses.notes')}</Label>
              <textarea
                value={editing?.notes || ''}
                onChange={(e) => setEditing((p) => ({ ...p!, notes: e.target.value }))}
                placeholder={t('expenses.notesPlaceholder')}
                className="w-full bg-white/60 border border-gray-200 text-gray-900 rounded-xl px-3 py-2 mt-1 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-luxury-gold/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} className="bg-luxury-gold hover:bg-luxury-gold/90 text-white rounded-xl">
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-white/90 backdrop-blur-md border-white/40 rounded-2xl" style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}>
          <DialogHeader>
            <DialogTitle className="text-gray-900">{t('common.confirm')}</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700 py-4">
            {t('expenses.confirmDelete', { description: deleteConfirm?.description || '' })}
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)} className="rounded-xl">
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-xl">
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
