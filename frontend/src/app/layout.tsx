'use client';

import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { contactsApi, dealsApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// ─── FAB Modal (New Lead) ─────────────────────────────────────────────────────
function NewLeadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    stage: 'סינון',
    value: '',
    notes: '',
  });

  const STAGES = ['סינון', 'אפיון', 'מכירה'];

  const mutation = useMutation({
    mutationFn: async () => {
      const contact = await contactsApi.create({
        name: form.name,
        phone: form.phone,
        notes: form.notes,
      });
      await dealsApi.create({
        title: form.name,
        contact_id: contact.id,
        stage: form.stage,
        value: form.value ? parseFloat(form.value) : undefined,
        notes: form.notes,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['pipeline'] });
      setForm({ name: '', phone: '', stage: 'סינון', value: '', notes: '' });
      onClose();
    },
  });

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bg-white/95 backdrop-blur-xl rounded-t-3xl shadow-2xl border-t border-white/50"
        style={{ animation: 'slideUp 0.3s ease' }}
      >
        <div className="p-6">
          {/* Handle */}
          <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-6" />

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">ליד חדש</h2>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">שם *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="שם מלא"
                className="w-full h-11 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">טלפון</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="05X-XXXXXXX"
                dir="ltr"
                className="w-full h-11 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>

            {/* Stage */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">שלב</label>
              <div className="flex gap-2">
                {STAGES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, stage: s }))}
                    className={cn(
                      'flex-1 py-2 rounded-xl text-sm font-semibold transition-all',
                      form.stage === s
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Value */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">ערך עסקה ₪</label>
              <input
                type="number"
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                placeholder="0"
                dir="ltr"
                className="w-full h-11 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">הערות</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="הערות נוספות..."
                rows={3}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              />
            </div>

            {/* Submit */}
            <button
              onClick={() => mutation.mutate()}
              disabled={!form.name || mutation.isPending}
              className="w-full h-12 rounded-2xl bg-primary text-white font-bold text-base shadow-lg shadow-primary/30 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? 'שומר...' : 'שמור'}
            </button>

            {mutation.isError && (
              <p className="text-sm text-red-500 text-center">{(mutation.error as Error).message}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────
interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: '/',         label: 'בית',      icon: 'home' },
  { href: '/pipeline', label: 'פייפליין', icon: 'view_kanban' },
  { href: '/calendar', label: 'יומן',     icon: 'calendar_month' },
  { href: '/reports',  label: 'דוחות',    icon: 'analytics' },
];

function BottomNav({ onFabClick }: { onFabClick: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="glass-nav fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 pb-6 pt-2 z-40 rounded-t-3xl">
      <div className="flex justify-around items-end">
        {navItems.map(({ href, label, icon }, i) => {
          const active = pathname === href;

          // Insert FAB in the center (after 2nd item)
          if (i === 2) {
            return (
              <div key="fab-and-item" className="contents">
                {/* FAB */}
                <div className="relative -top-5" key="fab">
                  <button
                    onClick={onFabClick}
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
                  {icon}
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

// ─── App Shell ────────────────────────────────────────────────────────────────
function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [fabOpen, setFabOpen] = useState(false);

  if (pathname === '/login') return <>{children}</>;

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden mx-auto max-w-md">
      <div className="flex-1 flex flex-col min-w-0 pb-24">
        <PageTransition>{children}</PageTransition>
      </div>
      <BottomNav onFabClick={() => setFabOpen(true)} />
      <NewLeadModal open={fabOpen} onClose={() => setFabOpen(false)} />
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
