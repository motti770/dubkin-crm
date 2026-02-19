'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealsApi, activitiesApi, contactsApi, Deal } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime, cn } from '@/lib/utils';

const STAGES = ['סינון', 'אפיון', 'מכירה', 'סגירה', 'לקוח פעיל', 'ארכיון'];

const STAGE_PILL: Record<string, string> = {
  'סינון':      'bg-slate-100 text-slate-600 border-slate-200',
  'אפיון':      'bg-blue-50 text-blue-600 border-blue-200',
  'מכירה':      'bg-amber-50 text-amber-600 border-amber-200',
  'סגירה':      'bg-purple-50 text-purple-600 border-purple-200',
  'לקוח פעיל': 'bg-emerald-50 text-emerald-600 border-emerald-200',
  'ארכיון':     'bg-gray-50 text-gray-500 border-gray-200',
};

const ACTIVITY_TYPES = [
  { value: 'call', label: 'שיחה', emoji: '📞' },
  { value: 'email', label: 'אימייל', emoji: '📧' },
  { value: 'meeting', label: 'פגישה', emoji: '🤝' },
  { value: 'note', label: 'הערה', emoji: '📝' },
  { value: 'task', label: 'משימה', emoji: '✅' },
];

const ACTIVITY_EMOJIS: Record<string, string> = {
  call: '📞', email: '📧', meeting: '🤝', note: '📝', task: '✅', message: '💬',
};

