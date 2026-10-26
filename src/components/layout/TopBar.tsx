import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LogOut, UserCircle, Clock, Languages } from 'lucide-react';
import { format, type Locale } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';
import { cn } from '@/utils/cn';
import { useI18n, type Lang } from '@/i18n';

export type PageView =
  | 'pos'
  | 'menu'
  | 'tables'
  | 'sales'
  | 'reports'
  | 'users'
  | 'settings'
  | 'ingredients';

const LOCALE_MAP: Record<string, Locale> = { ar, fr, en: enUS };

const LANGUAGES = [
  { code: 'ar', label: 'AR' },
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
] as const;

const PAGE_TITLE_KEYS: Record<PageView, string> = {
  pos: 'nav.pos',
  menu: 'nav.menu',
  tables: 'nav.tables',
  sales: 'nav.sales',
  reports: 'nav.reports',
  users: 'nav.users',
  settings: 'nav.settings',
  ingredients: 'nav.ingredients',
};

interface TopBarProps {
  currentPage: PageView;
  userName?: string;
  role: string;
  onLogout: () => void;
  onNavigate: (page: PageView) => void;
}

export default function TopBar({
  currentPage,
  userName,
  role,
  onLogout,
}: TopBarProps) {
  const { t, lang, setLang, isRTL } = useI18n();
  const isRtl = isRTL;
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const formattedTime = format(currentTime, 'EEEE dd MMMM yyyy — HH:mm', {
    locale: LOCALE_MAP[lang] ?? enUS,
  });

  const handleLangChange = useCallback(
    (code: string) => setLang(code as Lang),
    [setLang],
  );

  return (
    <header className="h-16 border-b border-white/40 bg-white/60 backdrop-blur-md flex items-center justify-between gap-3 px-4 sm:px-6 sticky top-0 z-30">
      {/* Left: Page title */}
      <div className="flex items-center min-w-0">
        <h1 className="text-lg font-bold tracking-tight text-gray-900 truncate">
          {t(PAGE_TITLE_KEYS[currentPage], currentPage)}
        </h1>
      </div>

      {/* Center: Clock */}
      <div className="hidden md:flex items-center gap-2 text-sm text-luxury-slate">
        <Clock className="w-4 h-4" />
        <span className="whitespace-nowrap">{formattedTime}</span>
      </div>

      {/* Right cluster */}
      <div className={cn('flex items-center gap-3', isRtl && 'flex-row-reverse')}>
        {/* Language switcher */}
        <div className="flex items-center gap-1 bg-luxury-cream/60 rounded-xl px-1 py-0.5">
          <Languages className="w-3.5 h-3.5 text-luxury-slate ms-1" />
          {LANGUAGES.map((l) => (
            <motion.button
              key={l.code}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleLangChange(l.code)}
              className={cn(
                'px-2 py-0.5 text-xs font-medium rounded-lg transition-colors',
                lang === l.code
                  ? 'bg-luxury-gold text-white shadow-sm'
                  : 'text-luxury-slate hover:bg-white/60',
              )}
            >
              {l.label}
            </motion.button>
          ))}
        </div>

        {/* User pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-luxury-cream/60">
          <UserCircle className="w-5 h-5 text-luxury-gold" />
          {userName && (
            <span className="hidden sm:inline text-sm font-medium text-gray-700">
              {userName}
            </span>
          )}
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-luxury-gold/10 text-luxury-gold-dark border border-luxury-gold/20">
            {t(`role.${role}`, role)}
          </span>
        </div>

        {/* Logout */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onLogout}
          className="p-2 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          aria-label={t('auth.logout', 'Logout')}
        >
          <LogOut className="w-5 h-5" />
        </motion.button>
      </div>
    </header>
  );
}
