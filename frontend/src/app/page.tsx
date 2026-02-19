'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { dealsApi, activitiesApi, contactsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Users,
  Handshake,
  Bell,
  BellOff,
  Plus,
  ArrowUpRight,
  Clock,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { requestPushPermission, scheduleFollowUpReminders } from '@/lib/push';

const STAGE_COLORS: Record<string, string> = {
  'צינון': 'secondary',
  'אפיון': 'info',
  'מחירה': 'warning',
  'סגירה': 'warning',
  'לקוח פעיל': 'success',
  'ארכיון': 'outline',
};

const ACTIVITY_ICONS: Record<string, string> = {
  call: '📞',
  email: '📧',
  meeting: '🤝',
  note: '📝',
  task: '✅',
};

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  iconBg,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  loading?: boolean;
}) {
  return (
    <div className="stat-card flex items-center gap-3">
      <div className={cn('p-2.5 rounded-xl shrink-0', iconBg)}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        {loading ? (
          <div className="h-6 w-20 skeleton mt-1" />
        ) : (
          <p className="text-xl font-bold mt-0.5 truncate">{value}</p>
        )}
      </div>
    </div>
  );
}

// ── Follow-Up Item ────────────────────────────────────────────────────────────
function FollowUpItem({ deal }: { deal: { title: string; value?: number; contact_name?: string } }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 active:bg-secondary/70 transition-colors">
      <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{deal.title}</p>
        {deal.contact_name && (
          <p className="text-xs text-muted-foreground">{deal.contact_name}</p>
        )}
      </div>
      {deal.value ? (
        <span className="text-sm font-semibold text-emerald-400 shrink-0">
          {formatCurrency(deal.value)}
        </span>
      ) : null}
    </div>
  );
}

