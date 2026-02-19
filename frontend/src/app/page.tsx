'use client';

import { useQuery } from '@tanstack/react-query';
import { dealsApi, activitiesApi, contactsApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, Users, Handshake, Activity,
  ArrowUpRight, Clock, ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';

const STAGE_COLORS: Record<string, { bar: string; badge: string }> = {
  'צינון':       { bar: 'bg-slate-400',   badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  'אפיון':       { bar: 'bg-blue-400',    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  'מחירה':       { bar: 'bg-amber-400',   badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  'סגירה':       { bar: 'bg-purple-400',  badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  'לקוח פעיל':  { bar: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  'ארכיון':      { bar: 'bg-gray-500',    badge: 'bg-gray-600/20 text-gray-400 border-gray-600/30' },
};

const ACTIVITY_ICONS: Record<string, string> = {
  call: '📞', email: '📧', meeting: '🤝', note: '📝', task: '✅',
};

const STATS = [
  { key: 'deals',    label: 'עסקאות פתוחות', icon: Handshake,   cls: 'stat-blue',   iconCls: 'text-blue-300' },
  { key: 'value',    label: 'סה"כ פייפליין', icon: TrendingUp,  cls: 'stat-green',  iconCls: 'text-emerald-300' },
  { key: 'contacts', label: 'אנשי קשר',      icon: Users,       cls: 'stat-purple', iconCls: 'text-purple-300' },
  { key: 'active',   label: 'לקוחות פעילים', icon: Activity,    cls: 'stat-amber',  iconCls: 'text-amber-300' },
];

export default function DashboardPage() {
  const { data: dealsData,     isLoading: dealsLoading     } = useQuery({ queryKey: ['deals'],     queryFn: dealsApi.list });
  const { data: contactsData,  isLoading: contactsLoading  } = useQuery({ queryKey: ['contacts'],  queryFn: () => contactsApi.list() });
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({ queryKey: ['activities'], queryFn: () => activitiesApi.list() });

  const deals      = dealsData?.data || [];
  const contacts   = contactsData?.data || [];
  const activities = (activitiesData?.data || []).slice(0, 8);

  const openDeals    = deals.filter(d => d.stage !== 'ארכיון');
  const totalValue   = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const activeCount  = deals.filter(d => d.stage === 'לקוח פעיל').length;

  const statValues: Record<string, string> = {
    deals:    dealsLoading    ? '—' : String(openDeals.length),
    value:    dealsLoading    ? '—' : formatCurrency(totalValue),
    contacts: contactsLoading ? '—' : String(contacts.length),
    active:   dealsLoading    ? '—' : String(activeCount),
  };

  const stages = ['צינון', 'אפיון', 'מחירה', 'סגירה', 'לקוח פעיל'];
  const stageBreakdown = stages.map(stage => ({
    stage,
    count: deals.filter(d => d.stage === stage).length,
    value: deals.filter(d => d.stage === stage).reduce((s, d) => s + (d.value || 0), 0),
  }));
  const maxCount = Math.max(...stageBreakdown.map(s => s.count), 1);

  return (
    <div className="relative z-10 p-5 space-y-5 max-w-5xl mx-auto">

      {/* Header */}
      <div className="pt-2 pb-1">
        <h1 className="text-2xl font-black text-white">דשבורד</h1>
        <p className="text-blue-300/50 text-xs mt-1">סקירה כללית של העסק</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map(({ key, label, icon: Icon, cls, iconCls }) => (
          <div key={key} className={`glass ${cls} p-4 flex items-center justify-between`}>
            <div>
              <p className="text-[11px] text-white/50 mb-1">{label}</p>
              <p className="text-xl font-black text-white leading-none">
                {statValues[key]}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/08">
              <Icon size={19} className={iconCls} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Pipeline breakdown */}
        <div className="glass p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">פירוט פייפליין</h2>
            <Link href="/pipeline"
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
              לוח קנבן <ChevronLeft size={13} />
            </Link>
          </div>
          {dealsLoading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="h-9 rounded-xl bg-white/05 animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {stageBreakdown.map(({ stage, count, value }) => {
                const colors = STAGE_COLORS[stage] || STAGE_COLORS['ארכיון'];
                return (
                  <div key={stage}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors.badge}`}>
                          {stage}
                        </span>
                        <span className="text-xs text-white/40">{count} עסקאות</span>
                      </div>
                      <span className="text-xs font-semibold text-white/70">{formatCurrency(value)}</span>
                    </div>
                    <div className="h-1.5 bg-white/06 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors.bar} rounded-full transition-all duration-700 opacity-70`}
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="glass p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">פעילות אחרונה</h2>
            <Clock size={13} className="text-blue-300/50" />
          </div>
          {activitiesLoading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-11 rounded-xl bg-white/05 animate-pulse" />)}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-6">אין פעילות עדיין</p>
          ) : (
            <div className="space-y-2.5">
              {activities.map(a => (
                <div key={a.id} className="flex gap-2.5 items-start p-2.5 rounded-xl hover:bg-white/04 transition-colors">
                  <span className="text-sm mt-0.5">{ACTIVITY_ICONS[a.type] || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/80 truncate">{a.description}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      {a.deal_title || a.contact_name || '—'} · {formatDateTime(a.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent deals */}
      <div className="glass p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">עסקאות אחרונות</h2>
          <Link href="/deals"
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
            כל העסקאות <ArrowUpRight size={13} />
          </Link>
        </div>
        {dealsLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-white/05 animate-pulse" />)}
          </div>
        ) : deals.length === 0 ? (
          <p className="text-xs text-white/30 text-center py-6">אין עסקאות עדיין</p>
        ) : (
          <div className="space-y-2">
            {deals.slice(0, 5).map(deal => {
              const colors = STAGE_COLORS[deal.stage] || STAGE_COLORS['ארכיון'];
              return (
                <div key={deal.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/04 hover:bg-white/07 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors.badge}`}>
                      {deal.stage}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white/90">{deal.title}</p>
                      {deal.contact_name && (
                        <p className="text-xs text-white/40">{deal.contact_name}</p>
                      )}
                    </div>
                  </div>
                  {deal.value ? (
                    <span className="text-sm font-black text-emerald-300">
                      {formatCurrency(deal.value)}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
