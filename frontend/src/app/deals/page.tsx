'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealsApi, activitiesApi, contactsApi, Deal, Activity } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime, cn } from '@/lib/utils';
import {
  Plus,
  ChevronLeft,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  CheckSquare,
  FileText,
  Handshake,
  X,
  Send,
} from 'lucide-react';

const STAGES = ['צינון', 'אפיון', 'מחירה', 'סגירה', 'לקוח פעיל', 'ארכיון'];

const STAGE_PILL: Record<string, string> = {
  'צינון':      'bg-slate-500/20 text-slate-300 border-slate-500/30',
  'אפיון':      'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'מחירה':      'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'סגירה':      'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'לקוח פעיל': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'ארכיון':     'bg-gray-600/20 text-gray-400 border-gray-600/30',
};

const ACTIVITY_TYPES = [
  { value: 'call', label: 'שיחה', icon: Phone, emoji: '📞' },
  { value: 'email', label: 'אימייל', icon: Mail, emoji: '📧' },
  { value: 'meeting', label: 'פגישה', icon: Handshake, emoji: '🤝' },
  { value: 'note', label: 'הערה', icon: FileText, emoji: '📝' },
  { value: 'task', label: 'משימה', icon: CheckSquare, emoji: '✅' },
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[rgba(10,20,50,0.95)] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X size={16} />
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
    stage: 'צינון',
    notes: '',
  });

  const qc = useQueryClient();
  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsApi.list(),
  });
  const contacts = contactsData?.data || [];

  const mutation = useMutation({
    mutationFn: (data: any) => dealsApi.create({
      ...data,
      contact_id: data.contact_id ? parseInt(data.contact_id) : undefined,
      value: data.value ? parseFloat(data.value) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['pipeline'] });
      setOpen(false);
      setForm({ title: '', contact_id: '', value: '', stage: 'צינון', notes: '' });
      onSuccess();
    },
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-400/30"
      >
        <Plus size={16} />
        עסקה חדשה
      </button>

      <GlassDialog open={open} onClose={() => setOpen(false)} title="הוספת עסקה">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-white/50">שם עסקה *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="תיאור העסקה"
              className="w-full h-10 rounded-xl bg-white/6 border border-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/50">שלב</label>
              <select
                value={form.stage}
                onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/6 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              >
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/50">שווי (₪)</label>
              <input
                type="number"
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                placeholder="0"
                dir="ltr"
                className="w-full h-10 rounded-xl bg-white/6 border border-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-white/50">איש קשר</label>
            <select
              value={form.contact_id}
              onChange={e => setForm(f => ({ ...f, contact_id: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/6 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
            >
              <option value="">ללא איש קשר</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-white/50">הערות</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="פרטים נוספים..."
              rows={3}
              className="w-full rounded-xl bg-white/6 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={!form.title || mutation.isPending}
            className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? 'שומר...' : 'הוסף'}
          </button>
        </div>
        {mutation.isError && (
          <p className="text-sm text-red-400">{(mutation.error as Error).message}</p>
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
    <div className="relative z-10 p-5 space-y-5 max-w-3xl mx-auto">
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-white">{deal.title}</h1>
          {deal.contact_name && (
            <p className="text-sm text-white/50">{deal.contact_name}</p>
          )}
        </div>
      </div>

      {/* Deal Info Card */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className={cn('text-xs px-3 py-1 rounded-full border', STAGE_PILL[deal.stage] || STAGE_PILL['ארכיון'])}>
            {deal.stage}
          </span>
          {deal.value != null && (
            <span className="text-2xl font-black text-emerald-300">{formatCurrency(deal.value)}</span>
          )}
        </div>

        {/* Change Stage */}
        <div>
          <p className="text-xs text-white/40 mb-2">שנה שלב</p>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.filter(s => s !== deal.stage).map(stage => (
              <button
                key={stage}
                onClick={() => stageMutation.mutate(stage)}
                disabled={stageMutation.isPending}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full border transition-all',
                  STAGE_PILL[stage] || STAGE_PILL['ארכיון'],
                  'hover:brightness-125 disabled:opacity-40'
                )}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-white/40">
          <span>נוצר {formatDate(deal.created_at)}</span>
        </div>

        {deal.notes && (
          <div>
            <p className="text-xs text-white/40 mb-1">הערות</p>
            <p className="text-sm text-white/70 whitespace-pre-wrap">{deal.notes}</p>
          </div>
        )}
      </div>

      {/* Activities Section */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">לוג פעילות</h2>
          <button
            onClick={() => setAddingActivity(!addingActivity)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 text-xs font-medium hover:bg-blue-500/30 border border-blue-500/20 transition-colors"
          >
            <Plus size={13} />
            הוסף
          </button>
        </div>

        {/* Add activity form */}
        {addingActivity && (
          <div className="bg-[rgba(255,255,255,0.04)] rounded-xl p-4 space-y-3 border border-white/5">
            <div className="flex gap-2 flex-wrap">
              {ACTIVITY_TYPES.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => setActivityForm(f => ({ ...f, type: value }))}
                  className={cn(
                    'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all',
                    activityForm.type === value
                      ? 'border-blue-500/40 bg-blue-500/20 text-blue-300'
                      : 'border-white/10 text-white/50 hover:bg-white/10'
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
                className="flex-1 h-10 rounded-xl bg-white/6 border border-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
                onKeyDown={e => {
                  if (e.key === 'Enter' && activityForm.description) activityMutation.mutate();
                }}
              />
              <button
                onClick={() => activityMutation.mutate()}
                disabled={!activityForm.description || activityMutation.isPending}
                className="px-4 h-10 rounded-xl bg-blue-500 hover:bg-blue-400 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Activity Timeline */}
        {actLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-14 rounded-xl bg-white/4 animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-10">
            <MessageSquare size={32} className="mx-auto text-white/10 mb-2" />
            <p className="text-sm text-white/30">אין פעילות עדיין</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map(activity => {
              const emoji = ACTIVITY_EMOJIS[activity.type] || '📝';
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 bg-[rgba(255,255,255,0.04)] rounded-xl p-3 hover:bg-white/[0.06] transition-colors"
                >
                  <span className="text-lg mt-0.5">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80">{activity.description}</p>
                    <p className="text-xs text-white/30 mt-0.5">
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
    queryFn: dealsApi.list,
  });

  const allDeals = data?.data || [];
  const deals = allDeals.filter(d => stageFilter ? d.stage === stageFilter : true);

  const totalPipeline = allDeals
    .filter(d => d.stage !== 'ארכיון')
    .reduce((sum, d) => sum + (d.value || 0), 0);

  if (selectedDeal) {
    const currentDeal = allDeals.find(d => d.id === selectedDeal.id) || selectedDeal;
    return <DealDetail deal={currentDeal} onBack={() => setSelectedDeal(null)} />;
  }

  return (
    <div className="relative z-10 p-5 space-y-5 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-black text-white">עסקאות</h1>
          <p className="text-blue-300/50 text-xs mt-1">{data?.total ?? 0} עסקאות במערכת</p>
        </div>
        <AddDealDialog onSuccess={() => {}} />
      </div>

      {/* Summary Bar */}
      <div className="glass rounded-2xl p-4 flex items-center justify-between">
        <span className="text-xs text-white/50">סה״כ פייפליין</span>
        <span className="text-xl font-black text-emerald-300">{formatCurrency(totalPipeline)}</span>
      </div>

      {/* Stage filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setStageFilter('')}
          className={cn(
            'text-xs px-3 py-1.5 rounded-full border transition-all',
            !stageFilter
              ? 'border-blue-500/40 bg-blue-500/20 text-blue-300'
              : 'border-white/10 text-white/40 hover:bg-white/10'
          )}
        >
          הכל
        </button>
        {STAGES.map(stage => {
          const count = allDeals.filter(d => d.stage === stage).length;
          return (
            <button
              key={stage}
              onClick={() => setStageFilter(stage === stageFilter ? '' : stage)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border transition-all',
                stageFilter === stage
                  ? STAGE_PILL[stage]
                  : 'border-white/10 text-white/40 hover:bg-white/10'
              )}
            >
              {stage} {count > 0 && <span className="opacity-60">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Deals list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-20 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-16">
          <Handshake size={48} className="mx-auto text-white/10 mb-3" />
          <p className="text-white/30">אין עסקאות</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deals.map(deal => (
            <div
              key={deal.id}
              onClick={() => setSelectedDeal(deal)}
              className="flex items-center justify-between bg-[rgba(255,255,255,0.06)] border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className={cn('text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap', STAGE_PILL[deal.stage] || STAGE_PILL['ארכיון'])}>
                  {deal.stage}
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{deal.title}</p>
                  {deal.contact_name && (
                    <p className="text-xs text-white/50">{deal.contact_name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {deal.value ? (
                  <span className="text-sm font-black text-emerald-300">
                    {formatCurrency(deal.value)}
                  </span>
                ) : null}
                <ChevronLeft size={16} className="text-white/30 group-hover:text-white/60 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
