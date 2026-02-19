'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { activitiesApi, dealsApi } from '@/lib/api';

interface Task {
  id: number;
  text: string;
  priority: 'high' | 'normal' | 'low';
  time: string;
  completed: boolean;
  type?: string;
  dealTitle?: string;
  contactName?: string;
}

const FILTERS = [
  { label: 'הכל', value: '' },
  { label: 'דחיפות גבוהה', value: 'high' },
  { label: 'שיחות', value: 'call' },
  { label: 'פגישות', value: 'meeting' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'בוקר טוב,';
  if (h < 17) return 'צהריים טובים,';
  return 'ערב טוב,';
}

function getHebrewDate() {
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const now = new Date();
  return `יום ${days[now.getDay()]}, ${now.getDate()} ב${months[now.getMonth()]}`;
}

function getPriorityBadge(priority: string): { bg: string; text: string; label: string; dot: string } {
  switch (priority) {
    case 'high':
      return { bg: 'bg-red-100', text: 'text-red-600', label: 'דחיפות גבוהה', dot: 'bg-red-500' };
    case 'low':
      return { bg: 'bg-emerald-100', text: 'text-emerald-600', label: 'נמוך', dot: 'bg-emerald-500' };
    default:
      return { bg: 'bg-blue-100', text: 'text-blue-600', label: 'רגיל', dot: 'bg-blue-500' };
  }
}

function getTypeIcon(type?: string): string {
  switch (type) {
    case 'call': return 'call';
    case 'meeting': return 'videocam';
    case 'email': return 'mail';
    default: return 'schedule';
  }
}

export default function TasksPage() {
  const [filter, setFilter] = useState('');
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());

  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activitiesApi.list(),
  });
  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => dealsApi.list(),
  });

  const isLoading = activitiesLoading || dealsLoading;

  const tasks: Task[] = [];
  const activities = activitiesData?.data || [];
  activities.forEach((activity, i) => {
    const hour = 9 + Math.floor(i * 1.5);
    const minute = (i % 2) * 30;
    tasks.push({
      id: activity.id,
      text: activity.description || `${activity.type} - ${activity.deal_title || activity.contact_name || 'פעילות'}`,
      priority: i < 2 ? 'high' : i < 4 ? 'normal' : 'low',
      time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      completed: false,
      type: activity.type,
      dealTitle: activity.deal_title || undefined,
      contactName: activity.contact_name || undefined,
    });
  });

  const deals = dealsData?.data || [];
  deals.filter(d => d.stage_display === 'סינון' || d.stage_display === 'אפיון').forEach((deal, i) => {
    tasks.push({
      id: 10000 + deal.id,
      text: `מעקב: ${deal.name || deal.title}${deal.contact_name ? ` (${deal.contact_name})` : ''}`,
      priority: deal.stage_display === 'סינון' ? 'high' : 'normal',
      time: `${(14 + i).toString().padStart(2, '0')}:00`,
      completed: false,
      type: 'note',
      dealTitle: deal.name || deal.title || undefined,
      contactName: deal.contact_name || undefined,
    });
  });

  const filteredTasks = tasks.filter(t => {
    if (!filter) return true;
    if (filter === 'high') return t.priority === 'high';
    if (filter === 'call') return t.type === 'call';
    if (filter === 'meeting') return t.type === 'meeting';
    return true;
  });

  const openCount = filteredTasks.filter(t => !completedIds.has(t.id)).length;
  const doneCount = completedIds.size;

  const highPriority = filteredTasks.filter(t => t.priority === 'high');
  const normalPriority = filteredTasks.filter(t => t.priority !== 'high');

  const toggleComplete = (id: number) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col page-enter">
      {/* Header */}
      <header className="sticky top-0 z-20 px-2 md:px-0 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6 md:hidden">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/50 backdrop-blur-sm shadow-sm flex items-center justify-center overflow-hidden border border-white">
              <span className="text-primary font-bold text-sm">מ</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-500" suppressHydrationWarning>{getGreeting()}</span>
              <span className="text-sm font-bold text-slate-800">מוטי דובקין</span>
            </div>
          </div>
          <button className="h-10 w-10 rounded-full bg-white/50 hover:bg-white transition-colors duration-200 flex items-center justify-center text-slate-600 shadow-sm border border-white">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium text-primary uppercase tracking-wide opacity-80" suppressHydrationWarning>{getHebrewDate()}</h2>
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">משימות להיום</h1>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-4 shadow-glass flex flex-col gap-2 relative overflow-hidden group fade-in-up" style={{ animationDelay: '0ms' }}>
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-blue-100/50 blur-2xl group-hover:bg-blue-200/50 transition-colors duration-500" />
            <div className="flex items-center justify-between z-10">
              <span className="text-2xl font-bold text-slate-800">{isLoading ? '...' : openCount}</span>
              <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg text-[20px]">pending_actions</span>
            </div>
            <span className="text-xs font-medium text-slate-500 z-10">פתוחות</span>
          </div>
          <div className="glass-card rounded-2xl p-4 shadow-glass flex flex-col gap-2 relative overflow-hidden group fade-in-up" style={{ animationDelay: '60ms' }}>
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-green-100/50 blur-2xl group-hover:bg-green-200/50 transition-colors duration-500" />
            <div className="flex items-center justify-between z-10">
              <span className="text-2xl font-bold text-slate-800">{doneCount}</span>
              <span className="material-symbols-outlined text-emerald-600 bg-emerald-100 p-1.5 rounded-lg text-[20px]">check_circle</span>
            </div>
            <span className="text-xs font-medium text-slate-500 z-10">הושלמו</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mt-6 overflow-x-auto no-scrollbar pb-2">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={
                filter === f.value
                  ? 'flex-shrink-0 bg-primary text-white px-5 py-2 rounded-full text-sm font-medium shadow-lg shadow-primary/20 transition-all duration-200 active:scale-95'
                  : 'flex-shrink-0 bg-white/60 hover:bg-white text-slate-600 px-5 py-2 rounded-full text-sm font-medium border border-white/50 backdrop-blur-sm transition-all duration-200 active:scale-95'
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {/* Task List — 2 columns on desktop */}
      <main className="flex-1 px-2 md:px-0 pb-28 md:pb-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 rounded-2xl glass-card animate-pulse" />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-slate-300 text-[48px] mb-3 block">check_circle</span>
            <p className="text-slate-400">אין משימות להצגה</p>
          </div>
        ) : (
          <div className="md:grid md:grid-cols-2 md:gap-8">
            {/* High Priority */}
            {highPriority.length > 0 && (
              <div className="mb-4 md:mb-0">
                <h3 className="text-xs font-semibold text-slate-400 mb-3 px-1">דחיפות גבוהה</h3>
                <div className="flex flex-col gap-3">
                  {highPriority.map((task, i) => (
                    <TaskItem key={task.id} task={task} completed={completedIds.has(task.id)} onToggle={() => toggleComplete(task.id)} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Normal Priority */}
            {normalPriority.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-400 mb-3 px-1 mt-2 md:mt-0">המשך היום</h3>
                <div className="flex flex-col gap-3">
                  {normalPriority.map((task, i) => (
                    <TaskItem key={task.id} task={task} completed={completedIds.has(task.id)} onToggle={() => toggleComplete(task.id)} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function TaskItem({ task, completed, onToggle, index }: { task: Task; completed: boolean; onToggle: () => void; index: number }) {
  const priority = getPriorityBadge(task.priority);
  const icon = getTypeIcon(task.type);
  const [expanded, setExpanded] = useState(false);

  const typeLabels: Record<string, string> = {
    call: 'שיחה', email: 'אימייל', meeting: 'פגישה',
    note: 'הערה', task: 'משימה', message: 'הודעה',
  };

  return (
    <div
      className={`glass-card rounded-2xl shadow-glass transition-all duration-300 ${completed ? 'opacity-60' : ''} fade-in-up`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Main row */}
      <div className="flex items-start gap-3 p-4">
        {/* Checkbox */}
        <label className="cursor-pointer mt-0.5 shrink-0">
          <input type="checkbox" className="peer sr-only" checked={completed} onChange={onToggle} />
          <div className="h-6 w-6 rounded-full border-2 border-slate-300 bg-white/50 flex items-center justify-center transition-all duration-200 peer-checked:bg-primary peer-checked:border-primary">
            <svg className={`w-3.5 h-3.5 text-white ${completed ? '' : 'hidden'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
            </svg>
          </div>
        </label>

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={() => setExpanded(v => !v)}>
          <p className={`text-base font-semibold text-slate-800 leading-snug ${completed ? 'line-through text-slate-400' : ''}`}>
            {task.text}
          </p>
          {/* Preview line when collapsed */}
          {!expanded && (task.contactName || task.dealTitle) && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {task.contactName && <span>👤 {task.contactName}</span>}
              {task.contactName && task.dealTitle && <span className="mx-1">·</span>}
              {task.dealTitle && <span>💼 {task.dealTitle}</span>}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            {!completed ? (
              <span className={`inline-flex items-center gap-1 ${priority.bg} ${priority.text} px-2 py-0.5 rounded-md text-[10px] font-bold`}>
                <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                {priority.label}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[10px] font-bold">הושלם</span>
            )}
            <div className="flex items-center text-slate-400 text-xs">
              <span className="material-symbols-outlined ml-1 text-[14px]">{completed ? 'check' : icon}</span>
              {task.time}
            </div>
          </div>
        </div>

        {/* Expand chevron */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="shrink-0 h-7 w-7 rounded-full bg-slate-100/70 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-all duration-200 mt-0.5"
        >
          <span className="material-symbols-outlined text-[18px]" style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            expand_more
          </span>
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100/60 pt-3 space-y-2">
          {task.contactName && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
                <span className="font-medium">{task.contactName}</span>
              </div>
              <a
                href={`https://wa.me/972${task.contactName}`}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 bg-[#25D366]/10 text-[#25D366] text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#25D366]/20 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">chat</span>
                WhatsApp
              </a>
            </div>
          )}
          {task.dealTitle && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="material-symbols-outlined text-[16px] text-slate-400">handshake</span>
              <span className="font-medium">{task.dealTitle}</span>
            </div>
          )}
          {task.type && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="material-symbols-outlined text-[16px] text-slate-400">{icon}</span>
              <span>{typeLabels[task.type] || task.type}</span>
            </div>
          )}
          {!task.contactName && !task.dealTitle && !task.type && (
            <p className="text-xs text-slate-400 italic">אין פרטים נוספים</p>
          )}
        </div>
      )}
    </div>
  );
}
