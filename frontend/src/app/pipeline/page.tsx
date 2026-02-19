'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pipelineApi, dealsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGES = ['צינון', 'אפיון', 'מחירה', 'סגירה', 'לקוח פעיל'];

const STAGE_COLORS: Record<string, string> = {
  'צינון': 'bg-slate-500/20 text-slate-300',
  'אפיון': 'bg-sky-500/20 text-sky-300',
  'מחירה': 'bg-amber-500/20 text-amber-300',
  'סגירה': 'bg-orange-500/20 text-orange-300',
  'לקוח פעיל': 'bg-emerald-500/20 text-emerald-300',
};

export default function PipelinePage() {
  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const queryClient = useQueryClient();

  const { data: pipeline = [], isLoading } = useQuery({
    queryKey: ['pipeline'],
    queryFn: pipelineApi.get,
  });

  const moveStage = useMutation({
    mutationFn: ({ id, stage }: { id: number; stage: string }) =>
      dealsApi.updateStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const currentStage = STAGES[activeStageIdx];
  const stageData = pipeline.find((p) => p.stage === currentStage);
  const deals = stageData?.deals || [];

  const totalValue = deals.reduce((s, d) => s + (d.value || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <h1 className="text-base font-bold">פייפליין מכירות</h1>
        <p className="text-xs text-muted-foreground mt-0.5">החלק בין השלבים</p>
      </div>

      {/* Stage Tabs (scrollable) */}
      <div className="flex overflow-x-auto gap-2 px-4 py-3 scrollbar-hide">
        {STAGES.map((stage, i) => {
          const count = pipeline.find((p) => p.stage === stage)?.deals.length || 0;
          return (
            <button
              key={stage}
              onClick={() => setActiveStageIdx(i)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all min-h-[36px]',
                activeStageIdx === i
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-card border border-border text-muted-foreground'
              )}
            >
              {stage}
              {count > 0 && (
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs font-bold',
                  activeStageIdx === i ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground'
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Navigation arrows + summary */}
      <div className="flex items-center justify-between px-4 pb-2">
        <button
          onClick={() => setActiveStageIdx(Math.max(0, activeStageIdx - 1))}
          disabled={activeStageIdx === 0}
          className="p-2 rounded-lg disabled:opacity-30 hover:bg-secondary active:bg-secondary/70 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ChevronRight size={20} />
        </button>

        <div className="text-center">
          <div className={cn('inline-block px-3 py-1 rounded-lg text-xs font-medium', STAGE_COLORS[currentStage])}>
            {currentStage}
          </div>
          {deals.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {deals.length} עסקאות · {formatCurrency(totalValue)}
            </p>
          )}
        </div>

        <button
          onClick={() => setActiveStageIdx(Math.min(STAGES.length - 1, activeStageIdx + 1))}
          disabled={activeStageIdx === STAGES.length - 1}
          className="p-2 rounded-lg disabled:opacity-30 hover:bg-secondary active:bg-secondary/70 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Deal Cards */}
      <div className="px-4 pb-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">אין עסקאות בשלב זה</p>
          </div>
        ) : (
          deals.map((deal) => (
            <div
              key={deal.id}
              className="rounded-2xl border border-border bg-card p-4 space-y-3 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{deal.title}</p>
                  {deal.contact_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">{deal.contact_name}</p>
                  )}
                </div>
                {deal.value ? (
                  <span className="text-sm font-bold text-emerald-400 shrink-0">
                    {formatCurrency(deal.value)}
                  </span>
                ) : null}
              </div>

              {/* Move to stage buttons */}
              <div className="flex gap-2 flex-wrap">
                {activeStageIdx > 0 && (
                  <button
                    onClick={() => moveStage.mutate({ id: deal.id, stage: STAGES[activeStageIdx - 1] })}
                    className="text-xs px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground min-h-[36px]"
                  >
                    ← {STAGES[activeStageIdx - 1]}
                  </button>
                )}
                {activeStageIdx < STAGES.length - 1 && (
                  <button
                    onClick={() => moveStage.mutate({ id: deal.id, stage: STAGES[activeStageIdx + 1] })}
                    className="text-xs px-3 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 min-h-[36px]"
                  >
                    {STAGES[activeStageIdx + 1]} →
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
