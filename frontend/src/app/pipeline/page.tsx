'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pipelineApi, dealsApi, Deal } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const STAGES = ['סינון', 'אפיון', 'מכירה', 'סגירה', 'לקוח פעיל', 'ארכיון'];

const STAGE_COLORS: Record<string, { bg: string; text: string; dot: string; headerBg: string }> = {
  'סינון':       { bg: 'bg-slate-50',   text: 'text-slate-700',   dot: 'bg-slate-400',   headerBg: 'bg-slate-100' },
  'אפיון':      { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    headerBg: 'bg-blue-100' },
  'מכירה':      { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   headerBg: 'bg-amber-100' },
  'סגירה':      { bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500',  headerBg: 'bg-purple-100' },
  'לקוח פעיל':  { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', headerBg: 'bg-emerald-100' },
  'ארכיון':     { bg: 'bg-gray-50',    text: 'text-gray-600',    dot: 'bg-gray-400',    headerBg: 'bg-gray-100' },
};

function DealCard({
  deal,
  onMoveStage,
  isPending,
}: {
  deal: Deal;
  onMoveStage: (dealId: number, stage: string) => void;
  isPending: boolean;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="bg-white/80 p-3 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-white/60">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm font-bold border border-white shrink-0">
          {(deal.contact_name || (deal.name || deal.title || "")).charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-slate-900 font-bold text-sm truncate">{deal.contact_name || (deal.name || deal.title || "")}</h4>
          <p className="text-slate-500 text-xs truncate">{(deal.name || deal.title || "")}</p>
        </div>
        {deal.value ? (
          <span className="text-slate-900 font-bold text-sm shrink-0">{formatCurrency(Number(deal.value) || 0)}</span>
        ) : null}
      </div>

      {/* Move actions */}
      <div className="mt-2 flex items-center justify-between">
        <button
          onClick={() => setShowActions(!showActions)}
          className="text-[10px] text-primary font-medium hover:underline"
        >
          {showActions ? 'סגור' : 'העבר שלב'}
        </button>
      </div>

      {showActions && (
        <div className="mt-2 flex gap-1 flex-wrap">
          {STAGES.filter(s => s !== deal.stage_display).map(stage => {
            const c = STAGE_COLORS[stage] || STAGE_COLORS['ארכיון'];
            return (
              <button
                key={stage}
                onClick={() => onMoveStage(deal.id, stage)}
                disabled={isPending}
                className={`text-[10px] px-2 py-1 rounded-full ${c.headerBg} ${c.text} font-medium hover:opacity-80 transition-opacity disabled:opacity-40`}
              >
                {stage}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StageColumn({
  stage,
  deals,
  onMoveStage,
  isPending,
}: {
  stage: string;
  deals: Deal[];
  onMoveStage: (dealId: number, stage: string) => void;
  isPending: boolean;
}) {
  const totalValue = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const c = STAGE_COLORS[stage] || STAGE_COLORS['ארכיון'];

  return (
    <div className="glass-panel rounded-2xl min-w-[280px] max-w-[300px] flex flex-col shadow-glass">
      {/* Header */}
      <div className={`${c.headerBg} rounded-t-2xl px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
          <h3 className={`text-sm font-bold ${c.text}`}>{stage}</h3>
        </div>
        <div className="flex items-center gap-2">
          {totalValue > 0 && (
            <span className="text-[10px] text-slate-500">{formatCurrency(totalValue)}</span>
          )}
          <span className={`text-xs font-bold ${c.text} ${c.headerBg} px-2 py-0.5 rounded-full`}>
            {deals.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="p-3 flex flex-col gap-2 flex-1 min-h-[200px]">
        {deals.map(deal => (
          <DealCard key={deal.id} deal={deal} onMoveStage={onMoveStage} isPending={isPending} />
        ))}
        {deals.length === 0 && (
          <div className="flex-1 flex items-center justify-center rounded-xl min-h-[100px] border-2 border-dashed border-slate-200">
            <p className="text-xs text-slate-400">אין עסקאות</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const qc = useQueryClient();

  const { data: pipeline, isLoading } = useQuery({
    queryKey: ['pipeline'],
    queryFn: pipelineApi.get,
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: number; stage: string }) =>
      dealsApi.updateStage(id, stage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline'] });
      qc.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const stageMap: Record<string, Deal[]> = {};
  STAGES.forEach(s => { stageMap[s] = []; });
  if (pipeline) {
    pipeline.forEach(({ stage, deals }) => {
      stageMap[stage] = deals || [];
    });
  }

  const handleMoveStage = (dealId: number, stage: string) => {
    updateStageMutation.mutate({ id: dealId, stage });
  };

  return (
    <div className="pt-8 px-6 pb-24 max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">פייפליין</h1>
        <p className="text-slate-500 text-sm mt-1">ניהול שלבי העסקאות</p>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
          {STAGES.map(s => (
            <div key={s} className="min-w-[280px] h-80 rounded-2xl glass-panel animate-pulse snap-start" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar snap-x">
          {STAGES.map(stage => (
            <StageColumn
              key={stage}
              stage={stage}
              deals={stageMap[stage] || []}
              onMoveStage={handleMoveStage}
              isPending={updateStageMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
