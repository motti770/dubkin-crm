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
    queryFn: dealsApi.list,
  });

  const isLoading = activitiesLoading || dealsLoading;

  // Generate tasks from activities and deals
  const tasks: Task[] = [];

  // Create tasks from activities (follow-ups)
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

  // Add deal-based follow-up tasks
  const deals = dealsData?.data || [];
  deals.filter(d => d.stage === 'סינון' || d.stage === 'אפיון').forEach((deal, i) => {
    tasks.push({
      id: 10000 + deal.id,
      text: `מעקב: ${deal.title}${deal.contact_name ? ` (${deal.contact_name})` : ''}`,
      priority: deal.stage === 'סינון' ? 'high' : 'normal',
      time: `${(14 + i).toString().padStart(2, '0')}:00`,
      completed: false,
      type: 'note',
      dealTitle: deal.title,
      contactName: deal.contact_name || undefined,
    });
  });

  // Apply filter
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
    <div className="relative flex h-full min-h-screen w-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 px-6 pt-8 pb-4">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/50 backdrop-blur-sm shadow-sm flex items-center justify-center overflow-hidden border border-white">
              <span className="text-primary font-bold text-sm">מ</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-500">{getGreeting()}</span>
              <span className="text-sm font-bold text-slate-800">מוטי דובקין</span>
            </div>
          </div>
          <button className="h-10 w-10 rounded-full bg-white/50 hover:bg-white transition-colors flex items-center justify-center text-slate-600 shadow-sm border border-white">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
          </button>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium text-primary uppercase tracking-wide opacity-80">{getHebrewDate()}</h2>
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">משימות להיום</h1>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-4 shadow-glass flex flex-col gap-2 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-blue-100/50 blur-2xl group-hover:bg-blue-200/50 transition-colors" />
            <div className="flex items-center justify-between z-10">
              <span className="text-2xl font-bold text-slate-800">{isLoading ? '...' : openCount}</span>
              <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg text-[20px]">pending_actions</span>
            </div>
            <span className="text-xs font-medium text-slate-500 z-10">פתוחות</span>
          </div>
          <div className="glass-card rounded-2xl p-4 shadow-glass flex flex-col gap-2 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-green-100/50 blur-2xl group-hover:bg-green-200/50 transition-colors" />
            <div className="flex items-center justify-between z-10">
              <span className="text-2xl font-bold text-slate-800">{doneCount}</span>
              <span className="material-symbols-outlined text-emerald-600 bg-emerald-100 p-1.5 rounded-lg text-[20px]">check_circle</span>
            </div>
            <span className="text-xs font-medium text-slate-500 z-10">הושלמו</span>
          </div>
        </div>

        {/* Filter Tags */}
        <div className="flex gap-3 mt-6 overflow-x-auto no-scrollbar pb-2">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={
                filter === f.value
                  ? 'flex-shrink-0 bg-primary text-white px-5 py-2 rounded-full text-sm font-medium shadow-lg shadow-primary/20 transition-transform active:scale-95'
                  : 'flex-shrink-0 bg-white/60 hover:bg-white text-slate-600 px-5 py-2 rounded-full text-sm font-medium border border-white/50 backdrop-blur-sm transition-all active:scale-95'
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {/* Task List */}
      <main className="flex-1 px-6 pb-28 flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
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
          <>
            {/* High Priority Section */}
            {highPriority.length > 0 && (
              <div className="mb-2">
                <h3 className="text-xs font-semibold text-slate-400 mb-3 px-1">דחיפות גבוהה</h3>
                <div className="flex flex-col gap-3">
                  {highPriority.map(task => (
                    <TaskItem key={task.id} task={task} completed={completedIds.has(task.id)} onToggle={() => toggleComplete(task.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* Normal Priority Section */}
            {normalPriority.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-400 mb-3 px-1 mt-2">המשך היום</h3>
                <div className="flex flex-col gap-3">
                  {normalPriority.map(task => (
                    <TaskItem key={task.id} task={task} completed={completedIds.has(task.id)} onToggle={() => toggleComplete(task.id)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* FAB */}
      <div className="fixed left-6 bottom-24 z-30">
        <button className="h-14 w-14 rounded-full bg-primary text-white shadow-float hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center group relative overflow-hidden">
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <span className="material-symbols-outlined text-[32px] relative z-10">add</span>
        </button>
      </div>
    </div>
  );
}

function TaskItem({ task, completed, onToggle }: { task: Task; completed: boolean; onToggle: () => void }) {
  const priority = getPriorityBadge(task.priority);
  const icon = getTypeIcon(task.type);

  return (
    <div className={`glass-card rounded-2xl p-4 shadow-glass hover:shadow-lg transition-shadow duration-300 group ${completed ? 'opacity-60' : ''}`}>
      <label className="flex items-start gap-4 cursor-pointer checkbox-wrapper w-full">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={completed}
          onChange={onToggle}
        />
        <div className="h-6 w-6 rounded-full border-2 border-slate-300 bg-white/50 flex items-center justify-center transition-all mt-0.5 peer-focus:ring-2 peer-focus:ring-primary/20">
          <svg className="w-3.5 h-3.5 text-white hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-base font-semibold text-slate-800 group-hover:text-primary transition-colors truncate ${completed ? 'line-through text-slate-400' : ''}`}>
            {task.text}
          </p>
          <div className="flex items-center gap-3 mt-2">
            {!completed ? (
              <span className={`inline-flex items-center gap-1 ${priority.bg} ${priority.text} px-2 py-0.5 rounded-md text-[10px] font-bold`}>
                <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                {priority.label}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[10px] font-bold">
                הושלם
              </span>
            )}
            <div className="flex items-center text-slate-400 text-xs">
              <span className="material-symbols-outlined ml-1 text-[14px]">{completed ? 'check' : icon}</span>
              {task.time}
            </div>
          </div>
        </div>
      </label>
    </div>
  );
}
