'use client';

import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { contactsApi, dealsApi, authApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavItem {
  href: string;
  label: string;
  icon: string;
}

// ─── Nav items (shared between sidebar + bottom nav) ──────────────────────────
const sidebarItems: NavItem[] = [
  { href: '/',          label: 'בית',        icon: 'home' },
  { href: '/pipeline',  label: 'פייפליין',   icon: 'view_kanban' },
  { href: '/contacts',  label: 'אנשי קשר',  icon: 'contacts' },
  { href: '/deals',     label: 'עסקאות',     icon: 'handshake' },
  { href: '/marketing', label: 'שיווק',      icon: 'campaign' },
  { href: '/tasks',     label: 'משימות',     icon: 'task_alt' },
  { href: '/calendar',  label: 'יומן',       icon: 'calendar_month' },
  { href: '/reports',   label: 'דוחות',      icon: 'analytics' },
  { href: '/chat',      label: 'צ׳אט',      icon: 'forum' },
];

const bottomNavItems: NavItem[] = [
  { href: '/',          label: 'בית',        icon: 'home' },
  { href: '/pipeline',  label: 'פייפליין',   icon: 'view_kanban' },
  // FAB goes here (index 2)
  { href: '/calendar',  label: 'יומן',       icon: 'calendar_month' },
  { href: '/reports',   label: 'דוחות',      icon: 'analytics' },
];

// ─── FAB Modal (New Lead) ─────────────────────────────────────────────────────
function NewLeadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [closing, setClosing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    stage: 'סינון',
    value: '',
    notes: '',
  });

  const STAGES = [
    { label: 'סינון', emoji: '🔍' },
    { label: 'אפיון', emoji: '📋' },
    { label: 'מכירה', emoji: '🤝' },
  ];

  const mutation = useMutation({
    mutationFn: async () => {
      const contact = await contactsApi.create({
        name: form.name,
        phone: form.phone,
        notes: form.notes,
      });
      await dealsApi.create({
        name: form.name,
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
      handleClose();
    },
  });

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 250);
  }, [onClose]);

  if (!open && !closing) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 ${closing ? 'backdrop-exit' : 'backdrop-enter'}`}
        onClick={handleClose}
      />
      {/* Bottom Sheet */}
      <div
        className={`fixed bottom-0 inset-x-0 z-50 glass-sheet rounded-t-3xl shadow-2xl ${closing ? 'slide-down' : 'slide-up'}`}
        style={{ maxHeight: '92dvh' }}
      >
        {/* Scrollable content */}
        <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: '92dvh' }}>
          <div className="p-6">
            {/* Drag handle */}
            <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-5" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-primary flex items-center justify-center shadow-md shadow-blue-500/30">
                  <span className="material-symbols-outlined text-white text-[18px]">person_add</span>
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 leading-tight">ליד חדש</h2>
                  <p className="text-xs text-slate-400">צור איש קשר + עסקה</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* ── Section: פרטי איש קשר ── */}
            <div className="mb-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-px flex-1 bg-slate-100" />
                <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">פרטי איש קשר</span>
                <span className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="space-y-3">
                {/* Name */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 mb-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">badge</span>
                    שם מלא
                    <span className="text-red-400 text-xs">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="ישראל ישראלי"
                    className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                  />
                </div>

                {/* WhatsApp phone */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 mb-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#25D366]">chat</span>
                    WhatsApp
                  </label>
                  <div className="flex gap-2 items-center h-12 rounded-2xl bg-slate-50 border border-slate-200 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/30 transition-all overflow-hidden px-4">
                    <span className="text-lg shrink-0">🇮🇱</span>
                    <span className="text-slate-400 text-sm shrink-0">+972</span>
                    <div className="w-px h-5 bg-slate-200 mx-1 shrink-0" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="05X-XXXXXXX"
                      dir="ltr"
                      className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm outline-none min-w-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section: פרטי עסקה ── */}
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-px flex-1 bg-slate-100" />
                <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">פרטי עסקה</span>
                <span className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="space-y-3">
                {/* Stage selector — animated pill tabs */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 mb-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">linear_scale</span>
                    שלב בצנרת
                  </label>
                  <div className="relative flex gap-1 bg-slate-100 rounded-2xl p-1">
                    {/* Sliding pill indicator */}
                    <div
                      className="absolute top-1 bottom-1 rounded-xl bg-gradient-to-r from-blue-500 to-primary shadow-md shadow-blue-500/30 transition-all duration-300"
                      style={{
                        width: `calc(${100 / STAGES.length}% - 4px)`,
                        right: `calc(${STAGES.findIndex(s => s.label === form.stage) * (100 / STAGES.length)}% + 2px)`,
                      }}
                    />
                    {STAGES.map(s => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, stage: s.label }))}
                        className={cn(
                          'relative z-10 flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-colors duration-200',
                          form.stage === s.label ? 'text-white' : 'text-slate-500 hover:text-slate-700'
                        )}
                      >
                        <span>{s.emoji}</span>
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deal value */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 mb-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">payments</span>
                    ערך עסקה
                  </label>
                  <div className="flex items-center h-12 rounded-2xl bg-slate-50 border border-slate-200 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/30 transition-all overflow-hidden px-4">
                    <span className="text-slate-400 text-sm font-bold ml-2 shrink-0">₪</span>
                    <input
                      type="number"
                      value={form.value}
                      onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                      placeholder="0"
                      dir="ltr"
                      className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm outline-none min-w-0"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 mb-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">notes</span>
                    הערות
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="הוסף הערות, מידע רלוונטי..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="mt-6 space-y-2 pb-2">
              <button
                onClick={() => mutation.mutate()}
                disabled={!form.name || mutation.isPending}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-primary text-white font-bold text-base shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {mutation.isPending ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                    שומר...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">save</span>
                    שמור ליד
                  </>
                )}
              </button>

              {mutation.isError && (
                <p className="text-sm text-red-500 text-center">{(mutation.error as Error).message}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 flex-col glass-sidebar fixed top-0 right-0 h-full z-30 sidebar-enter">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Dobkin<span className="text-primary">.</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">מערכת ניהול לקוחות</p>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {sidebarItems.map(({ href, label, icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
              )}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {icon}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User section at bottom */}
      <div className="p-4 border-t border-white/40">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">מ</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">מוטי דובקין</p>
            <p className="text-[10px] text-slate-400">מנהל</p>
          </div>
        </div>
        <button
          onClick={() => authApi.logout()}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          התנתק
        </button>
      </div>
    </aside>
  );
}

// ─── Bottom Navigation (Mobile) ──────────────────────────────────────────────
function BottomNav({ onFabClick }: { onFabClick: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden glass-nav fixed bottom-0 left-0 right-0 px-4 pb-6 pt-2 z-40 rounded-t-3xl">
      <div className="flex justify-around items-end max-w-lg mx-auto">
        {bottomNavItems.map(({ href, label, icon }, i) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

          // Insert FAB in the center (after 2nd item)
          if (i === 2) {
            return (
              <div key="fab-and-item" className="contents">
                {/* FAB */}
                <div className="relative -top-5">
                  <button
                    onClick={onFabClick}
                    className="bg-primary text-white h-14 w-14 rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-200 border-4 border-[#e6f1fe]"
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
                  <div className="h-8 flex items-center justify-center transition-transform duration-200 group-hover:-translate-y-1">
                    <span className="material-symbols-outlined text-[26px]" style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>{icon}</span>
                  </div>
                  <span className={cn('text-[10px]', active ? 'font-bold' : 'font-medium')}>{label}</span>
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
              <div className="h-8 flex items-center justify-center transition-transform duration-200 group-hover:-translate-y-1">
                <span className="material-symbols-outlined text-[26px]" style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>{icon}</span>
              </div>
              <span className={cn('text-[10px]', active ? 'font-bold' : 'font-medium')}>{label}</span>
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
    <div className="min-h-screen flex flex-col md:flex-row-reverse">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main Content */}
      <main className="flex-1 md:mr-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-0 pb-24 md:pb-8">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
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
