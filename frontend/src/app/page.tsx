'use client';

import { useQuery } from '@tanstack/react-query';
import { dealsApi, activitiesApi, contactsApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Users,
  Handshake,
  Activity,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

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

export default function DashboardPage() {
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
  const activities = (activitiesData?.data || []).slice(0, 8);

  const openDeals = deals.filter(d => d.stage !== 'ארכיון');
  const totalValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const activeClients = deals.filter(d => d.stage === 'לקוח פעיל').length;
  const closingDeals = deals.filter(d => d.stage === 'סגירה').length;

  // Stage breakdown
  const stages = ['צינון', 'אפיון', 'מחירה', 'סגירה', 'לקוח פעיל'];
  const stageBreakdown = stages.map(stage => ({
    stage,
    count: deals.filter(d => d.stage === stage).length,
    value: deals.filter(d => d.stage === stage).reduce((s, d) => s + (d.value || 0), 0),
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">דשבורד</h1>
        <p className="text-muted-foreground text-sm mt-1">סקירה כללית של העסק</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">עסקאות פתוחות</p>
                <p className="text-2xl font-bold mt-1">
                  {dealsLoading ? '...' : openDeals.length}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Handshake size={20} className="text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">סה"כ בפייפליין</p>
                <p className="text-xl font-bold mt-1">
                  {dealsLoading ? '...' : formatCurrency(totalValue)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <TrendingUp size={20} className="text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">אנשי קשר</p>
                <p className="text-2xl font-bold mt-1">
                  {contactsLoading ? '...' : contacts.length}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Users size={20} className="text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">לקוחות פעילים</p>
                <p className="text-2xl font-bold mt-1">
                  {dealsLoading ? '...' : activeClients}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Activity size={20} className="text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">פירוט פייפליין</CardTitle>
              <Link href="/pipeline" className="text-xs text-primary flex items-center gap-1 hover:underline">
                לוח קנבן <ArrowUpRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {dealsLoading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-10 rounded bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {stageBreakdown.map(({ stage, count, value }) => {
                  const maxCount = Math.max(...stageBreakdown.map(s => s.count), 1);
                  const pct = count / maxCount * 100;
                  return (
                    <div key={stage}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={STAGE_COLORS[stage] as any} className="text-xs">
                            {stage}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{count} עסקאות</span>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(value)}</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">פעילות אחרונה</CardTitle>
              <Clock size={14} className="text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-12 rounded bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">אין פעילות עדיין</p>
            ) : (
              <div className="space-y-3">
                {activities.map(activity => (
                  <div key={activity.id} className="flex gap-3 items-start">
                    <span className="text-base mt-0.5">{ACTIVITY_ICONS[activity.type] || '📋'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {activity.deal_title || activity.contact_name || '—'} · {formatDateTime(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Deals */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">עסקאות אחרונות</CardTitle>
            <Link href="/deals" className="text-xs text-primary flex items-center gap-1 hover:underline">
              כל העסקאות <ArrowUpRight size={12} />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {dealsLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-12 rounded bg-muted/30 animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {deals.slice(0, 5).map(deal => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 hover:bg-secondary/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={STAGE_COLORS[deal.stage] as any} className="text-xs shrink-0">
                      {deal.stage}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{deal.title}</p>
                      {deal.contact_name && (
                        <p className="text-xs text-muted-foreground">{deal.contact_name}</p>
                      )}
                    </div>
                  </div>
                  {deal.value ? (
                    <span className="text-sm font-semibold text-emerald-400">
                      {formatCurrency(deal.value)}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
