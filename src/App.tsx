import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { I18nProvider, useI18n } from '@/i18n';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMenuStore } from '@/stores/useMenuStore';
import { useTableStore } from '@/stores/useTableStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import ErrorBoundary from '@/components/ErrorBoundary';
import Sidebar, { type PageView } from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { cn } from '@/utils/cn';

const LoginPage = lazy(() => import('@/pages/Login'));

const pageAccess: Record<PageView, string[]> = {
  pos: ['admin', 'manager', 'cashier'],
  menu: ['admin', 'manager'],
  tables: ['admin', 'manager', 'cashier'],
  sales: ['admin', 'manager', 'cashier'],
  ingredients: ['admin', 'manager'],
  reports: ['admin', 'manager'],
  users: ['admin'],
  settings: ['admin'],
};

const pageComponents: Record<PageView, React.LazyExoticComponent<React.ComponentType>> = {
  pos: lazy(() => import('@/pages/POS')),
  menu: lazy(() => import('@/pages/Menu')),
  tables: lazy(() => import('@/pages/Tables')),
  sales: lazy(() => import('@/pages/Sales')),
  reports: lazy(() => import('@/pages/Reports')),
  users: lazy(() => import('@/pages/Users')),
  settings: lazy(() => import('@/pages/Settings')),
  ingredients: lazy(() => import('@/pages/Ingredients')),
};

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-luxury-gold to-luxury-chocolate"
        />
        <div className="w-8 h-8 border-2 border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin" />
      </div>
    </div>
  );
}

const toasterOptions = {
  duration: 3000,
  position: 'top-center' as const,
  style: {
    background: '#FAF6EE',
    color: '#374151',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: '"Noto Kufi Arabic", "Inter", sans-serif',
  },
  success: {
    iconTheme: { primary: '#D4AF37', secondary: '#FAF6EE' as string },
  },
  error: {
    iconTheme: { primary: '#EF4444', secondary: '#FAF6EE' as string },
  },
};

function ChangePasswordForm() {
  const { changePassword } = useAuthStore();
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.passwordsNoMatch'));
      return;
    }
    setLoading(true);
    try {
      await changePassword(password);
    } catch {
      setError(t('auth.passwordFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-luxury-bg p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 p-8"
        style={{ boxShadow: '0 12px 48px rgba(212, 175, 55, 0.12)' }}
      >
        <h2 className="text-xl font-bold text-center mb-6 text-luxury-gold">
          {t('auth.changePassword')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder={t('auth.newPassword')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold focus-visible:ring-offset-2 transition-all duration-200"
          />
          <input
            type="password"
            placeholder={t('auth.confirmPassword')}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold focus-visible:ring-offset-2 transition-all duration-200"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 h-12 px-6 w-full bg-luxury-gold text-white hover:bg-luxury-gold-dark shadow-sm"
          >
            {loading ? t('auth.updating') : t('auth.updatePassword')}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const { user, initialized, init, logout } = useAuthStore();
  const fetchMenu = useMenuStore((s) => s.fetchAll);
  const fetchTables = useTableStore((s) => s.fetchTables);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const { isRTL } = useI18n();

  const [currentPage, setCurrentPage] = useState<PageView>('pos');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('crepettoo:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('crepettoo:unauthorized', handleUnauthorized);
  }, [logout]);

  useEffect(() => {
    if (user && !user.mustChangePassword) {
      fetchMenu();
      fetchTables();
      fetchSettings();
    }
  }, [user, fetchMenu, fetchTables, fetchSettings]);

  const handleNavigate = useCallback((page: PageView) => setCurrentPage(page), []);
  const handleLogout = useCallback(() => { logout(); setCurrentPage('pos'); }, [logout]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-luxury-bg">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-luxury-gold to-luxury-chocolate"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LoginPage />
      </Suspense>
    );
  }

  if (user.mustChangePassword) {
    return <ChangePasswordForm />;
  }

  const allowedPages = pageAccess[currentPage] || [];
  const effectivePage = allowedPages.includes(user.role) ? currentPage : 'pos';
  const PageComponent = pageComponents[effectivePage];
  const sidebarWidth = sidebarCollapsed ? 80 : 256;

  return (
    <div className="h-screen bg-luxury-bg flex overflow-hidden">
      <Sidebar
        currentPage={effectivePage}
        role={user.role}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div
        className={cn(
          'flex-1 flex flex-col h-screen min-w-0 transition-all duration-300',
          isRTL ? 'mr-0' : 'ml-0',
        )}
        style={{ [isRTL ? 'marginRight' : 'marginLeft']: sidebarWidth }}
      >
        <TopBar
          currentPage={effectivePage}
          userName={user.name}
          role={user.role}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />

        <main className="flex-1 min-h-0 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={effectivePage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ErrorBoundary key={effectivePage}>
                <Suspense fallback={<LoadingFallback />}>
                  <PageComponent />
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
      <Toaster {...toasterOptions} />
    </I18nProvider>
  );
}
