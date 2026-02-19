'use client';

import { useQuery } from '@tanstack/react-query';
import { dealsApi, activitiesApi, contactsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';

const STAGES = ['צינון', 'אפיון', 'מחירה', 'סגירה', 'לקוח פעיל'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'בוקר טוב,';
  if (h < 17) return 'צהריים טובים,';
  return 'ערב טוב,';
}

export default function DashboardPage() {
  const [stageFilter, setStageFilter] = useState<string>('');

  const { data: dealsData, isLoading: dl } = useQuery({ queryKey: ['deals'], queryFn: dealsApi.list });
  const { data: contactsData, isLoading: cl } = useQuery({ queryKey: ['contacts'], queryFn: () => contactsApi.list() });
  const { data: activitiesData } = useQuery({ queryKey: ['activities'], queryFn: () => activitiesApi.list() });

  const deals = dealsData?.data || [];
  const contacts = contactsData?.data || [];
  const activities = (activitiesData?.data || []).slice(0, 6);

  const openDeals = deals.filter(d => d.stage !== 'ארכיון');
  const totalValue = openDeals.reduce((s, d) => s + (d.value || 0), 0);
  const activeCount = openDeals.length;

  // Filtered deals for pipeline section
  const filteredDeals = stageFilter
    ? openDeals.filter(d => d.stage === stageFilter)
    : openDeals;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header & Main KPI */}
      <header className="pt-8 pb-2 px-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-white/50 shadow-glass-sm bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">מ</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{getGreeting()}</p>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">מוטי 👋</h1>
            </div>
          </div>
          <button className="glass-panel h-10 w-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-white/80 transition-colors">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
          </button>
        </div>

        {/* Big KPI */}
        <div className="glass-panel-dark rounded-2xl p-6 shadow-glass relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl group-hover:bg-blue-400/20 transition-all" />
          <div className="relative z-10">
            <p className="text-slate-500 text-sm font-medium mb-1">שווי פייפליין נוכחי</p>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              {dl ? '...' : formatCurrency(totalValue)}
            </h2>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-sm font-medium text-slate-600">
                {dl ? '...' : `${activeCount} עסקאות פעילות`}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Actions Grid */}
      <section className="px-6 py-4">
        <div className="grid grid-cols-4 gap-3">
          <Link href="/deals" className="flex flex-col items-center gap-2 group">
            <div className="glass-panel h-14 w-14 rounded-2xl flex items-center justify-center text-primary shadow-glass-sm group-hover:bg-white transition-all transform group-hover:scale-105">
              <span className="material-symbols-outlined">add</span>
            </div>
            <span className="text-xs font-medium text-slate-600">ליד חדש</span>
          </Link>
          <button className="flex flex-col items-center gap-2 group">
            <div className="glass-panel h-14 w-14 rounded-2xl flex items-center justify-center text-[#25D366] shadow-glass-sm group-hover:bg-white transition-all transform group-hover:scale-105">
              <span className="material-symbols-outlined">chat</span>
            </div>
            <span className="text-xs font-medium text-slate-600">וואטסאפ</span>
          </button>
          <button className="flex flex-col items-center gap-2 group">
            <div className="glass-panel h-14 w-14 rounded-2xl flex items-center justify-center text-blue-500 shadow-glass-sm group-hover:bg-white transition-all transform group-hover:scale-105">
              <span className="material-symbols-outlined">call</span>
            </div>
            <span className="text-xs font-medium text-slate-600">שיחה</span>
          </button>
          <Link href="/tasks" className="flex flex-col items-center gap-2 group">
            <div className="glass-panel h-14 w-14 rounded-2xl flex items-center justify-center text-amber-500 shadow-glass-sm group-hover:bg-white transition-all transform group-hover:scale-105">
              <span className="material-symbols-outlined">history</span>
            </div>
            <span className="text-xs font-medium text-slate-600">פולו-אפ</span>
          </Link>
        </div>
      </section>

      {/* Secondary KPI Cards Scroll */}
      <section className="pl-0 pr-6 pb-6 overflow-hidden">
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pr-1 pl-6 snap-x">
          {/* Card 1: Monthly deals */}
          <div className="glass-panel min-w-[140px] p-4 rounded-3xl shadow-glass snap-start flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <div className="bg-green-100 p-1.5 rounded-full text-green-600">
                <span className="material-symbols-outlined text-[18px]">trending_up</span>
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-medium mb-0.5">עסקאות החודש</p>
              <p className="text-slate-900 text-xl font-bold">
                {dl ? '...' : formatCurrency(openDeals.reduce((s, d) => s + (d.value || 0), 0))}
              </p>
            </div>
          </div>
          {/* Card 2: Open follow-ups */}
          <div className="glass-panel min-w-[140px] p-4 rounded-3xl shadow-glass snap-start flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <div className="bg-amber-100 p-1.5 rounded-full text-amber-600">
                <span className="material-symbols-outlined text-[18px]">priority_high</span>
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-medium mb-0.5">פולו-אפים פתוחים</p>
              <p className="text-slate-900 text-xl font-bold">{activities.length}</p>
            </div>
          </div>
          {/* Card 3: New leads */}
          <div className="glass-panel min-w-[140px] p-4 rounded-3xl shadow-glass snap-start flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <div className="bg-blue-100 p-1.5 rounded-full text-blue-600">
                <span className="material-symbols-outlined text-[18px]">bolt</span>
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-medium mb-0.5">לידים חדשים</p>
              <p className="text-slate-900 text-xl font-bold">{cl ? '...' : contacts.length}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline Section */}
      <section className="flex-1 rounded-t-[2.5rem] glass-panel-dark shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pt-6 pb-24 px-6 mt-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">פייפליין פעיל</h3>
          <Link
            href="/pipeline"
            className="text-primary text-sm font-medium hover:text-blue-600 flex items-center gap-1"
          >
            ראה הכל
            <span className="material-symbols-outlined text-[16px] rotate-180">arrow_right_alt</span>
          </Link>
        </div>

        {/* Stages Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-2">
          <button
            onClick={() => setStageFilter('')}
            className={
              !stageFilter
                ? 'whitespace-nowrap bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-medium shadow-md'
                : 'whitespace-nowrap glass-panel px-4 py-2 rounded-full text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 transition-colors'
            }
          >
            הכל
          </button>
          {STAGES.map(stage => (
            <button
              key={stage}
              onClick={() => setStageFilter(stage === stageFilter ? '' : stage)}
              className={
                stageFilter === stage
                  ? 'whitespace-nowrap bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-medium shadow-md'
                  : 'whitespace-nowrap glass-panel px-4 py-2 rounded-full text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 transition-colors'
              }
            >
              {stage}
            </button>
          ))}
        </div>

        {/* Deals List */}
        {dl ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/50 border border-white/60 p-3 rounded-2xl h-20 animate-pulse" />
            ))}
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-400 text-sm">אין עסקאות להצגה</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredDeals.slice(0, 8).map(deal => (
              <Link
                key={deal.id}
                href="/deals"
                className="bg-white/50 border border-white/60 p-3 rounded-2xl flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Avatar / Initials */}
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-lg font-bold border border-white shrink-0">
                  {(deal.contact_name || deal.title).charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h4 className="text-slate-900 font-bold text-sm truncate">
                      {deal.contact_name || deal.title}
                    </h4>
                    {deal.value ? (
                      <span className="text-slate-900 font-bold text-sm">
                        {formatCurrency(deal.value)}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-slate-500 text-xs truncate mb-1">{deal.title}</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${getStageColor(deal.stage)}`} />
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getStageBadge(deal.stage)}`}>
                      {deal.stage}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    'צינון': 'bg-red-500',
    'אפיון': 'bg-blue-500',
    'מחירה': 'bg-amber-500',
    'סגירה': 'bg-purple-500',
    'לקוח פעיל': 'bg-green-500',
  };
  return colors[stage] || 'bg-slate-400';
}

function getStageBadge(stage: string): string {
  const badges: Record<string, string> = {
    'צינון': 'text-red-600 bg-red-50',
    'אפיון': 'text-blue-700 bg-blue-50',
    'מחירה': 'text-amber-700 bg-amber-50',
    'סגירה': 'text-purple-700 bg-purple-50',
    'לקוח פעיל': 'text-green-700 bg-green-50',
  };
  return badges[stage] || 'text-slate-600 bg-slate-50';
}
