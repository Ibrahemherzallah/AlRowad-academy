import { useState, type ComponentType } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, LogOut, ArrowLeft, type LucideProps } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

export interface NavItem {
  to: string;
  labelKey: string;
  icon: ComponentType<LucideProps>;
  /** Optional live badge count (e.g. unread messages). */
  badge?: number;
  end?: boolean;
}

interface Props {
  items: NavItem[];
  titleKey: string;
}

/**
 * Dashboard shell shared by student and admin. Fixed sidebar on desktop,
 * slide-over drawer on mobile. Role-specific nav is passed via `items`.
 */
export function DashboardLayout({ items, titleKey }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);

  const initials = user?.name?.trim().charAt(0) ?? '؟';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const SidebarBody = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <item.icon className="size-5 shrink-0" />
            <span className="flex-1">{t(item.labelKey)}</span>
            {item.badge != null && item.badge > 0 && (
              <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-foreground">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <Link
          to="/"
          className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-5 rtl:rotate-0 ltr:rotate-180" />
          {t('dashboard.backToSite')}
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="size-5" />
          {t('nav.logout')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-e border-border bg-card lg:block">
        <div className="sticky top-0 h-screen">{SidebarBody}</div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              className="fixed inset-y-0 start-0 z-50 w-64 bg-card shadow-xl rtl:end-0 rtl:start-auto lg:hidden"
            >
              {SidebarBody}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-lg md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
              aria-label="Menu"
            >
              <Menu className="size-5" />
            </button>
            <h1 className="text-lg font-bold">{t(titleKey)}</h1>
          </div>

          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
            <div className="ms-2 flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-full bg-primary/10 font-bold text-primary">
                {initials}
              </div>
              <div className="hidden text-sm sm:block">
                <p className="font-semibold leading-none">{user?.name}</p>
                <p className="text-xs text-muted-foreground" dir="ltr">
                  {user?.phone}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Floating mobile menu toggle when drawer closed */}
      {open && (
        <button
          onClick={() => setOpen(false)}
          className="fixed end-4 top-4 z-50 grid size-9 place-items-center rounded-lg bg-card text-foreground shadow lg:hidden"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
      )}
    </div>
  );
}
