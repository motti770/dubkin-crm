'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealsApi, activitiesApi, Deal } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime, cn } from '@/lib/utils';
import Link from 'next/link';

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

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const dealId = parseInt(params.id as string, 10);

  const [activityForm, setActivityForm] = useState({ type: 'note', description: '' });
  const [addingActivity, setAddingActivity] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', value: '', notes: '' });
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fetch deal from list (to get joined fields like contact_name, stage_display)
  const { data: dealsData, isLoading: dealLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => dealsApi.list(),
  });

  const { data: activitiesData, isLoading: actLoading } = useQuery({
    queryKey: ['activities', dealId],
    queryFn: () => activitiesApi.list(dealId),
  });

  const deal = dealsData?.data.find(d => d.id === dealId);
  const activities = activitiesData?.data || [];

  const stageMutation = useMutation({
    mutationFn: (stage: string) => dealsApi.updateStage(dealId, stage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });

  const activityMutation = useMutation({
    mutationFn: () => activitiesApi.create({
      deal_id: dealId,
      contact_id: deal?.contact_id,
      type: activityForm.type,
      description: activityForm.description,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities', dealId] });
      qc.invalidateQueries({ queryKey: ['activities'] });
      setActivityForm({ type: 'note', description: '' });
      setAddingActivity(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => dealsApi.delete(dealId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['pipeline'] });
      router.push('/deals');
    },
  });

  const startEditing = () => {
    if (!deal) return;
    setEditForm({
      name: deal.name || deal.title || '',
      value: deal.value?.toString() || '',
      notes: deal.notes || '',
    });
    setEditing(true);
  };

  const updateMutation = useMutation({
    mutationFn: () => dealsApi.update(dealId, {
      name: editForm.name,
      value: editForm.value ? parseFloat(editForm.value) : undefined,
      notes: editForm.notes,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      setEditing(false);
    },
  });

  if (dealLoading) {
    return (
      <div className="pt-8 px-2 md:px-0 pb-24 md:pb-8 page-enter">
        <div className="h-8 w-24 rounded-xl bg-slate-200 animate-pulse mb-6" />
        <div className="h-48 rounded-3xl glass-card animate-pulse mb-4" />
        <div className="h-64 rounded-3xl glass-card animate-pulse" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="pt-8 px-2 md:px-0 pb-24 md:pb-8 text-center page-enter">
        <Link href="/deals" className="flex items-center gap-1 text-primary text-sm font-medium mb-8 hover:underline transition-colors duration-200">
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          חזור לעסקאות
        </Link>
        <span className="material-symbols-outlined text-slate-300 text-[48px] mb-3 block">handshake</span>
        <p className="text-slate-400">העסקה לא נמצאה</p>
      </div>
    );
  }

  const cleanPhone = deal.contact_phone?.replace(/\D/g, '') || '';
  const waPhone = cleanPhone.startsWith('0') ? `972${cleanPhone.slice(1)}` : cleanPhone;

  return (
    <div className="pt-8 px-2 md:px-0 pb-24 md:pb-8 page-enter">
      {/* Back */}
      <Link href="/deals" className="inline-flex items-center gap-1 text-primary text-sm font-medium mb-6 hover:underline transition-colors duration-200">
        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        עסקאות
      </Link>

      <div className="md:grid md:grid-cols-3 md:gap-8">
        {/* Right column — Deal info */}
        <div className="md:col-span-1 space-y-4">
          {/* Deal Header Card */}
          <div className="glass-panel-dark rounded-3xl p-6 shadow-glass relative overflow-hidden fade-in-up">
            <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-extrabold text-slate-900 leading-tight mb-1">{deal.name || deal.title || ''}</h1>
                  {deal.contact_name && (
                    <Link href={`/contacts/${deal.contact_id}`} className="text-sm text-primary hover:underline transition-colors duration-200">
                      {deal.contact_name}
                    </Link>
                  )}
                </div>
                {deal.value != null && (
                  <span className="text-2xl font-extrabold text-slate-900">{formatCurrency(Number(deal.value) || 0)}</span>
                )}
              </div>

              <span className={cn('text-xs px-3 py-1 rounded-full border inline-block', STAGE_PILL[deal.stage_display] || STAGE_PILL['ארכיון'])}>
                {deal.stage_display}
              </span>

              <div className="flex items-center gap-4 text-xs text-slate-400 mt-3">
                <span>נוצר {formatDate(deal.created_at)}</span>
                <span>עודכן {formatDate(deal.updated_at)}</span>
              </div>

              {deal.notes && (
                <div className="mt-3 bg-white/40 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">הערות</p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{deal.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <button onClick={startEditing} className="flex-1 glass-panel rounded-xl py-2 text-sm font-medium text-slate-600 hover:bg-white/80 flex items-center justify-center gap-1 transition-all duration-200 active:scale-95">
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  עריכה
                </button>
                <button onClick={() => setConfirmDelete(true)} className="glass-panel rounded-xl py-2 px-4 text-sm font-medium text-red-500 hover:bg-red-50 flex items-center justify-center gap-1 transition-all duration-200 active:scale-95">
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  מחק
                </button>
              </div>
            </div>
          </div>

          {/* Change Stage */}
          <div className="glass-panel rounded-2xl p-5 shadow-glass fade-in-up" style={{ animationDelay: '60ms' }}>
            <p className="text-xs text-slate-400 mb-3 font-medium">שנה שלב</p>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.filter(s => s !== deal.stage_display).map(stage => (
                <button
                  key={stage}
                  onClick={() => stageMutation.mutate(stage)}
                  disabled={stageMutation.isPending}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full border transition-all duration-200 hover:opacity-80 disabled:opacity-40 active:scale-95',
                    STAGE_PILL[stage] || STAGE_PILL['ארכיון']
                  )}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>

          {/* Contact card */}
          {deal.contact_name && (
            <Link
              href={`/contacts/${deal.contact_id}`}
              className="block glass-panel rounded-2xl p-4 shadow-glass hover:shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] fade-in-up"
              style={{ animationDelay: '120ms' }}
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-primary text-lg font-bold shrink-0">
                  {deal.contact_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">{deal.contact_name}</p>
                  {deal.contact_phone && <p className="text-xs text-slate-500" dir="ltr">{deal.contact_phone}</p>}
                </div>
                <span className="material-symbols-outlined text-slate-300 text-[18px]">chevron_left</span>
              </div>
              {deal.contact_phone && (
                <div className="flex gap-2 mt-3">
                  <a href={`tel:${deal.contact_phone}`} onClick={e => e.stopPropagation()} className="flex-1 glass-panel rounded-xl py-2 text-sm font-medium text-blue-600 flex items-center justify-center gap-1 hover:bg-white/80 transition-all duration-200 active:scale-95">
                    <span className="material-symbols-outlined text-[16px]">call</span>
                    התקשר
                  </a>
                  <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex-1 bg-[#25D366] text-white rounded-xl py-2 text-sm font-semibold flex items-center justify-center gap-1 hover:bg-[#20b458] transition-all duration-200 shadow-md active:scale-95">
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                    וואטסאפ
                  </a>
                </div>
              )}
            </Link>
          )}
        </div>

        {/* Left column — Activities */}
        <div className="md:col-span-2 mt-6 md:mt-0">
          <div className="glass-panel rounded-2xl p-5 shadow-glass space-y-4 fade-in-up" style={{ animationDelay: '60ms' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">לוג פעילות</h2>
              <button
                onClick={() => setAddingActivity(!addingActivity)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 border border-primary/20 transition-all duration-200 active:scale-95"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                הוסף
              </button>
            </div>

            {/* Add activity form */}
            {addingActivity && (
              <div className="bg-white/60 rounded-xl p-4 space-y-3 border border-slate-200/50 fade-in-up">
                <div className="flex gap-2 flex-wrap">
                  {ACTIVITY_TYPES.map(({ value, label, emoji }) => (
                    <button
                      key={value}
                      onClick={() => setActivityForm(f => ({ ...f, type: value }))}
                      className={cn(
                        'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all duration-200',
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
                    className="px-4 h-10 rounded-xl bg-primary hover:bg-blue-600 text-white transition-all duration-200 disabled:opacity-40 shadow-lg shadow-blue-500/20 active:scale-95"
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
                <p className="text-xs text-slate-300 mt-1">הוסף שיחה, פגישה או הערה</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map((activity, i) => {
                  const emoji = ACTIVITY_EMOJIS[activity.type] || '📝';
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 bg-white/50 rounded-xl p-3 hover:bg-white/70 transition-colors duration-200 fade-in-up"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <span className="text-lg mt-0.5">{emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700">{activity.description}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(activity.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 backdrop-enter" onClick={() => setEditing(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-2xl space-y-4 scale-in" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-slate-900">עריכת עסקה</h2>
                <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors duration-200">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 font-medium">שם עסקה *</label>
                  <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="w-full h-10 rounded-xl bg-white/60 border border-slate-200 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">שווי (₪)</label>
                  <input type="number" value={editForm.value} onChange={e => setEditForm(f => ({ ...f, value: e.target.value }))} dir="ltr" className="w-full h-10 rounded-xl bg-white/60 border border-slate-200 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">הערות</label>
                  <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full rounded-xl bg-white/60 border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-100 transition-colors duration-200">ביטול</button>
                <button onClick={() => updateMutation.mutate()} disabled={!editForm.name || updateMutation.isPending} className="px-5 py-2 rounded-xl bg-primary hover:bg-blue-600 text-white text-sm font-bold shadow-lg transition-all duration-200 disabled:opacity-40 active:scale-95">
                  {updateMutation.isPending ? 'שומר...' : 'שמור'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 backdrop-enter" onClick={() => setConfirmDelete(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-sm bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-2xl text-center scale-in" onClick={e => e.stopPropagation()}>
              <span className="material-symbols-outlined text-red-400 text-[48px] mb-3 block">warning</span>
              <h2 className="text-lg font-bold text-slate-900 mb-2">מחיקת עסקה</h2>
              <p className="text-sm text-slate-500 mb-6">האם אתה בטוח שברצונך למחוק את &quot;{deal.name || deal.title}&quot;? פעולה זו בלתי הפיכה.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 glass-panel hover:bg-white/80 transition-all duration-200 active:scale-95">ביטול</button>
                <button onClick={() => { deleteMutation.mutate(); setConfirmDelete(false); }} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg transition-all duration-200 active:scale-95">
                  {deleteMutation.isPending ? 'מוחק...' : 'מחק'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
