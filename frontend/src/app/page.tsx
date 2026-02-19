'use client';

import { useQuery } from '@tanstack/react-query';
import { dealsApi, activitiesApi, contactsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, Users, Handshake, Activity, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const STAGE_COLORS: Record<string, { bar: string; text: string; bg: string }> = {
  'צינון':      { bar: '#94a3b8', text: 'text-slate-300',   bg: 'bg-slate-500/20' },
  'אפיון':      { bar: '#60a5fa', text: 'text-blue-300',    bg: 'bg-blue-500/20' },
  'מחירה':      { bar: '#fbbf24', text: 'text-amber-300',   bg: 'bg-amber-500/20' },
  'סגירה':      { bar: '#a78bfa', text: 'text-purple-300',  bg: 'bg-purple-500/20' },
  'לקוח פעיל': { bar: '#34d399', text: 'text-emerald-300', bg: 'bg-emerald-500/20' },
  'ארכיון':     { bar: '#6b7280', text: 'text-gray-400',    bg: 'bg-gray-500/20' },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  return 'ערב טוב';
}

export default function DashboardPage() {
  const router = useRouter();

  const { data: dealsData,      isLoading: dl } = useQuery({ queryKey: ['deals'],     queryFn: dealsApi.list });
  const { data: contactsData,   isLoading: cl } = useQuery({ queryKey: ['contacts'],  queryFn: () => contactsApi.list() });
  const { data: activitiesData, isLoading: al } = useQuery({ queryKey: ['activities'],queryFn: () => activitiesApi.list() });

  const deals      = dealsData?.data      || [];
  const contacts   = contactsData?.data   || [];
  const activities = (activitiesData?.data || []).slice(0, 6);

  const openDeals   = deals.filter(d => d.stage !== 'ארכיון');
  const totalValue  = openDeals.reduce((s, d) => s + (d.value || 0), 0);
  const activeCount = deals.filter(d => d.stage === 'לקוח פעיל').length;
  const closingCount = deals.filter(d => d.stage === 'סגירה').length;

  const STAGES = ['צינון', 'אפיון', 'מחירה', 'סגירה', 'לקוח פעיל'];
  const stageBreakdown = STAGES.map(stage => ({
    stage,
    count: deals.filter(d => d.stage === stage).length,
    value: deals.filter(d => d.stage === stage).reduce((s, d) => s + (d.value || 0), 0),
  }));
  const maxCount = Math.max(...stageBreakdown.map(s => s.count), 1);

  return (
    <div className="relative z-10 p-4 md:p-6 space-y-5 max-w-2xl mx-auto">

      {/* ── Greeting ── */}
      <div className="pt-2">
        <p className="text-white/40 text-sm">{getGreeting()},</p>
        <h1 className="text-2xl font-black text-white mt-0.5">מורדי דובקין 👋</h1>
        {closingCount > 0 && (
          <div className="mt-2 inline-flex items-center gap-2 bg-purple-500/15 border border-purple-400/25
                          rounded-full px-3 py-1 text-xs text-purple-300">
            🔥 {closingCount} עסקאות בשלב סגירה
          </div>
        )}
      </div>

      {/* ── 4 stat cards ── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'עסקאות פתוחות', value: dl ? '—' : String(openDeals.length), icon: Handshake, color: 'from-blue-500/25 to-blue-600/10', border: 'border-blue-400/20', iconColor: 'text-blue-300' },
          { label: 'סה"כ פייפליין', value: dl ? '—' : formatCurrency(totalValue), icon: TrendingUp, color: 'from-emerald-500/25 to-emerald-600/10', border: 'border-emerald-400/20', iconColor: 'text-emerald-300' },
          { label: 'אנשי קשר', value: cl ? '—' : String(contacts.length), icon: Users, color: 'from-purple-500/25 to-purple-600/10', border: 'border-purple-400/20', iconColor: 'text-purple-300' },
          { label: 'לקוחות פעילים', value: dl ? '—' : String(activeCount), icon: Activity, color: 'from-amber-500/25 to-amber-600/10', border: 'border-amber-400/20', iconColor: 'text-amber-300' },
        ].map(({ label, value, icon: Icon, color, border, iconColor }) => (
          <div key={label}
            className={`bg-gradient-to-br ${color} border ${border} rounded-2xl p-4
                        backdrop-blur-xl flex flex-col gap-3`}
          >
            <div className="flex items-start justify-between">
              <p className="text-[10px] text-white/40 uppercase tracking-wider leading-tight">{label}</p>
              <div className="p-1.5 rounded-lg bg-white/08 shrink-0">
                <Icon size={15} className={iconColor} />
              </div>
            </div>
            <p className="text-2xl font-black text-white leading-none">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Quick actions ── */}
      <div>
        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">פעולות מהירות</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => router.push('/deals')}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl border
                       bg-blue-500/10 border-blue-400/20 active:scale-95 transition-all touch-manipulation"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Plus size={18} className="text-blue-300" />
            </div>
            <span className="text-[11px] text-blue-300 font-semibold">עסקה חדשה</span>
          </button>

          <button
            onClick={() => router.push('/contacts')}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl border
                       bg-purple-500/10 border-purple-400/20 active:scale-95 transition-all touch-manipulation"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Users size={18} className="text-purple-300" />
            </div>
            <span className="text-[11px] text-purple-300 font-semibold">איש קשר</span>
          </button>

          <button
            onClick={() => router.push('/pipeline')}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl border
                       bg-emerald-500/10 border-emerald-400/20 active:scale-95 transition-all touch-manipulation"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Handshake size={18} className="text-emerald-300" />
            </div>
            <span className="text-[11px] text-emerald-300 font-semibold">קנבן</span>
          </button>
        </div>
      </div>

      {/* ── Pipeline breakdown ── */}
      <div className="bg-white/05 border border-white/08 rounded-2xl p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">פייפליין</h2>
          <Link href="/pipeline"
            className="flex items-center gap-1 text-xs text-blue-400 active:opacity-60 transition-opacity">
            לוח קנבן <ArrowLeft size={12} />
          </Link>
        </div>

        {dl ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-8 rounded-lg bg-white/04 animate-pulse" />)}
          </div>
        ) : stageBreakdown.every(s => s.count === 0) ? (
          <p className="text-xs text-white/25 text-center py-4">אין עסקאות עדיין</p>
        ) : (
          <div className="space-y-3">
            {stageBreakdown.map(({ stage, count, value }) => {
              const c = STAGE_COLORS[stage] || STAGE_COLORS['ארכיון'];
              if (count === 0) return null;
              return (
                <div key={stage} className="flex items-center gap-3">
                  <div className="w-16 shrink-0">
                    <span className={`text-[10px] font-semibold ${c.text}`}>{stage}</span>
                  </div>
                  <div className="flex-1 h-2 bg-white/06 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(count / maxCount) * 100}%`, background: c.bar }}
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-20 justify-end">
                    <span className="text-[10px] text-white/40">{count}</span>
                    <span className="text-[10px] font-semibold text-white/60">{formatCurrency(value)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Recent deals ── */}
      <div className="bg-white/05 border border-white/08 rounded-2xl p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">עסקאות אחרונות</h2>
          <Link href="/deals"
            className="flex items-center gap-1 text-xs text-blue-400 active:opacity-60 transition-opacity">
            הכל <ArrowLeft size={12} />
          </Link>
        </div>

        {dl ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-white/04 animate-pulse" />)}
          </div>
        ) : openDeals.length === 0 ? (
          <p className="text-xs text-white/25 text-center py-4">אין עסקאות פתוחות</p>
        ) : (
          <div className="space-y-2">
            {openDeals.slice(0, 5).map(deal => {
              const c = STAGE_COLORS[deal.stage] || STAGE_COLORS['ארכיון'];
              return (
                <Link key={deal.id} href="/deals"
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/03 hover:bg-white/07
                             active:bg-white/10 transition-colors border border-white/05">
                  <div className={`w-1.5 h-10 rounded-full shrink-0`}
                    style={{ background: c.bar }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/90 truncate">{deal.title}</p>
                    <p className="text-xs text-white/35 truncate">
                      {deal.contact_name || '—'} · {deal.stage}
                    </p>
                  </div>
                  {deal.value ? (
                    <span className="text-sm font-black text-emerald-300 shrink-0">
                      {formatCurrency(deal.value)}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Recent activity ── */}
      {!al && activities.length > 0 && (
        <div className="bg-white/05 border border-white/08 rounded-2xl p-4 backdrop-blur-xl">
          <h2 className="text-sm font-bold text-white mb-4">פעילות אחרונה</h2>
          <div className="space-y-2">
            {activities.map(a => (
              <div key={a.id}
                className="flex gap-3 items-start p-2.5 rounded-xl hover:bg-white/04 transition-colors">
                <span className="text-base shrink-0 mt-0.5">
                  {{ call:'📞', email:'📧', meeting:'🤝', note:'📝', other:'📋' }[a.type] || '📋'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/75 truncate">{a.description}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    {a.deal_title || a.contact_name || '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
