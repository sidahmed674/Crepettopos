import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  BookOpen,
  LayoutGrid,
  Apple,
  BarChart3,
  Users,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  Receipt,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useI18n } from '@/i18n';

export type PageView =
  | 'pos'
  | 'menu'
  | 'tables'
  | 'sales'
  | 'reports'
  | 'users'
  | 'settings'
  | 'ingredients';

interface NavItem {
  id: PageView;
  icon: React.ElementType;
  labelKey: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'pos', icon: ShoppingCart, labelKey: 'nav.pos' },
  { id: 'menu', icon: BookOpen, labelKey: 'nav.menu' },
  { id: 'tables', icon: LayoutGrid, labelKey: 'nav.tables' },
  { id: 'ingredients', icon: Apple, labelKey: 'nav.ingredients' },
  { id: 'sales', icon: Receipt, labelKey: 'nav.sales' },
  { id: 'reports', icon: BarChart3, labelKey: 'nav.reports' },
  { id: 'users', icon: Users, labelKey: 'nav.users', adminOnly: true },
  { id: 'settings', icon: Settings, labelKey: 'nav.settings', adminOnly: true },
];

interface SidebarProps {
  currentPage: PageView;
  role: string;
  onNavigate: (page: PageView) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  currentPage,
  role,
  onNavigate,
  collapsed,
  onToggle,
}: SidebarProps) {
  const { t, isRTL } = useI18n();
  const isRtl = isRTL;

  const visibleItems = useMemo(() => {
    if (role === 'admin') return NAV_ITEMS;
    if (role === 'manager') return NAV_ITEMS.filter((item) => !item.adminOnly);
    return NAV_ITEMS.filter(
      (item) => item.id === 'pos' || item.id === 'tables' || item.id === 'sales',
    );
  }, [role]);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'fixed top-0 bottom-0 z-40 flex flex-col',
        'bg-white/80 backdrop-blur-xl border-white/40',
        isRtl ? 'right-0 border-l' : 'left-0 border-r',
      )}
      style={{ boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)' }}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-gray-100', collapsed && 'justify-center px-0')}>
        <AnimatePresence mode="wait">
          {collapsed ? (
            <motion.div
              key="icon"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center justify-center"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-luxury-gold to-luxury-chocolate flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="text"
              initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-luxury-gold to-luxury-chocolate flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-sm text-gray-900">
                  {t('app.name', 'Crepettoo')}
                </span>
                <p className="text-[10px] text-luxury-slate">POS System</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col gap-1 px-3">
          {visibleItems.map((item) => {
            const isActive = currentPage === item.id;
            const Icon = item.icon;

            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-gradient-to-l from-luxury-gold/10 to-luxury-cream text-luxury-gold-dark'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700',
                  collapsed && 'justify-center px-0',
                )}
              >
                <Icon className={cn('w-5 h-5 shrink-0', isActive && 'text-luxury-gold')} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {t(item.labelKey, item.id)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-gray-100">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggle}
          className={cn(
            'flex items-center justify-center w-full gap-2 rounded-xl px-3 py-2.5 text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors',
            collapsed && 'px-0',
          )}
        >
          {isRtl ? (
            collapsed ? <ChevronsLeft className="w-5 h-5" /> : <ChevronsRight className="w-5 h-5" />
          ) : collapsed ? (
            <ChevronsRight className="w-5 h-5" />
          ) : (
            <ChevronsLeft className="w-5 h-5" />
          )}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap overflow-hidden"
              >
                {t('sidebar.collapse', 'Collapse')}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
}
