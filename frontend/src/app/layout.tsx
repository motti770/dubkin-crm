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
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { registerServiceWorker } from '@/lib/push';

const navItems = [
  { href: '/',          label: 'דשבורד',    icon: LayoutDashboard },
  { href: '/pipeline',  label: 'פייפליין',   icon: Kanban },
  { href: '/contacts',  label: 'קשרים',      icon: Users },
  { href: '/deals',     label: 'עסקאות',     icon: Handshake },
  { href: '/settings',  label: 'הגדרות',     icon: Settings },
];

// ── Bottom Navigation (mobile) ──────────────────────────────────────────────
function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href} className={cn('bottom-nav-item', active && 'active')}>
            <Icon size={22} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ── Sidebar (desktop) ────────────────────────────────────────────────────────
function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col bg-card border-l border-border min-h-screen w-56 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 p-5 border-b border-border h-16">
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
          D
        </div>
        <div>
          <div className="text-sm font-bold text-foreground">דובקין CRM</div>
          <div className="text-xs text-muted-foreground">ניהול לקוחות</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                active
                  ? 'bg-blue-500/20 text-blue-400 font-semibold'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon size={18} className="shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs font-medium text-foreground">מורדי דובקין</div>
        <div className="text-xs text-muted-foreground/60 mt-0.5">שותף טכנולוגי</div>
      </div>
    </aside>
  );
}

// ── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
      })
  );

  // Register PWA service worker on mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <html lang="he" dir="rtl">
      <head>
        <title>Dubkin CRM</title>
        <meta name="description" content="מערכת CRM לניהול לקוחות" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Dubkin CRM" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <div className="flex min-h-screen bg-background">
            {/* Desktop sidebar */}
            <Sidebar />

            {/* Main content — padded bottom on mobile for nav bar */}
            <main className="flex-1 overflow-auto pb-20 md:pb-0">
              {children}
            </main>
          </div>

          {/* Mobile bottom nav */}
          <BottomNav />
        </QueryClientProvider>
      </body>
    </html>
  );
}
