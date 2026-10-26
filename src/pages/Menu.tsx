import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ImagePlus,
  ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '@/i18n';
import { useMenuStore } from '@/stores/useMenuStore';
import { formatCurrency, api } from '@/utils/helpers';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { MenuCategory, MenuItem } from '@/types';

const emptyCategory: Partial<MenuCategory> = {
  name: '',
  nameAr: '',
  nameFr: '',
  sortOrder: 0,
  active: true,
};

const emptyItem: Partial<MenuItem> = {
  name: '',
  nameAr: '',
  nameFr: '',
  description: '',
  descriptionAr: '',
  descriptionFr: '',
  price: 0,
  costPrice: 0,
  categoryId: '',
  available: true,
  prepTimeMin: 10,
  tags: '',
};

export default function MenuPage() {
  const { t } = useI18n();
  const {
    categories,
    items,
    addCategory,
    updateCategory,
    deleteCategory,
    addItem,
    updateItem,
    deleteItem,
    toggleAvailability,
  } = useMenuStore();
  const { settings } = useSettingsStore();

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<Partial<MenuCategory> | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'category' | 'item';
    id: string;
    name: string;
  } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error(t('menu.imageTooLarge', 'الصورة كبيرة جداً (الحد الأقصى 8 ميغابايت)'));
      return;
    }
    setUploadingImage(true);
    try {
      const buf = await file.arrayBuffer();
      const res = await api.upload<{ url: string }>('/menu/images', buf, file.type || 'image/jpeg');
      setEditingItem((p) => (p ? { ...p, image: res.url } : p));
      toast.success(t('common.success'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setUploadingImage(false);
    }
  };

  const getItemName = (item: MenuItem) => {
    const lang = localStorage.getItem('crepettoo_lang') || 'ar';
    if (lang === 'fr') return item.nameFr || item.name;
    if (lang === 'en') return item.name;
    return item.nameAr || item.name;
  };

  const getCategoryName = (cat: MenuCategory) => {
    const lang = localStorage.getItem('crepettoo_lang') || 'ar';
    if (lang === 'fr') return cat.nameFr || cat.name;
    if (lang === 'en') return cat.name;
    return cat.nameAr || cat.name;
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    if (!editingCategory.nameAr?.trim()) {
      toast.error(t('common.error'));
      return;
    }
    try {
      if (editingCategory.id) {
        await updateCategory(editingCategory.id, editingCategory);
      } else {
        await addCategory(editingCategory);
      }
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;
    if (!editingItem.nameAr?.trim() || !editingItem.categoryId) {
      toast.error(t('common.error'));
      return;
    }
    try {
      if (editingItem.id) {
        await updateItem(editingItem.id, editingItem);
      } else {
        await addItem(editingItem);
      }
      setItemDialogOpen(false);
      setEditingItem(null);
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'category') {
        await deleteCategory(deleteConfirm.id);
      } else {
        const res = await deleteItem(deleteConfirm.id);
        toast.success(res?.deactivated ? t('menu.itemDeactivated') : t('common.success'));
        setDeleteConfirm(null);
        return;
      }
      setDeleteConfirm(null);
      toast.success(t('common.success'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      toast.error(msg || t('common.error'));
    }
  };

  const glassCardStyle = {
    boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('menu.title') || 'Menu Management'}
        </h1>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => {
              setEditingCategory({ ...emptyCategory });
              setCategoryDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('menu.addCategory')}
          </Button>
        </motion.div>
      </div>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">{t('menu.categories')}</TabsTrigger>
          <TabsTrigger value="items">{t('menu.items')}</TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {categories
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((cat) => (
                  <motion.div
                    key={cat.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    whileHover={{ scale: 1.005 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className="border border-white/40 bg-white/70 backdrop-blur-md"
                      style={glassCardStyle}
                    >
                      <CardContent className="flex items-center gap-4 p-4">
                        <GripVertical className="w-4 h-4 text-gray-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">
                            {getCategoryName(cat)}
                          </p>
                          <p className="text-xs text-luxury-slate">
                            {t('menu.itemsCount', {
                              count: cat._count?.items || 0,
                            })}
                          </p>
                        </div>
                        <Badge variant={cat.active ? 'success' : 'destructive'}>
                          {cat.active
                            ? t('menu.available')
                            : t('menu.unavailable')}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setEditingCategory({ ...cat });
                              setCategoryDialogOpen(true);
                            }}
                            className="text-gray-500 hover:text-luxury-gold hover:bg-luxury-gold/10"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              setDeleteConfirm({
                                type: 'category',
                                id: cat.id,
                                name: getCategoryName(cat),
                              })
                            }
                            className="text-gray-500 hover:text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </AnimatePresence>
            {categories.length === 0 && (
              <p className="text-center py-12 text-luxury-slate">
                {t('menu.noCategories')}
              </p>
            )}
          </div>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items">
          <div className="space-y-4">
            <div className="flex justify-end">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => {
                    setEditingItem({ ...emptyItem });
                    setItemDialogOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('menu.addItem')}
                </Button>
              </motion.div>
            </div>

            <Card
              className="border border-white/40 bg-white/70 backdrop-blur-md overflow-hidden"
              style={glassCardStyle}
            >
              <ScrollArea className="w-full">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-4 text-luxury-slate font-medium">
                        {t('menu.itemName')}
                      </th>
                      <th className="text-left p-4 text-luxury-slate font-medium">
                        {t('menu.category')}
                      </th>
                      <th className="text-left p-4 text-luxury-slate font-medium">
                        {t('menu.price')}
                      </th>
                      <th className="text-left p-4 text-luxury-slate font-medium">
                        {t('common.status')}
                      </th>
                      <th className="text-right p-4 text-luxury-slate font-medium">
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <motion.tr
                        key={item.id}
                        className="border-b border-gray-100 hover:bg-luxury-gold/5 transition-colors"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt=""
                                className="w-10 h-10 shrink-0 rounded-lg object-cover border border-luxury-gold/20"
                              />
                            ) : (
                              <div className="w-10 h-10 shrink-0 rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-gray-300" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-gray-900 font-medium truncate">
                                {getItemName(item)}
                              </p>
                              {item.nameFr && (
                                <p className="text-xs text-luxury-slate truncate">
                                  {item.nameFr}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-gray-700">
                          {item.category
                            ? getCategoryName(item.category)
                            : '—'}
                        </td>
                        <td className="p-4 text-luxury-gold font-medium">
                          {formatCurrency(item.price, settings.currency)}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() =>
                              toggleAvailability(item.id, !item.available)
                            }
                            className="flex items-center gap-1.5"
                          >
                            <span
                              className={cn(
                                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
                                item.available
                                  ? 'bg-emerald-400'
                                  : 'bg-gray-300'
                              )}
                            >
                              <span
                                className={cn(
                                  'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200',
                                  item.available
                                    ? 'translate-x-6'
                                    : 'translate-x-1'
                                )}
                              />
                            </span>
                            <span
                              className={cn(
                                'text-xs font-medium',
                                item.available
                                  ? 'text-emerald-600'
                                  : 'text-luxury-slate'
                              )}
                            >
                              {item.available
                                ? t('menu.available')
                                : t('menu.unavailable')}
                            </span>
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setEditingItem({ ...item });
                                setItemDialogOpen(true);
                              }}
                              className="text-gray-500 hover:text-luxury-gold hover:bg-luxury-gold/10"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                setDeleteConfirm({
                                  type: 'item',
                                  id: item.id,
                                  name: getItemName(item),
                                })
                              }
                              className="text-gray-500 hover:text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-12 text-center text-luxury-slate"
                        >
                          {t('menu.noItems')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory?.id
                ? t('menu.editCategory')
                : t('menu.addCategory')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder={t('menu.categoryNameAr')}
              value={editingCategory?.nameAr || ''}
              onChange={(e) =>
                setEditingCategory((p) => ({ ...p!, nameAr: e.target.value }))
              }
            />
            <Input
              placeholder={t('menu.categoryNameFr')}
              value={editingCategory?.nameFr || ''}
              onChange={(e) =>
                setEditingCategory((p) => ({ ...p!, nameFr: e.target.value }))
              }
            />
            <Input
              placeholder={t('menu.itemName')}
              value={editingCategory?.name || ''}
              onChange={(e) =>
                setEditingCategory((p) => ({ ...p!, name: e.target.value }))
              }
            />
            <Input
              type="number"
              placeholder={t('menu.sortOrder') || 'Sort Order'}
              value={editingCategory?.sortOrder || 0}
              onChange={(e) =>
                setEditingCategory((p) => ({
                  ...p!,
                  sortOrder: Number(e.target.value),
                }))
              }
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCategoryDialogOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveCategory}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem?.id ? t('menu.editItem') : t('menu.addItem')}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 py-4 pr-4">
              <Input
                placeholder={t('menu.itemNameAr')}
                value={editingItem?.nameAr || ''}
                onChange={(e) =>
                  setEditingItem((p) => ({ ...p!, nameAr: e.target.value }))
                }
              />
              <Input
                placeholder={t('menu.itemNameFr')}
                value={editingItem?.nameFr || ''}
                onChange={(e) =>
                  setEditingItem((p) => ({ ...p!, nameFr: e.target.value }))
                }
              />
              <Input
                placeholder={t('menu.itemName')}
                value={editingItem?.name || ''}
                onChange={(e) =>
                  setEditingItem((p) => ({ ...p!, name: e.target.value }))
                }
              />
              <textarea
                placeholder={t('menu.descriptionAr')}
                value={editingItem?.descriptionAr || ''}
                onChange={(e) =>
                  setEditingItem((p) => ({
                    ...p!,
                    descriptionAr: e.target.value,
                  }))
                }
                className={cn(
                  'flex min-h-[60px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm',
                  'ring-offset-white placeholder:text-gray-400',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold focus-visible:ring-offset-2',
                  'text-gray-900 transition-all duration-200'
                )}
              />
              <select
                value={editingItem?.categoryId || ''}
                onChange={(e) =>
                  setEditingItem((p) => ({
                    ...p!,
                    categoryId: e.target.value,
                  }))
                }
                className={cn(
                  'flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm',
                  'ring-offset-white text-gray-900',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold focus-visible:ring-offset-2',
                  'transition-all duration-200'
                )}
              >
                <option value="">{t('menu.category')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {getCategoryName(c)}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  step="0.01"
                  placeholder={t('menu.price')}
                  value={editingItem?.price || ''}
                  onChange={(e) =>
                    setEditingItem((p) => ({
                      ...p!,
                      price: Number(e.target.value),
                    }))
                  }
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder={t('menu.costPrice')}
                  value={editingItem?.costPrice || ''}
                  onChange={(e) =>
                    setEditingItem((p) => ({
                      ...p!,
                      costPrice: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <Input
                type="number"
                placeholder={t('menu.prepTime')}
                value={editingItem?.prepTimeMin || ''}
                onChange={(e) =>
                  setEditingItem((p) => ({
                    ...p!,
                    prepTimeMin: Number(e.target.value),
                  }))
                }
              />
              <Input
                placeholder={t('menu.tags')}
                value={editingItem?.tags || ''}
                onChange={(e) =>
                  setEditingItem((p) => ({ ...p!, tags: e.target.value }))
                }
              />
              {/* Product Image */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1.5">
                  {t('menu.image', 'صورة المنتج')}
                </p>
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-32 h-24 shrink-0 rounded-xl border overflow-hidden flex items-center justify-center bg-gradient-to-br from-luxury-cream to-luxury-champagne',
                      editingItem?.image ? 'border-luxury-gold/30' : 'border-dashed border-gray-300'
                    )}
                  >
                    {editingItem?.image ? (
                      <img
                        src={editingItem.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-luxury-gold/40" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2 min-w-0">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleImagePick}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      {uploadingImage ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-luxury-gold rounded-full animate-spin" />
                          {t('menu.uploading', 'جارٍ الرفع...')}
                        </>
                      ) : (
                        <>
                          <ImagePlus className="w-4 h-4" />
                          {t('menu.chooseImage', 'اختر صورة من الجهاز')}
                        </>
                      )}
                    </Button>
                    {editingItem?.image && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingItem((p) => ({ ...p!, image: '' }))}
                        className="gap-1 text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t('menu.removeImage', 'إزالة الصورة')}
                      </Button>
                    )}
                    <p className="text-[11px] text-luxury-slate leading-snug">
                      JPG / PNG / WebP · ≤ 8MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setItemDialogOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveItem}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.confirm')}</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700 py-4">
            {t('menu.confirmDelete', { name: deleteConfirm?.name || '' })}
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirm(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
