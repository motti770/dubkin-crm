'use client';

import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { authApi } from '@/lib/api';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  iconFilled?: string;
}

const navItems: NavItem[] = [
  { href: '/',         label: 'בית',      icon: 'home',        iconFilled: 'home' },
  { href: '/pipeline', label: 'פייפליין', icon: 'view_kanban' },
  { href: '/contacts', label: 'אנשי קשר', icon: 'groups' },
  { href: '/tasks',    label: 'משימות',   icon: 'check_box' },
];

// ─── Bottom Navigation (Stitch design) ─────────────────────────────────────
function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="glass-nav fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 pb-6 pt-2 z-50 rounded-t-3xl">
      <div className="flex justify-around items-end">
        {navItems.map(({ href, label, icon, iconFilled }, i) => {
          const active = pathname === href;

          // Insert FAB in the center (after 2nd item)
          if (i === 2) {
            return (
              <div key="fab-and-item" className="contents">
                {/* FAB */}
                <div className="relative -top-5" key="fab">
                  <button
                    onClick={() => router.push('/deals')}
                    className="bg-primary text-white h-14 w-14 rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center hover:scale-105 transition-transform border-4 border-[#e6f1fe]"
                  >
                    <span className="material-symbols-outlined text-[28px]">add</span>
                  </button>
                </div>
                {/* Nav item */}
                <Link
                  href={href}
                  className={cn(
                    'flex flex-col items-center gap-1 group',
                    active ? 'text-primary' : 'text-slate-400 hover:text-primary transition-colors'
                  )}
                >
                  <div className="h-8 flex items-center justify-center transition-transform group-hover:-translate-y-1">
                    <span
                      className="material-symbols-outlined text-[26px]"
                      style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {icon}
                    </span>
                  </div>
                  <span className={cn('text-[10px]', active ? 'font-bold' : 'font-medium')}>
                    {label}
                  </span>
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 group',
                active ? 'text-primary' : 'text-slate-400 hover:text-primary transition-colors'
              )}
            >
              <div className="h-8 flex items-center justify-center transition-transform group-hover:-translate-y-1">
                <span
                  className="material-symbols-outlined text-[26px]"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {active && iconFilled ? iconFilled : icon}
                </span>
              </div>
              <span className={cn('text-[10px]', active ? 'font-bold' : 'font-medium')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
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
        <meta name="theme-color" content="#e0f2fe" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Dobkin CRM" />
      </head>
      <body className="bg-gradient-to-br from-[#e0f2fe] via-[#dbeafe] to-[#bfdbfe] min-h-screen font-display text-slate-900 antialiased selection:bg-primary/30">
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
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden mx-auto max-w-md">
      <div className="flex-1 flex flex-col min-w-0 pb-24">
        <PageTransition>{children}</PageTransition>
      </div>
      <BottomNav />
    </div>
  );
}
