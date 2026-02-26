'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pipelineApi, dealsApi, Deal, PipelineStage } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

// צבעים קבועים לשלבים ידועים — fallback לשאר
const KNOWN_COLORS: Record<string, { bg: string; text: string; dot: string; headerBg: string }> = {
  'ליד':            { bg: 'bg-slate-50',   text: 'text-slate-700',   dot: 'bg-slate-400',   headerBg: 'bg-slate-100' },
  'סינון':          { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500',     headerBg: 'bg-red-100' },
  'הדגמה':          { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   headerBg: 'bg-amber-100' },
  'Onboarding':     { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    headerBg: 'bg-blue-100' },
  'לקוח פעיל':      { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', headerBg: 'bg-emerald-100' },
  'חידוש / Upsell': { bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500',  headerBg: 'bg-purple-100' },
  'ארכיון':         { bg: 'bg-gray-50',    text: 'text-gray-600',    dot: 'bg-gray-400',    headerBg: 'bg-gray-100' },
};
const FALLBACK_COLOR = { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-400', headerBg: 'bg-slate-100' };

function getColor(stageName: string) {
  return KNOWN_COLORS[stageName] || FALLBACK_COLOR;
}

function DealCard({
  deal,
  currentStage,
  allStages,
  onMoveStage,
  isPending,
  index,
}: {
  deal: Deal;
  currentStage: string;
  allStages: { id: number; display_name: string }[];
  onMoveStage: (dealId: number, stageId: number) => void;
  isPending: boolean;
  index: number;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <Link
      href={`/deals/${deal.id}`}
      className="block bg-white/80 p-3 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-white/60 hover:scale-[1.01] active:scale-[0.99] fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={e => { if (showActions) e.preventDefault(); }}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm font-bold border border-white shrink-0">
          {(deal.contact_name || deal.name || '').charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-slate-900 font-bold text-sm truncate">{deal.contact_name || deal.name || ''}</h4>
          <p className="text-slate-500 text-xs truncate">{deal.name || ''}</p>
        </div>
        {deal.value ? (
          <span className="text-slate-900 font-bold text-sm shrink-0">{formatCurrency(Number(deal.value) || 0)}</span>
        ) : null}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); setShowActions(!showActions); }}
          className="text-[10px] text-primary font-medium hover:underline"
        >
          {showActions ? 'סגור' : 'העבר שלב'}
        </button>
      </div>

      {showActions && (
        <div className="mt-2 flex gap-1 flex-wrap">
          {allStages.filter(s => s.display_name !== currentStage).map(s => {
            const c = getColor(s.display_name);
            return (
              <button
                key={s.id}
                onClick={e => { e.preventDefault(); e.stopPropagation(); onMoveStage(deal.id, s.id); }}
                disabled={isPending}
                className={`text-[10px] px-2 py-1 rounded-full ${c.headerBg} ${c.text} font-medium hover:opacity-80 transition-all duration-200 disabled:opacity-40`}
              >
                {s.display_name}
              </button>
            );
          })}
        </div>
      )}
    </Link>
  );
}

function StageColumn({
  stageData,
  allStages,
  onMoveStage,
  isPending,
}: {
  stageData: PipelineStage;
  allStages: { id: number; display_name: string }[];
  onMoveStage: (dealId: number, stageId: number) => void;
  isPending: boolean;
}) {
  const stageName = stageData.stage.display_name;
  const c = getColor(stageName);

  return (
    <div className="glass-panel rounded-2xl min-w-[260px] md:min-w-0 md:flex-1 flex flex-col shadow-glass">
      {/* Header */}
      <div className={`${c.headerBg} rounded-t-2xl px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
          <h3 className={`text-sm font-bold ${c.text}`}>{stageName}</h3>
        </div>
        <div className="flex items-center gap-2">
          {stageData.total_value > 0 && (
            <span className="text-[10px] text-slate-500">{formatCurrency(stageData.total_value)}</span>
          )}
          <span className={`text-xs font-bold ${c.text} ${c.headerBg} px-2 py-0.5 rounded-full`}>
            {stageData.deal_count}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="p-3 flex flex-col gap-2 flex-1 min-h-[200px] md:min-h-[300px]">
        {stageData.deals.map((deal, i) => (
          <DealCard
            key={deal.id}
            deal={deal}
            currentStage={stageName}
            allStages={allStages}
            onMoveStage={onMoveStage}
            isPending={isPending}
            index={i}
          />
        ))}
        {stageData.deals.length === 0 && (
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

  const { data: pipeline, isLoading, isError, refetch } = useQuery({
    queryKey: ['pipeline'],
    queryFn: () => pipelineApi.get(),
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stageId }: { id: number; stageId: number }) =>
      dealsApi.updateStage(id, stageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline'] });
      qc.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const allStages = (pipeline || []).map(p => ({ id: p.stage.id, display_name: p.stage.display_name }));

  const handleMoveStage = (dealId: number, stageId: number) => {
    updateStageMutation.mutate({ id: dealId, stageId });
  };

  if (isError) {
    return (
      <div className="pt-8 px-4 pb-24 md:pb-8 page-enter">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">פייפליין</h1>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[300px] glass-panel rounded-2xl gap-4">
          <span className="text-4xl">⚠️</span>
          <p className="text-slate-700 font-semibold">לא הצלחנו לטעון את הפייפליין</p>
          <p className="text-slate-400 text-sm">בעיה בתקשורת עם השרת</p>
          <button
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-8 px-2 md:px-0 pb-24 md:pb-8 page-enter">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">פייפליין</h1>
        <p className="text-slate-500 text-sm mt-1">ניהול שלבי העסקאות</p>
      </div>

      {isLoading ? (
        <div className="flex md:grid md:grid-cols-6 gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="min-w-[260px] md:min-w-0 h-80 rounded-2xl glass-panel animate-pulse snap-start" />
          ))}
        </div>
      ) : (
        <div
          className="flex md:grid gap-4 overflow-x-auto pb-6 no-scrollbar snap-x"
          style={{ gridTemplateColumns: `repeat(${(pipeline || []).length}, minmax(0, 1fr))` }}
        >
          {(pipeline || []).map(stageData => (
            <StageColumn
              key={stageData.stage.id}
              stageData={stageData}
              allStages={allStages}
              onMoveStage={handleMoveStage}
              isPending={updateStageMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
