'use client';

import { useState, useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { GripVertical, MoreHorizontal, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGES = ['צינון', 'אפיון', 'מחירה', 'סגירה', 'לקוח פעיל', 'ארכיון'];

const STAGE_COLORS: Record<string, string> = {
  'צינון': 'bg-slate-500/10 border-slate-500/30',
  'אפיון': 'bg-blue-500/10 border-blue-500/30',
  'מחירה': 'bg-amber-500/10 border-amber-500/30',
  'סגירה': 'bg-orange-500/10 border-orange-500/30',
  'לקוח פעיל': 'bg-emerald-500/10 border-emerald-500/30',
  'ארכיון': 'bg-zinc-500/10 border-zinc-500/30',
};

const STAGE_HEADER_COLORS: Record<string, string> = {
  'צינון': 'text-slate-400',
  'אפיון': 'text-blue-400',
  'מחירה': 'text-amber-400',
  'סגירה': 'text-orange-400',
  'לקוח פעיל': 'text-emerald-400',
  'ארכיון': 'text-zinc-400',
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
      style={style}
      className={cn(
        'bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing select-none',
        'hover:border-primary/40 transition-colors',
        isDragging && 'opacity-50'
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{deal.title}</p>
          {deal.contact_name && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{deal.contact_name}</p>
          )}
        </div>
        <GripVertical size={14} className="text-muted-foreground/40 shrink-0 mt-0.5" />
      </div>
      {deal.value ? (
        <div className="mt-2 flex items-center gap-1">
          <DollarSign size={11} className="text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400">{formatCurrency(deal.value)}</span>
        </div>
      ) : null}
      <div className="mt-2 text-xs text-muted-foreground">
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

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border p-3 min-w-[260px] max-w-[280px]',
        STAGE_COLORS[stage]
      )}
      style={{ minHeight: 400 }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className={cn('text-sm font-semibold', STAGE_HEADER_COLORS[stage])}>{stage}</h3>
          {totalValue > 0 && (
            <p className="text-xs text-muted-foreground">{formatCurrency(totalValue)}</p>
          )}
        </div>
        <span className="text-xs bg-secondary text-muted-foreground rounded-full px-2 py-0.5">
          {deals.length}
        </span>
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
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border/40 rounded-lg min-h-[80px]">
              <p className="text-xs text-muted-foreground/50">גרור עסקה לכאן</p>
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
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">פייפליין</h1>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(s => (
            <div key={s} className="min-w-[260px] h-96 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">פייפליין</h1>
        <p className="text-muted-foreground text-sm mt-1">גרור עסקאות בין השלבים</p>
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
            <div className="bg-card border border-primary/60 rounded-lg p-3 shadow-xl w-[260px]">
              <p className="text-sm font-medium">{activeDeal.title}</p>
              {activeDeal.contact_name && (
                <p className="text-xs text-muted-foreground">{activeDeal.contact_name}</p>
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
