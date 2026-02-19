'use client';

import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Kanban,
  Users,
  Handshake,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authApi } from '@/lib/api';

const navItems = [
  { href: '/',          label: 'דשבורד',     icon: LayoutDashboard },
  { href: '/pipeline',  label: 'פייפליין',   icon: Kanban },
  { href: '/contacts',  label: 'אנשי קשר',   icon: Users },
  { href: '/deals',     label: 'עסקאות',     icon: Handshake },
];

function Sidebar() {
  const pathname  = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col bg-card border-l border-border transition-all duration-300 min-h-screen',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-border h-16">
        {!collapsed && (
          <div>
            <div className="text-sm font-bold text-foreground">דובקין CRM</div>
            <div className="text-xs text-muted-foreground">ניהול לקוחות</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight
            size={16}
            className={cn('transition-transform duration-300', collapsed ? 'rotate-180' : 'rotate-0')}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon   = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-primary/20 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        {!collapsed && (
          <div className="mb-2">
            <div className="text-xs text-muted-foreground">מורדי דובקין</div>
            <div className="text-xs text-muted-foreground/60">שותף טכנולוגי</div>
          </div>
        )}
        <button
          onClick={() => authApi.logout()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground
                     hover:bg-secondary hover:text-foreground transition-colors w-full"
        >
          <LogOut size={15} className="shrink-0" />
          {!collapsed && <span>יציאה</span>}
        </button>
      </div>
    </aside>
  );
}

// ─── Page transition wrapper ──────────────────────────────────────────────────
function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div
      className="flex-1 overflow-auto transition-all duration-500"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)' }}
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <AppShell>{children}</AppShell>
        </QueryClientProvider>
      </body>
    </html>
  );
}

// ─── App shell: hides sidebar on /login ──────────────────────────────────────
function AppShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const isLogin   = pathname === '/login';

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <PageTransition>{children}</PageTransition>
    </div>
  );
}
