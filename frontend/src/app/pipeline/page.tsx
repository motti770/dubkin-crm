'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { pipelineApi, dealsApi, Deal } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { GripVertical, DollarSign } from 'lucide-react';

const STAGES = ['צינון', 'אפיון', 'מחירה', 'סגירה', 'לקוח פעיל', 'ארכיון'];

const STAGE_ACCENT: Record<string, { header: string; bubble: string; gradient: string }> = {
  'צינון':       { header: 'text-slate-300',   bubble: 'bg-slate-500/30 text-slate-300',   gradient: 'from-slate-400/20 to-transparent' },
  'אפיון':      { header: 'text-blue-400',    bubble: 'bg-blue-500/30 text-blue-300',     gradient: 'from-blue-400/20 to-transparent' },
  'מחירה':      { header: 'text-amber-400',   bubble: 'bg-amber-500/30 text-amber-300',   gradient: 'from-amber-400/20 to-transparent' },
  'סגירה':      { header: 'text-purple-400',  bubble: 'bg-purple-500/30 text-purple-300', gradient: 'from-purple-400/20 to-transparent' },
  'לקוח פעיל':  { header: 'text-emerald-400', bubble: 'bg-emerald-500/30 text-emerald-300', gradient: 'from-emerald-400/20 to-transparent' },
  'ארכיון':     { header: 'text-gray-400',    bubble: 'bg-gray-500/30 text-gray-300',     gradient: 'from-gray-400/20 to-transparent' },
};

function DealCard({ deal, isDragging }: { deal: Deal; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: `deal-${deal.id}`,
    data: { type: 'deal', deal },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'rgba(0,0,0,0.2)',
        borderColor: 'rgba(255,255,255,0.1)',
      }}
      className={[
        'rounded-xl p-3 cursor-grab active:cursor-grabbing select-none',
        'border backdrop-blur-md transition-all duration-200',
        'hover:border-white/20 hover:bg-black/30',
        isDragging ? 'opacity-40' : '',
      ].join(' ')}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/90 truncate">{deal.title}</p>
          {deal.contact_name && (
            <p className="text-xs text-white/50 mt-0.5 truncate">{deal.contact_name}</p>
          )}
        </div>
        <GripVertical size={14} className="text-white/20 shrink-0 mt-0.5" />
      </div>
      {deal.value ? (
        <div className="mt-2 flex items-center gap-1">
          <DollarSign size={11} className="text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400">{formatCurrency(deal.value)}</span>
        </div>
      ) : null}
      <div className="mt-2 text-xs text-white/40">
        {formatDate(deal.created_at)}
      </div>
    </div>
  );
}

function StageColumn({
  stage,
  deals,
  activeId,
}: {
  stage: string;
  deals: Deal[];
  activeId: string | null;
}) {
  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const accent = STAGE_ACCENT[stage];

  return (
    <div
      className={[
        'flex flex-col rounded-2xl p-3 min-w-[270px] max-w-[290px]',
        'border backdrop-blur-xl',
      ].join(' ')}
      style={{
        minHeight: 420,
        background: 'rgba(255,255,255,0.06)',
        borderColor: 'rgba(255,255,255,0.12)',
      }}
    >
      {/* Column header with gradient */}
      <div className={`bg-gradient-to-b ${accent.gradient} rounded-xl px-3 py-2.5 mb-3`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-sm font-bold ${accent.header}`}>{stage}</h3>
            {totalValue > 0 && (
              <p className="text-xs text-white/40 mt-0.5">{formatCurrency(totalValue)}</p>
            )}
          </div>
          <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${accent.bubble}`}>
            {deals.length}
          </span>
        </div>
      </div>

      {/* Drop zone */}
      <SortableContext
        items={deals.map(d => `deal-${d.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 flex-1">
          {deals.map(deal => (
            <DealCard
              key={deal.id}
              deal={deal}
              isDragging={activeId === `deal-${deal.id}`}
            />
          ))}
          {deals.length === 0 && (
            <div
              className="flex-1 flex items-center justify-center rounded-xl min-h-[100px]"
              style={{ border: '2px dashed rgba(255,255,255,0.15)' }}
            >
              <p className="text-xs text-white/30">גרור עסקה לכאן</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function PipelinePage() {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

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

  // Build stage map from pipeline data
  const stageMap: Record<string, Deal[]> = {};
  STAGES.forEach(s => { stageMap[s] = []; });
  if (pipeline) {
    pipeline.forEach(({ stage, deals }) => {
      stageMap[stage] = deals || [];
    });
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const deal = active.data.current?.deal as Deal;
    setActiveDeal(deal || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveDeal(null);

    if (!over) return;

    const dealId = parseInt((active.id as string).replace('deal-', ''));
    const overId = over.id as string;

    // Determine target stage
    let targetStage: string | null = null;

    if (overId.startsWith('stage-')) {
      targetStage = overId.replace('stage-', '');
    } else if (overId.startsWith('deal-')) {
      // Find which stage contains the target deal
      const targetDealId = parseInt(overId.replace('deal-', ''));
      for (const [stage, deals] of Object.entries(stageMap)) {
        if (deals.find(d => d.id === targetDealId)) {
          targetStage = stage;
          break;
        }
      }
    }

    if (!targetStage) return;

    // Find current stage of the dragged deal
    let currentStage: string | null = null;
    for (const [stage, deals] of Object.entries(stageMap)) {
      if (deals.find(d => d.id === dealId)) {
        currentStage = stage;
        break;
      }
    }

    if (currentStage === targetStage) return;

    updateStageMutation.mutate({ id: dealId, stage: targetStage });
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handled by dnd-kit automatically
  };

  if (isLoading) {
    return (
      <div className="relative z-10 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">פייפליין</h1>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(s => (
            <div
              key={s}
              className="min-w-[270px] h-96 rounded-2xl backdrop-blur-xl animate-pulse"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">פייפליין</h1>
        <p className="text-white/50 text-sm mt-1">גרור עסקאות בין השלבים</p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="flex gap-4 overflow-x-auto pb-6">
          {STAGES.map(stage => (
            <StageColumn
              key={stage}
              stage={stage}
              deals={stageMap[stage] || []}
              activeId={activeId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal ? (
            <div
              className="rounded-xl p-3 shadow-2xl w-[260px] backdrop-blur-xl"
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '2px solid rgba(59,130,246,0.6)',
                boxShadow: '0 0 20px rgba(59,130,246,0.3), 0 0 60px rgba(59,130,246,0.1)',
              }}
            >
              <p className="text-sm font-medium text-white">{activeDeal.title}</p>
              {activeDeal.contact_name && (
                <p className="text-xs text-white/50">{activeDeal.contact_name}</p>
              )}
              {activeDeal.value ? (
                <p className="text-xs text-emerald-400 mt-1">{formatCurrency(activeDeal.value)}</p>
              ) : null}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
