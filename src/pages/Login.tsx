import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, LogIn, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/useAuthStore';
import { useI18n } from '@/i18n';

export default function LoginPage() {
  const { t, isRTL } = useI18n();
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error(t('auth.invalidCredentials'));
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err: any) {
      toast.error(err?.message || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 p-8"
          style={{ boxShadow: '0 12px 48px rgba(212, 175, 55, 0.12)' }}>

          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-luxury-gold to-luxury-chocolate mb-4"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {t('app.name', 'Crepettoo')}
            </h1>
            <p className="text-sm text-luxury-slate mt-1">{t('auth.welcome')}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t('auth.username')}</label>
              <div className="relative">
                <div className={`absolute top-1/2 -translate-y-1/2 text-luxury-slate ${isRTL ? 'right-3' : 'left-3'}`}>
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder={t('auth.username')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`flex h-10 w-full rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold focus-visible:ring-offset-2 transition-all duration-200 ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'}`}
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t('auth.password')}</label>
              <div className="relative">
                <div className={`absolute top-1/2 -translate-y-1/2 text-luxury-slate ${isRTL ? 'right-3' : 'left-3'}`}>
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  placeholder={t('auth.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`flex h-10 w-full rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold focus-visible:ring-offset-2 transition-all duration-200 ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'}`}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 h-12 w-full bg-luxury-gold text-white hover:bg-luxury-gold-dark shadow-sm gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  {t('auth.login')}
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
