'use client';

import { useQuery } from '@tanstack/react-query';
import { dealsApi, Deal } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { Plus, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const STAGE_COLORS: Record<string, string> = {
  'צינון': 'secondary',
  'אפיון': 'info',
  'מחירה': 'warning',
  'סגירה': 'warning',
  'לקוח פעיל': 'success',
  'ארכיון': 'outline',
};

const STAGE_BG: Record<string, string> = {
  'צינון': 'bg-slate-500/10 border-slate-500/20',
  'אפיון': 'bg-sky-500/10 border-sky-500/20',
  'מחירה': 'bg-amber-500/10 border-amber-500/20',
  'סגירה': 'bg-orange-500/10 border-orange-500/20',
  'לקוח פעיל': 'bg-emerald-500/10 border-emerald-500/20',
  'ארכיון': 'bg-secondary/30 border-border',
};

function DealCard({ deal }: { deal: Deal }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 transition-all active:scale-[0.98]',
        STAGE_BG[deal.stage] || 'bg-card border-border'
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 text-right"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={STAGE_COLORS[deal.stage] as any} className="text-xs">
              {deal.stage}
            </Badge>
            {deal.value && (
              <span className="text-sm font-bold text-emerald-400">
                {formatCurrency(deal.value)}
              </span>
            )}
          </div>
          <p className="font-semibold mt-1.5">{deal.title}</p>
          {deal.contact_name && (
            <p className="text-xs text-muted-foreground mt-0.5">{deal.contact_name}</p>
          )}
        </div>
        <div className="shrink-0 text-muted-foreground mt-1">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
          {deal.notes && (
            <p className="text-sm text-muted-foreground">{deal.notes}</p>
          )}
          <div className="flex gap-2">
            <button className="flex-1 text-sm py-2 rounded-xl bg-blue-500/20 text-blue-300 min-h-[40px]">
              עדכן שלב
            </button>
            <button className="flex-1 text-sm py-2 rounded-xl bg-secondary text-muted-foreground min-h-[40px]">
              הוסף פעילות
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DealsPage() {
  const [stageFilter, setStageFilter] = useState<string>('הכל');

  const { data, isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: dealsApi.list,
  });

  const deals = data?.data || [];
  const stages = ['הכל', 'צינון', 'אפיון', 'מחירה', 'סגירה', 'לקוח פעיל'];

  const filtered = stageFilter === 'הכל'
    ? deals.filter((d) => d.stage !== 'ארכיון')
    : deals.filter((d) => d.stage === stageFilter);

  const totalValue = filtered.reduce((s, d) => s + (d.value || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-base font-bold">עסקאות</h1>
            {!isLoading && (
              <p className="text-xs text-muted-foreground">
                {filtered.length} עסקאות · {formatCurrency(totalValue)}
              </p>
            )}
          </div>
          <button className="btn-primary px-3 text-sm min-h-[36px] gap-1.5">
            <Plus size={16} /> הוסף
          </button>
        </div>

        {/* Stage filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {stages.map((stage) => (
            <button
              key={stage}
              onClick={() => setStageFilter(stage)}
              className={cn(
                'whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[32px]',
                stageFilter === stage
                  ? 'bg-blue-500 text-white'
                  : 'bg-secondary text-muted-foreground'
              )}
            >
              {stage}
            </button>
          ))}
        </div>
      </div>

      {/* Deal list */}
      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm">אין עסקאות</p>
          </div>
        ) : (
          filtered.map((deal) => <DealCard key={deal.id} deal={deal} />)
        )}
      </div>
    </div>
  );
}
