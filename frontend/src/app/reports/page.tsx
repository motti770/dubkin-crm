'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dealsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const STAGE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  'סינון':       { bg: 'bg-slate-100',   text: 'text-slate-700',   bar: 'bg-slate-400' },
  'אפיון':      { bg: 'bg-blue-50',     text: 'text-blue-700',    bar: 'bg-blue-500' },
  'מכירה':      { bg: 'bg-amber-50',    text: 'text-amber-700',   bar: 'bg-amber-500' },
  'סגירה':      { bg: 'bg-purple-50',   text: 'text-purple-700',  bar: 'bg-purple-500' },
  'לקוח פעיל':  { bg: 'bg-emerald-50',  text: 'text-emerald-700', bar: 'bg-emerald-500' },
  'ארכיון':     { bg: 'bg-gray-50',     text: 'text-gray-600',    bar: 'bg-gray-400' },
};

const CLOSED_STAGES = ['לקוח פעיל'];

interface StageStats {
  stage: string;
  count: number;
  total: number;
  percent: number;
}

export default function ReportsPage() {
  const { data: dealsData, isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => dealsApi.list(),
  });

  const deals = dealsData?.data || [];

  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const activeDeals = deals.filter(d => d.stage_display !== 'ארכיון');
    const closedDeals = deals.filter(d => CLOSED_STAGES.includes(d.stage_display));
    const closedThisMonth = closedDeals.filter(d => new Date(d.updated_at) >= startOfMonth);
    const archivedDeals = deals.filter(d => d.stage_display === 'ארכיון');

    const totalPipelineValue = activeDeals.reduce((s, d) => s + (Number(d.value) || 0), 0);
    const closedThisMonthValue = closedThisMonth.reduce((s, d) => s + (Number(d.value) || 0), 0);

    const totalEnded = closedDeals.length + archivedDeals.length;
    const winRate = totalEnded > 0 ? Math.round((closedDeals.length / totalEnded) * 100) : 0;

    const allStages = ['סינון', 'אפיון', 'מכירה', 'סגירה', 'לקוח פעיל', 'ארכיון'];
    const maxValue = Math.max(
      ...allStages.map(stage => deals.filter(d => d.stage_display === stage).reduce((s, d) => s + (Number(d.value) || 0), 0)),
      1
    );
    const stageStats: StageStats[] = allStages.map(stage => {
      const stageDeals = deals.filter(d => d.stage_display === stage);
      const total = stageDeals.reduce((s, d) => s + (Number(d.value) || 0), 0);
      return {
        stage,
        count: stageDeals.length,
        total,
        percent: Math.round((total / maxValue) * 100),
      };
    }).filter(s => s.count > 0);

    return {
      totalPipelineValue,
      activeCount: activeDeals.length,
      closedThisMonthValue,
      closedThisMonthCount: closedThisMonth.length,
      winRate,
      stageStats,
      totalDeals: deals.length,
    };
  }, [deals]);

  return (
    <div className="flex flex-col min-h-screen pb-24 md:pb-8 page-enter">
      {/* Header */}
      <header className="pt-8 px-2 md:px-0 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">דוחות</h1>
        <p className="text-slate-500 text-sm mt-1">סיכום ביצועים</p>
      </header>

      {/* KPI Grid — responsive */}
      <section className="px-2 md:px-0 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Pipeline Total */}
          <div className="glass-panel-dark rounded-3xl p-5 shadow-glass col-span-2 relative overflow-hidden fade-in-up" style={{ animationDelay: '0ms' }}>
            <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary text-[20px]">account_balance_wallet</span>
                <p className="text-slate-500 text-xs font-medium">שווי פייפליין כולל</p>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">
                {isLoading ? '...' : formatCurrency(stats.totalPipelineValue)}
              </p>
              <p className="text-xs text-slate-400 mt-1">{stats.activeCount} עסקאות פעילות</p>
            </div>
          </div>

          {/* Closed This Month */}
          <div className="glass-panel rounded-3xl p-4 shadow-glass fade-in-up" style={{ animationDelay: '60ms' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">trending_up</span>
              <p className="text-slate-500 text-xs">נסגר החודש</p>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {isLoading ? '...' : formatCurrency(stats.closedThisMonthValue)}
            </p>
            <p className="text-xs text-slate-400 mt-1">{stats.closedThisMonthCount} עסקאות</p>
          </div>

          {/* Win Rate */}
          <div className="glass-panel rounded-3xl p-4 shadow-glass fade-in-up" style={{ animationDelay: '120ms' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-amber-500 text-[18px]">emoji_events</span>
              <p className="text-slate-500 text-xs">אחוז סגירה</p>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {isLoading ? '...' : `${stats.winRate}%`}
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: `${stats.winRate}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* Charts section — 2 col on desktop */}
      <div className="px-2 md:px-0 md:grid md:grid-cols-2 md:gap-6 flex-1">
        {/* Deals by Stage */}
        <section>
          <div className="glass-panel rounded-3xl p-5 shadow-glass fade-in-up" style={{ animationDelay: '60ms' }}>
            <h3 className="text-base font-bold text-slate-800 mb-4">עסקאות לפי שלב</h3>
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : stats.stageStats.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-slate-300 text-[40px] mb-2 block">bar_chart</span>
                <p className="text-slate-400 text-sm">אין נתונים עדיין</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {stats.stageStats.map(({ stage, count, total, percent }, i) => {
                  const c = STAGE_COLORS[stage] || STAGE_COLORS['ארכיון'];
                  return (
                    <div key={stage} className="fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${c.text}`}>{stage}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>{count}</span>
                        </div>
                        {total > 0 && <span className="text-xs font-semibold text-slate-600">{formatCurrency(total)}</span>}
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${c.bar}`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Summary + additional stats */}
        <section className="mt-4 md:mt-0 space-y-4">
          <div className="glass-panel rounded-3xl p-4 shadow-glass fade-in-up" style={{ animationDelay: '120ms' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
                <span className="text-sm font-semibold text-slate-700">סה&quot;כ עסקאות</span>
              </div>
              <span className="text-xl font-bold text-slate-900">{stats.totalDeals}</span>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-5 shadow-glass fade-in-up" style={{ animationDelay: '180ms' }}>
            <h3 className="text-base font-bold text-slate-800 mb-4">סיכום חודשי</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">עסקאות חדשות</span>
                <span className="text-sm font-bold text-slate-900">{stats.activeCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">נסגרו בהצלחה</span>
                <span className="text-sm font-bold text-emerald-600">{stats.closedThisMonthCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">אחוז סגירה</span>
                <span className="text-sm font-bold text-amber-600">{stats.winRate}%</span>
              </div>
              <div className="border-t border-slate-200/50 pt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">ערך כולל</span>
                <span className="text-lg font-extrabold text-slate-900">{formatCurrency(stats.totalPipelineValue)}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