/* ───── Glass Dialog ───── */
function GlassDialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ───── Add Deal Dialog ───── */
function AddDealDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    contact_id: '',
    value: '',
    stage: 'סינון',
    notes: '',
  });

  const qc = useQueryClient();
  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsApi.list(),
  });
  const contacts = contactsData?.data || [];

  const mutation = useMutation({
    mutationFn: (data: Record<string, string>) => dealsApi.create({
      ...data,
      contact_id: data.contact_id ? parseInt(data.contact_id) : undefined,
      value: data.value ? parseFloat(data.value) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['pipeline'] });
      setOpen(false);
      setForm({ title: '', contact_id: '', value: '', stage: 'סינון', notes: '' });
      onSuccess();
    },
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="glass-panel h-10 w-10 rounded-full flex items-center justify-center text-primary hover:bg-white/80 transition-colors shadow-glass-sm"
      >
        <span className="material-symbols-outlined text-[20px]">add</span>
      </button>

      <GlassDialog open={open} onClose={() => setOpen(false)} title="הוספת עסקה">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 font-medium">שם עסקה *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="תיאור העסקה"
              className="w-full h-10 rounded-xl bg-white/60 border border-slate-200 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-medium">שלב</label>
              <select
                value={form.stage}
                onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/60 border border-slate-200 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              >
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-medium">שווי (₪)</label>
              <input
                type="number"
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                placeholder="0"
                dir="ltr"
                className="w-full h-10 rounded-xl bg-white/60 border border-slate-200 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 font-medium">איש קשר</label>
            <select
              value={form.contact_id}
              onChange={e => setForm(f => ({ ...f, contact_id: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/60 border border-slate-200 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            >
              <option value="">ללא איש קשר</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 font-medium">הערות</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="פרטים נוספים..."
              rows={3}
              className="w-full rounded-xl bg-white/60 border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 rounded-xl text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={!form.title || mutation.isPending}
            className="px-5 py-2 rounded-xl bg-primary hover:bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? 'שומר...' : 'הוסף'}
          </button>
        </div>
        {mutation.isError && (
          <p className="text-sm text-red-500">{(mutation.error as Error).message}</p>
        )}
      </GlassDialog>
    </>
  );
}

/* ───── Deal Detail Panel ───── */
function DealDetail({ deal, onBack }: { deal: Deal; onBack: () => void }) {
  const qc = useQueryClient();
  const [activityForm, setActivityForm] = useState({ type: 'note', description: '' });
  const [addingActivity, setAddingActivity] = useState(false);

  const { data: activitiesData, isLoading: actLoading } = useQuery({
    queryKey: ['activities', deal.id],
    queryFn: () => activitiesApi.list(deal.id),
  });

  const stageMutation = useMutation({
    mutationFn: (stage: string) => dealsApi.updateStage(deal.id, stage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });

  const activityMutation = useMutation({
    mutationFn: () => activitiesApi.create({
      deal_id: deal.id,
      type: activityForm.type,
      description: activityForm.description,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities', deal.id] });
      setActivityForm({ type: 'note', description: '' });
      setAddingActivity(false);
    },
  });

  const activities = activitiesData?.data || [];

  return (
    <div className="pt-6 px-6 pb-6 space-y-5">
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-white/50 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-slate-900">{(deal.name || deal.title || "")}</h1>
          {deal.contact_name && (
            <p className="text-sm text-slate-500">{deal.contact_name}</p>
          )}
        </div>
      </div>

      {/* Deal Info Card */}
      <div className="glass-panel rounded-2xl p-5 space-y-4 shadow-glass">
        <div className="flex items-center justify-between">
          <span className={cn('text-xs px-3 py-1 rounded-full border', STAGE_PILL[deal.stage_display] || STAGE_PILL['ארכיון'])}>
            {deal.stage_display}
          </span>
          {deal.value != null && (
            <span className="text-2xl font-extrabold text-slate-900">{formatCurrency(Number(deal.value) || 0)}</span>
          )}
        </div>

        {/* Change Stage */}
        <div>
          <p className="text-xs text-slate-400 mb-2">שנה שלב</p>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.filter(s => s !== deal.stage_display).map(stage => (
              <button
                key={stage}
                onClick={() => stageMutation.mutate(stage)}
                disabled={stageMutation.isPending}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full border transition-all hover:opacity-80 disabled:opacity-40',
                  STAGE_PILL[stage] || STAGE_PILL['ארכיון']
                )}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-400">
          <span>נוצר {formatDate(deal.created_at)}</span>
        </div>

        {deal.notes && (
          <div>
            <p className="text-xs text-slate-400 mb-1">הערות</p>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{deal.notes}</p>
          </div>
        )}
      </div>

      {/* Activities Section */}
      <div className="glass-panel rounded-2xl p-5 space-y-4 shadow-glass">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">לוג פעילות</h2>
          <button
            onClick={() => setAddingActivity(!addingActivity)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 border border-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            הוסף
          </button>
        </div>

        {/* Add activity form */}
        {addingActivity && (
          <div className="bg-white/60 rounded-xl p-4 space-y-3 border border-slate-200/50">
            <div className="flex gap-2 flex-wrap">
              {ACTIVITY_TYPES.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => setActivityForm(f => ({ ...f, type: value }))}
                  className={cn(
                    'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all',
                    activityForm.type === value
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  )}
                >
                  <span>{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={activityForm.description}
                onChange={e => setActivityForm(f => ({ ...f, description: e.target.value }))}
                placeholder="תיאור הפעילות..."
                className="flex-1 h-10 rounded-xl bg-white/60 border border-slate-200 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                onKeyDown={e => {
                  if (e.key === 'Enter' && activityForm.description) activityMutation.mutate();
                }}
              />
              <button
                onClick={() => activityMutation.mutate()}
                disabled={!activityForm.description || activityMutation.isPending}
                className="px-4 h-10 rounded-xl bg-primary hover:bg-blue-600 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </div>
        )}

        {/* Activity Timeline */}
        {actLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-xl bg-white/40 animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-10">
            <span className="material-symbols-outlined text-slate-300 text-[32px] mb-2 block">chat_bubble_outline</span>
            <p className="text-sm text-slate-400">אין פעילות עדיין</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map(activity => {
              const emoji = ACTIVITY_EMOJIS[activity.type] || '📝';
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 bg-white/50 rounded-xl p-3 hover:bg-white/70 transition-colors"
                >
                  <span className="text-lg mt-0.5">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">{activity.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDateTime(activity.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───── Main Page ───── */
export default function DealsPage() {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [stageFilter, setStageFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => dealsApi.list(),
  });

  const allDeals = data?.data || [];
  const deals = allDeals.filter(d => stageFilter ? d.stage_display === stageFilter : true);

  const totalPipeline = allDeals
    .filter(d => d.stage_display !== 'ארכיון')
    .reduce((sum, d) => sum + (Number(d.value) || 0), 0);

  if (selectedDeal) {
    const currentDeal = allDeals.find(d => d.id === selectedDeal.id) || selectedDeal;
    return <DealDetail deal={currentDeal} onBack={() => setSelectedDeal(null)} />;
  }

  return (
    <div className="pt-8 px-6 pb-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">עסקאות</h1>
          <p className="text-slate-500 text-xs mt-1">{data?.total ?? 0} עסקאות במערכת</p>
        </div>
        <AddDealDialog onSuccess={() => {}} />
      </div>

      {/* Summary Bar */}
      <div className="glass-panel-dark rounded-2xl p-4 flex items-center justify-between shadow-glass">
        <span className="text-sm text-slate-500">סה״כ פייפליין</span>
        <span className="text-xl font-extrabold text-slate-900">{formatCurrency(totalPipeline)}</span>
      </div>

      {/* Stage filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        <button
          onClick={() => setStageFilter('')}
          className={
            !stageFilter
              ? 'whitespace-nowrap bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-medium shadow-md'
              : 'whitespace-nowrap glass-panel px-4 py-2 rounded-full text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 transition-colors'
          }
        >
          הכל
        </button>
        {STAGES.map(stage => {
          const count = allDeals.filter(d => d.stage_display === stage).length;
          return (
            <button
              key={stage}
              onClick={() => setStageFilter(stage === stageFilter ? '' : stage)}
              className={
                stageFilter === stage
                  ? 'whitespace-nowrap bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-medium shadow-md'
                  : 'whitespace-nowrap glass-panel px-4 py-2 rounded-full text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 transition-colors'
              }
            >
              {stage} {count > 0 && <span className="opacity-60">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Deals list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 rounded-2xl glass-card animate-pulse" />
          ))}
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-slate-300 text-[48px] mb-3 block">handshake</span>
          <p className="text-slate-400">אין עסקאות</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deals.map(deal => (
            <div
              key={deal.id}
              onClick={() => setSelectedDeal(deal)}
              className="bg-white/50 border border-white/60 p-4 rounded-2xl hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm font-bold border border-white shrink-0">
                  {(deal.contact_name || (deal.name || deal.title || "")).charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{(deal.name || deal.title || "")}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {deal.contact_name && (
                      <p className="text-xs text-slate-500">{deal.contact_name}</p>
                    )}
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border', STAGE_PILL[deal.stage_display] || STAGE_PILL['ארכיון'])}>
                      {deal.stage_display}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {deal.value ? (
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(Number(deal.value) || 0)}
                  </span>
                ) : null}
                <span className="material-symbols-outlined text-slate-300 text-[18px] group-hover:text-slate-500 transition-colors">
                  chevron_left
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