// ── Push Notification Banner ─────────────────────────────────────────────────
function PushBanner({ onDismiss }: { onDismiss: () => void }) {
  const [requesting, setRequesting] = useState(false);

  async function handleEnable() {
    setRequesting(true);
    await requestPushPermission();
    setRequesting(false);
    onDismiss();
  }

  return (
    <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 flex items-start gap-3">
      <Bell size={20} className="text-blue-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-semibold">הפעל התראות</p>
        <p className="text-xs text-muted-foreground mt-0.5">קבל תזכורות על follow-ups ולידים חדשים</p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleEnable}
            disabled={requesting}
            className="btn-primary text-sm px-4 min-h-[38px]"
          >
            {requesting ? 'מאשר…' : 'הפעל'}
          </button>
          <button
            onClick={onDismiss}
            className="text-xs text-muted-foreground hover:text-foreground px-3 min-h-[38px]"
          >
            אחר כך
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [showPushBanner, setShowPushBanner] = useState(false);
  const [greeting, setGreeting] = useState('שלום');

  // Time-based greeting
  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('בוקר טוב');
    else if (h < 17) setGreeting('צהריים טובים');
    else setGreeting('ערב טוב');
  }, []);

  // Show push banner if not yet decided
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const dismissed = sessionStorage.getItem('push-banner-dismissed');
        if (!dismissed) setShowPushBanner(true);
      }
    }
  }, []);

  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: dealsApi.list,
  });
  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsApi.list(),
  });
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activitiesApi.list(),
  });

  const deals = dealsData?.data || [];
  const contacts = contactsData?.data || [];
  const activities = (activitiesData?.data || []).slice(0, 6);

  const openDeals = deals.filter((d: any) => d.stage !== 'ארכיון');
  const totalValue = openDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
  const closedThisMonth = deals.filter((d: any) => {
    if (d.stage !== 'לקוח פעיל') return false;
    const updated = new Date(d.updated_at || d.created_at);
    const now = new Date();
    return updated.getMonth() === now.getMonth() && updated.getFullYear() === now.getFullYear();
  });

  // Follow-ups today: deals with follow_up_date = today
  const today = new Date().toDateString();
  const followUpsToday = deals.filter((d: any) => {
    if (!d.follow_up_date) return false;
    return new Date(d.follow_up_date).toDateString() === today;
  });

  // Stage breakdown
  const stages = ['צינון', 'אפיון', 'מחירה', 'סגירה', 'לקוח פעיל'];
  const stageBreakdown = stages.map((stage) => ({
    stage,
    count: deals.filter((d: any) => d.stage === stage).length,
    value: deals.filter((d: any) => d.stage === stage).reduce((s: number, d: any) => s + (d.value || 0), 0),
  }));

  // Schedule notifications when data is ready
  useEffect(() => {
    if (deals.length > 0) {
      scheduleFollowUpReminders(deals);
    }
  }, [deals]);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">{greeting}, מורדי 👋</h1>
          {!dealsLoading && followUpsToday.length > 0 && (
            <p className="text-xs text-blue-400 mt-0.5">
              יש לך {followUpsToday.length} follow-ups להיום
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
            מ
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">

        {/* ── Push Notification Banner ── */}
        {showPushBanner && (
          <PushBanner onDismiss={() => {
            setShowPushBanner(false);
            sessionStorage.setItem('push-banner-dismissed', '1');
          }} />
        )}

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-1 gap-3">
          <StatCard
            label="💰 סה״כ בפייפליין"
            value={formatCurrency(totalValue)}
            icon={<TrendingUp size={20} className="text-emerald-400" />}
            iconBg="bg-emerald-500/10"
            loading={dealsLoading}
          />
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="📈 עסקאות פתוחות"
              value={openDeals.length}
              icon={<Handshake size={18} className="text-blue-400" />}
              iconBg="bg-blue-500/10"
              loading={dealsLoading}
            />
            <StatCard
              label="✅ סגורות החודש"
              value={closedThisMonth.length}
              icon={<CheckCircle2 size={18} className="text-purple-400" />}
              iconBg="bg-purple-500/10"
              loading={dealsLoading}
            />
          </div>
          <StatCard
            label="👥 אנשי קשר"
            value={contacts.length}
            icon={<Users size={20} className="text-amber-400" />}
            iconBg="bg-amber-500/10"
            loading={contactsLoading}
          />
        </div>

        {/* ── Follow-Ups Today ── */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-blue-400" />
              <h2 className="text-sm font-semibold">follow-ups להיום</h2>
              {!dealsLoading && followUpsToday.length > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                  {followUpsToday.length}
                </span>
              )}
            </div>
            <Link href="/deals" className="text-xs text-blue-400 flex items-center gap-1">
              הכל <ArrowUpRight size={12} />
            </Link>
          </div>

          {dealsLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-14 skeleton" />)}
            </div>
          ) : followUpsToday.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">
              🎉 אין follow-ups להיום!
            </p>
          ) : (
            <div className="space-y-2">
              {followUpsToday.slice(0, 5).map((deal: any) => (
                <FollowUpItem key={deal.id} deal={deal} />
              ))}
            </div>
          )}

          {/* Add Deal CTA */}
          <Link
            href="/deals/new"
            className="btn-primary w-full text-sm mt-2"
          >
            <Plus size={18} />
            הוסף עסקה
          </Link>
        </div>

        {/* ── Pipeline Breakdown ── */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">פירוט פייפליין</h2>
            <Link href="/pipeline" className="text-xs text-blue-400 flex items-center gap-1">
              לוח קנבן <ArrowUpRight size={12} />
            </Link>
          </div>

          {dealsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-8 skeleton" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {stageBreakdown.filter(s => s.count > 0).map(({ stage, count, value }) => {
                const maxCount = Math.max(...stageBreakdown.map((s) => s.count), 1);
                const pct = (count / maxCount) * 100;
                return (
                  <div key={stage}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={STAGE_COLORS[stage] as any} className="text-xs px-2 py-0.5">
                          {stage}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{count} עסקאות</span>
                      </div>
                      <span className="text-xs font-semibold">{formatCurrency(value)}</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500/70 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Recent Activity ── */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">פעילות אחרונה</h2>
          </div>

          {activitiesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 skeleton" />)}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">אין פעילות עדיין</p>
          ) : (
            <div className="divide-y divide-border">
              {activities.map((activity: any) => (
                <div key={activity.id} className="flex gap-3 items-start py-2.5 first:pt-0 last:pb-0">
                  <span className="text-lg shrink-0">{ACTIVITY_ICONS[activity.type] || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activity.deal_title || activity.contact_name || '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom spacing for safe area */}
        <div className="h-2" />
      </div>
    </div>
  );
}
