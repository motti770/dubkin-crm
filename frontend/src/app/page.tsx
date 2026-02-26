'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { followUpsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

// ─── Helpers ────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('crm_token') : null;
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

interface DailyTask {
  id: number;
  title: string;
  date: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  return 'ערב טוב';
}

const MOTIVATION_QUOTES = [
  'כל עסקה מתחילה בשיחה אחת.',
  'העקביות שלך היא היתרון התחרותי.',
  'היום הוא הזמן לסגור את העסקה הבאה.',
  'לידים לא מחכים — תפעל עכשיו.',
  'הצלחה זה תהליך, לא אירוע.',
  'כל לא מקרב אותך ל-כן הבא.',
  'תתמקד בפעולות, התוצאות יגיעו.',
  'הלקוח הבא שלך כבר מחפש אותך.',
  'מי שמודד — משתפר. מי שמשתפר — מנצח.',
  'פולו-אפ אחד יכול לשנות את החודש.',
];

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Progress Bar Component ─────────────────────────────────────────────────

function GoalProgress({
  emoji,
  label,
  current,
  target,
  format,
  index,
}: {
  emoji: string;
  label: string;
  current: number;
  target: number;
  format?: (v: number) => string;
  index: number;
}) {
  const pct = Math.min((current / target) * 100, 100);
  const display = format ? format(current) : String(current);
  const displayTarget = format ? format(target) : String(target);

  return (
    <div
      className="glass-panel rounded-2xl p-4 space-y-2 fade-in-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="text-sm font-bold text-slate-800">{label}</span>
        </div>
        <span className="text-xs font-medium text-slate-500">
          {display} / {displayTarget}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-l from-blue-500 to-blue-400 transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Task Item Component ────────────────────────────────────────────────────

function TaskItem({
  task,
  onToggle,
  isPending,
  index,
}: {
  task: DailyTask;
  onToggle: (id: number, done: boolean) => void;
  isPending: boolean;
  index: number;
}) {
  return (
    <div
      className="flex items-center gap-3 glass-panel rounded-xl px-4 py-3 fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <button
        onClick={() => onToggle(task.id, !task.is_completed)}
        disabled={isPending}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
          task.is_completed
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-slate-300 hover:border-blue-400'
        } disabled:opacity-40`}
      >
        {task.is_completed && (
          <span className="material-symbols-outlined text-[14px] font-bold">check</span>
        )}
      </button>
      <span
        className={`text-sm flex-1 ${
          task.is_completed
            ? 'line-through text-slate-400'
            : 'text-slate-800 font-medium'
        }`}
      >
        {task.title}
      </span>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const qc = useQueryClient();
  const todayStr = getTodayStr();

  // ── Motivation quote (random on mount) ──
  const [quoteIdx] = useState(() => Math.floor(Math.random() * MOTIVATION_QUOTES.length));

  // ── Focus (localStorage) ──
  const focusKey = `crm_focus_${todayStr}`;
  const [focus, setFocus] = useState('');
  useEffect(() => {
    setFocus(localStorage.getItem(focusKey) || '');
  }, [focusKey]);
  const handleFocusChange = (val: string) => {
    setFocus(val);
    localStorage.setItem(focusKey, val);
  };

  // ── Daily Tasks ──
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['daily-tasks', todayStr],
    queryFn: () =>
      fetchApi<{ data: DailyTask[]; total: number }>(`/daily-tasks?date=${todayStr}`),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_completed }: { id: number; is_completed: boolean }) =>
      fetchApi(`/daily-tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_completed }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-tasks', todayStr] });
    },
  });

  const tasks = tasksData?.data || [];

  // ── Follow-ups ──
  const { data: fuData } = useQuery({
    queryKey: ['follow-ups', 'pending'],
    queryFn: () => followUpsApi.list({ status: 'pending' }),
  });
  const overdueFollowUps = (fuData?.data || []).filter(
    (f) => new Date(f.due_date) < new Date()
  );

  // ── Hardcoded goals ──
  const goals = [
    { emoji: '💰', label: 'הכנסה חודשית', current: 0, target: 83333, format: formatCurrency },
    { emoji: '🎯', label: 'לידים השבוע', current: 0, target: 9 },
    { emoji: '📣', label: 'פעולות שיווק', current: 0, target: 10 },
  ];

  return (
    <div className="flex flex-col min-h-screen page-enter">
      {/* ─── Header ─── */}
      <header className="pt-8 pb-2 px-4 md:px-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-full ring-2 ring-white/50 shadow-glass-sm bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-lg">מ</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-none" suppressHydrationWarning>
              {getGreeting()} מוטי 👋
            </h1>
            <p className="text-sm text-slate-500 mt-1" suppressHydrationWarning>
              {MOTIVATION_QUOTES[quoteIdx]}
            </p>
          </div>
        </div>
      </header>

      {/* ─── Quick Shortcuts ─── */}
      <section className="px-2 md:px-0 py-4">
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
          {[
            { href: '/contacts', icon: 'contacts',       label: 'לקוחות',   color: 'text-primary' },
            { href: '/deals',    icon: 'handshake',      label: 'עסקאות',   color: 'text-emerald-500' },
            { href: '/pipeline', icon: 'view_kanban',    label: 'פייפליין', color: 'text-blue-500' },
            { href: '/tasks',    icon: 'task_alt',       label: 'משימות',   color: 'text-amber-500' },
            { href: '/calendar', icon: 'calendar_month', label: 'יומן',     color: 'text-rose-500' },
            { href: '/reports',  icon: 'analytics',      label: 'דוחות',    color: 'text-purple-500' },
            { href: '/chat',     icon: 'forum',          label: 'צ׳אט',     color: 'text-teal-500' },
          ].map(({ href, icon, label, color }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-2 group shrink-0">
              <div className={`glass-panel h-14 w-14 rounded-2xl flex items-center justify-center ${color} shadow-glass-sm group-hover:bg-white transition-all duration-200 transform group-hover:scale-105 group-active:scale-95`}>
                <span className="material-symbols-outlined">{icon}</span>
              </div>
              <span className="text-xs font-medium text-slate-600 whitespace-nowrap">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Follow-ups (מחכים לך) ─── */}
      <section className="px-4 md:px-0 pb-4">
        {overdueFollowUps.length > 0 ? (
          <>
            <h2 className="text-lg font-bold text-red-600 flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[20px]">notification_important</span>
              מחכים לך ({overdueFollowUps.length} אנשים) 🔴
            </h2>
            <div className="space-y-2">
              {overdueFollowUps.map((fu, i) => {
                const daysDiff = Math.floor(
                  (Date.now() - new Date(fu.due_date).getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <Link
                    key={fu.id}
                    href={fu.deal_id ? `/deals/${fu.deal_id}` : '#'}
                    className="flex items-center gap-3 glass-panel rounded-xl px-4 py-3 hover:shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] fade-in-up"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0">
                      <span className="material-symbols-outlined text-[18px]">person</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {fu.contact_name || 'ללא איש קשר'}
                      </p>
                      {fu.deal_name && (
                        <p className="text-xs text-slate-500 truncate">{fu.deal_name}</p>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-red-500 shrink-0">
                      לפני {daysDiff} ימים
                    </span>
                  </Link>
                );
              })}
            </div>
          </>
        ) : fuData ? (
          <div className="glass-panel rounded-2xl flex items-center justify-center py-6 gap-2">
            <span className="text-emerald-500 font-bold text-sm">הכל מסודר 🎉</span>
          </div>
        ) : null}
      </section>

      {/* ─── Goals / Progress Bars ─── */}
      <section className="px-4 md:px-0 pb-4 space-y-3">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-blue-500">flag</span>
          יעדים
        </h2>
        {goals.map((g, i) => (
          <GoalProgress
            key={g.label}
            emoji={g.emoji}
            label={g.label}
            current={g.current}
            target={g.target}
            format={g.format}
            index={i}
          />
        ))}
      </section>

      {/* ─── Focus ─── */}
      <section className="px-4 md:px-0 pb-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-[20px] text-amber-500">center_focus_strong</span>
          פוקוס היום
        </h2>
        <div className="glass-panel rounded-2xl p-1">
          <textarea
            value={focus}
            onChange={e => handleFocusChange(e.target.value)}
            placeholder="מה הפוקוס שלך היום?"
            rows={2}
            className="w-full bg-transparent rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none"
          />
        </div>
      </section>

      {/* ─── Daily Tasks ─── */}
      <section className="px-4 md:px-0 pb-24 md:pb-8 flex-1">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-[20px] text-emerald-500">task_alt</span>
          משימות היום
        </h2>

        {tasksLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 rounded-xl glass-panel animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="glass-panel rounded-2xl flex flex-col items-center justify-center py-12 gap-2">
            <span className="text-4xl">🎉</span>
            <p className="text-slate-500 text-sm font-medium">אין משימות להיום</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task, i) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={(id, done) => toggleMutation.mutate({ id, is_completed: done })}
                isPending={toggleMutation.isPending}
                index={i}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
