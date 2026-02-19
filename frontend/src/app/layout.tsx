'use client';

import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Kanban, Users, Handshake, LogOut, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authApi } from '@/lib/api';

const navItems = [
  { href: '/',         label: 'דשבורד',   icon: LayoutDashboard },
  { href: '/pipeline', label: 'פייפליין', icon: Kanban },
  { href: '/contacts', label: 'אנשי קשר', icon: Users },
  { href: '/deals',    label: 'עסקאות',   icon: Handshake },
];

// ─── Desktop sidebar ──────────────────────────────────────────────────────────
function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'glass-sidebar hidden md:flex flex-col transition-all duration-300 min-h-screen shrink-0 relative z-20',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/05">
        {!collapsed && (
          <div>
            <div className="text-base font-black text-white">Dubkin<span className="text-blue-400">.</span></div>
            <div className="text-[10px] text-white/30 uppercase tracking-widest">CRM</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-all ml-auto"
        >
          <ChevronRight size={15} className={cn('transition-transform duration-300', collapsed ? 'rotate-180' : '')} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 mt-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                active
                  ? 'bg-blue-500/20 text-blue-300 font-semibold'
                  : 'text-white/40 hover:bg-white/06 hover:text-white/80'
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/05">
        {!collapsed && (
          <div className="mb-2 px-1">
            <div className="text-xs text-white/50 font-medium">מורדי דובקין</div>
            <div className="text-[10px] text-white/25">שותף טכנולוגי</div>
          </div>
        )}
        <button
          onClick={() => authApi.logout()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/30
                     hover:bg-red-500/15 hover:text-red-300 transition-all w-full"
        >
          <LogOut size={14} className="shrink-0" />
          {!collapsed && <span>יציאה</span>}
        </button>
      </div>
    </aside>
  );
}

// ─── Mobile bottom navigation ─────────────────────────────────────────────────
function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around
                 px-2 pt-2 pb-safe"
      style={{
        background: 'rgba(8,18,40,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href}
            className="flex flex-col items-center gap-0.5 min-w-[56px] py-1 px-2 rounded-xl
                       active:scale-95 transition-all"
          >
            <div className={cn(
              'w-10 h-8 flex items-center justify-center rounded-xl transition-all',
              active ? 'bg-blue-500/25' : 'bg-transparent'
            )}>
              <Icon size={20} className={active ? 'text-blue-300' : 'text-white/35'} />
            </div>
            <span className={cn('text-[10px] font-medium', active ? 'text-blue-300' : 'text-white/30')}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Page transition ──────────────────────────────────────────────────────────
function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div
      className="flex-1 overflow-auto"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      {children}
    </div>
  );
}

// ─── Root layout ──────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }));

  return (
    <html lang="he" dir="rtl">
      <head>
        <title>דובקין CRM</title>
        <meta name="description" content="מערכת CRM לניהול לקוחות" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0a1628" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Dubkin CRM" />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <AppShell>{children}</AppShell>
        </QueryClientProvider>
      </body>
    </html>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/login') return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      {/* Main — adds bottom padding on mobile for the bottom nav */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        <PageTransition>{children}</PageTransition>
      </div>
      <BottomNav />
    </div>
  );
}
