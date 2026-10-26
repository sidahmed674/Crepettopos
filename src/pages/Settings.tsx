import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, Upload, Download, Image as ImageIcon, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '@/i18n';
import { cn } from '@/utils/cn';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { settings, updateSettings, loading } = useSettingsStore();
  const [form, setForm] = useState({ ...settings });
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 200, 200);
          const base64 = canvas.toDataURL('image/jpeg', 0.7);
          setForm((p) => ({ ...p, logo: base64 }));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(form);
      toast.success(t('settings.saved'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      const token = localStorage.getItem('crepettoo_token');
      const res = await fetch('/api/settings/backup', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crepettoo-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleRestore = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (!confirm(t('settings.restoreWarning'))) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const token = localStorage.getItem('crepettoo_token');
        await fetch('/api/settings/restore', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });
        toast.success(t('common.success'));
        window.location.reload();
      } catch {
        toast.error(t('common.error'));
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>

      {/* Store Info */}
      <Card
        className="bg-white/70 backdrop-blur-md border-white/40 rounded-2xl"
        style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}
      >
        <CardHeader>
          <CardTitle className="text-gray-900">{t('settings.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-700">{t('settings.storeName')}</Label>
              <Input
                value={form.storeName}
                onChange={(e) => setForm((p) => ({ ...p, storeName: e.target.value }))}
                className="bg-white/60 border-gray-200 text-gray-900 rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-700">{t('settings.storeNameAr')}</Label>
              <Input
                value={form.storeNameAr}
                onChange={(e) => setForm((p) => ({ ...p, storeNameAr: e.target.value }))}
                className="bg-white/60 border-gray-200 text-gray-900 rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-700">{t('settings.storeAddress')}</Label>
              <Input
                value={form.storeAddress || ''}
                onChange={(e) => setForm((p) => ({ ...p, storeAddress: e.target.value }))}
                className="bg-white/60 border-gray-200 text-gray-900 rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-700">{t('settings.storePhone')}</Label>
              <Input
                value={form.storePhone || ''}
                onChange={(e) => setForm((p) => ({ ...p, storePhone: e.target.value }))}
                className="bg-white/60 border-gray-200 text-gray-900 rounded-xl mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-gray-700">{t('settings.nif')}</Label>
              <Input
                value={form.nif || ''}
                onChange={(e) => setForm((p) => ({ ...p, nif: e.target.value }))}
                placeholder="NIF"
                className="bg-white/60 border-gray-200 text-gray-900 rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-700">{t('settings.nis')}</Label>
              <Input
                value={form.nis || ''}
                onChange={(e) => setForm((p) => ({ ...p, nis: e.target.value }))}
                placeholder="NIS"
                className="bg-white/60 border-gray-200 text-gray-900 rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-700">{t('settings.rc')}</Label>
              <Input
                value={form.rc || ''}
                onChange={(e) => setForm((p) => ({ ...p, rc: e.target.value }))}
                placeholder="RC"
                className="bg-white/60 border-gray-200 text-gray-900 rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-700">{t('settings.nfl')}</Label>
              <Input
                value={form.nfl || ''}
                onChange={(e) => setForm((p) => ({ ...p, nfl: e.target.value }))}
                placeholder="NFL"
                className="bg-white/60 border-gray-200 text-gray-900 rounded-xl mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo */}
      <Card
        className="bg-white/70 backdrop-blur-md border-white/40 rounded-2xl"
        style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}
      >
        <CardHeader>
          <CardTitle className="text-gray-900">{t('settings.logo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.logo && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">{t('settings.logoPreview')}</p>
              <img
                src={form.logo}
                alt={t('settings.logoPreview')}
                className="max-w-[120px] rounded-xl"
              />
            </div>
          )}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed border-gray-300 hover:border-luxury-gold transition-colors',
              'rounded-xl p-6 text-center cursor-pointer hover:bg-luxury-gold/5'
            )}
          >
            <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">{t('settings.logoUpload')}</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
          {form.logo && (
            <Button
              variant="outline"
              onClick={() => setForm((p) => ({ ...p, logo: undefined }))}
              className="rounded-xl border-red-300 text-red-500 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('settings.logoRemove')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Currency */}
      <Card
        className="bg-white/70 backdrop-blur-md border-white/40 rounded-2xl"
        style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}
      >
        <CardHeader>
          <CardTitle className="text-gray-900">{t('settings.currency')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-700">{t('settings.currency')}</Label>
            <Input
              value={form.currency}
              onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
              className="bg-white/60 border-gray-200 text-gray-900 rounded-xl mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Receipt */}
      <Card
        className="bg-white/70 backdrop-blur-md border-white/40 rounded-2xl"
        style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}
      >
        <CardHeader>
          <CardTitle className="text-gray-900">{t('settings.receiptFooter')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-700">{t('settings.receiptFooter')}</Label>
              <textarea
                value={form.receiptFooter}
                onChange={(e) => setForm((p) => ({ ...p, receiptFooter: e.target.value }))}
                className="w-full bg-white/60 border border-gray-200 text-gray-900 rounded-xl px-3 py-2 mt-1 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-luxury-gold/20"
              />
            </div>
            <div>
              <Label className="text-gray-700">{t('settings.receiptFooterAr')}</Label>
              <textarea
                value={form.receiptFooterAr}
                onChange={(e) => setForm((p) => ({ ...p, receiptFooterAr: e.target.value }))}
                className="w-full bg-white/60 border border-gray-200 text-gray-900 rounded-xl px-3 py-2 mt-1 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-luxury-gold/20"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-700">{t('settings.paperSize')}</Label>
              <select
                value={form.paperSize || '80mm'}
                onChange={(e) => setForm((p) => ({ ...p, paperSize: e.target.value as '80mm' | '58mm' }))}
                className="w-full bg-white/60 border border-gray-200 text-gray-900 rounded-xl px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold/20"
              >
                <option value="80mm">{t('settings.paper80')}</option>
                <option value="58mm">{t('settings.paper58')}</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.autoPrint || false}
                  onChange={(e) => setForm((p) => ({ ...p, autoPrint: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 accent-luxury-gold"
                />
                <span className="text-sm text-gray-700">{t('settings.autoPrint')}</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card
        className="bg-white/70 backdrop-blur-md border-white/40 rounded-2xl"
        style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}
      >
        <CardHeader>
          <CardTitle className="text-gray-900">{t('settings.language')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            {(['ar', 'fr', 'en'] as const).map((l) => (
              <motion.button
                key={l}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLang(l)}
                className={cn(
                  'px-6 py-2 rounded-xl text-sm font-medium transition-colors',
                  lang === l
                    ? 'bg-luxury-gold text-white'
                    : 'bg-white/50 text-gray-600 border border-gray-200 hover:bg-white/70 hover:text-gray-900'
                )}
              >
                {l.toUpperCase()}
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Backup */}
      <Card
        className="bg-white/70 backdrop-blur-md border-white/40 rounded-2xl"
        style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}
      >
        <CardHeader>
          <CardTitle className="text-gray-900">{t('settings.backup')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500">{t('settings.backupDesc')}</p>
          <div className="flex gap-3 flex-wrap">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleBackup}
                variant="outline"
                className="border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold/10 rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                {t('settings.backupExport')}
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleRestore}
                variant="outline"
                className="border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold/10 rounded-xl"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t('settings.backupRestore')}
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-luxury-gold hover:bg-luxury-gold/90 text-white rounded-xl"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? t('common.loading') : t('common.save')}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
