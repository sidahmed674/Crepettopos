import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Shield, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '@/i18n';
import { cn } from '@/utils/cn';
import { api } from '@/utils/helpers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { User, Role } from '@/types';

const ROLE_BADGE: Record<Role, 'destructive' | 'warning' | 'success'> = {
  admin: 'destructive',
  manager: 'warning',
  cashier: 'success',
};

export default function UsersPage() {
  const { t } = useI18n();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> & { password?: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get<User[]>('/auth/users');
      setUsers(Array.isArray(res) ? res : []);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSave = async () => {
    if (!editingUser?.username?.trim() || !editingUser?.name?.trim()) {
      toast.error(t('common.error'));
      return;
    }
    if (!editingUser.id && !editingUser.password?.trim()) {
      toast.error(t('common.error'));
      return;
    }
    try {
      if (editingUser.id) {
        const { password, ...data } = editingUser;
        await api.put(`/auth/users/${editingUser.id}`, data);
      } else {
        await api.post('/auth/users', editingUser);
      }
      setDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/auth/users/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      fetchUsers();
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.users')}</h1>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => {
              setEditingUser({ username: '', name: '', role: 'cashier' });
              setDialogOpen(true);
            }}
            className="bg-luxury-gold hover:bg-luxury-gold/90 text-white rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('common.add')} {t('nav.users')}
          </Button>
        </motion.div>
      </div>

      <Card className="bg-white/70 backdrop-blur-md border-white/40 rounded-2xl" style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}>
        <CardHeader>
          <CardTitle className="text-gray-900">{t('nav.users')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-4 text-gray-500 font-medium">{t('common.name')}</th>
                  <th className="text-left p-4 text-gray-500 font-medium">{t('auth.username')}</th>
                  <th className="text-left p-4 text-gray-500 font-medium">{t('common.status')}</th>
                  <th className="text-right p-4 text-gray-500 font-medium">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {users.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="border-b border-gray-100 hover:bg-white/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-luxury-gold/10 flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-luxury-gold" />
                          </div>
                          <span className="font-medium text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-700">{user.username}</td>
                      <td className="p-4">
                        <Badge variant={ROLE_BADGE[user.role]}>
                          <Shield className="w-3 h-3 mr-1" />
                          {t(`role.${user.role}`, user.role)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-luxury-gold hover:bg-luxury-gold/10"
                            onClick={() => {
                              setEditingUser({ ...user, password: '' });
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50"
                            onClick={() => setDeleteConfirm(user)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            </div>
            {users.length === 0 && !loading && (
              <p className="text-center py-12 text-gray-500">{t('common.noData')}</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white/90 backdrop-blur-md border-white/40 rounded-2xl" style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}>
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {editingUser?.id ? t('common.edit') : t('common.add')} {t('nav.users')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-gray-700">{t('common.name')}</Label>
              <Input
                value={editingUser?.name || ''}
                onChange={(e) => setEditingUser((p) => ({ ...p!, name: e.target.value }))}
                className="bg-white/60 border-gray-200 text-gray-900 rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-700">{t('auth.username')}</Label>
              <Input
                value={editingUser?.username || ''}
                onChange={(e) => setEditingUser((p) => ({ ...p!, username: e.target.value }))}
                className="bg-white/60 border-gray-200 text-gray-900 rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-700">{t('common.status')} (Role)</Label>
              <select
                value={editingUser?.role || 'cashier'}
                onChange={(e) => setEditingUser((p) => ({ ...p!, role: e.target.value as Role }))}
                className="w-full bg-white/60 border border-gray-200 text-gray-900 rounded-xl px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold/20"
              >
                <option value="admin">{t('role.admin', 'Admin')}</option>
                <option value="manager">{t('role.manager', 'Manager')}</option>
                <option value="cashier">{t('role.cashier', 'Cashier')}</option>
              </select>
            </div>
            <div>
              <Label className="text-gray-700">
                {editingUser?.id ? 'New Password (leave blank to keep)' : t('auth.password')}
              </Label>
              <Input
                type="password"
                value={editingUser?.password || ''}
                onChange={(e) => setEditingUser((p) => ({ ...p!, password: e.target.value }))}
                className="bg-white/60 border-gray-200 text-gray-900 rounded-xl mt-1"
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

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-white/90 backdrop-blur-md border-white/40 rounded-2xl" style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}>
          <DialogHeader>
            <DialogTitle className="text-gray-900">{t('common.confirm')}</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700 py-4">
            {t('menu.confirmDelete', { name: deleteConfirm?.name || '' })}
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
