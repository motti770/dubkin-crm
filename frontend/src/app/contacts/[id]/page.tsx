'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi, dealsApi, activitiesApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import Link from 'next/link';

function getActivityTypeIcon(type: string): string {
  switch (type) {
    case 'call': return 'call';
    case 'meeting': return 'videocam';
    case 'email': return 'mail';
    case 'note': return 'sticky_note_2';
    default: return 'event';
  }
}

function getActivityTypeColor(type: string): string {
  switch (type) {
    case 'call': return 'text-green-600 bg-green-50';
    case 'meeting': return 'text-blue-600 bg-blue-50';
    case 'email': return 'text-purple-600 bg-purple-50';
    case 'note': return 'text-amber-600 bg-amber-50';
    default: return 'text-slate-600 bg-slate-50';
  }
}

function getStageBadge(stage: string): string {
  const badges: Record<string, string> = {
    'סינון': 'text-red-600 bg-red-50',
    'אפיון': 'text-blue-700 bg-blue-50',
    'מכירה': 'text-amber-700 bg-amber-50',
    'סגירה': 'text-purple-700 bg-purple-50',
    'לקוח פעיל': 'text-green-700 bg-green-50',
    'ארכיון': 'text-gray-600 bg-gray-100',
  };
  return badges[stage] || 'text-slate-600 bg-slate-50';
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const contactId = parseInt(params.id as string, 10);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', company: '', notes: '' });

  const { data: contactsData, isLoading: cLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsApi.list(),
  });

  const { data: dealsData, isLoading: dLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => dealsApi.list(),
  });

  const { data: activitiesData, isLoading: aLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activitiesApi.list(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof editForm) => contactsApi.update(contactId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => contactsApi.delete(contactId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      router.push('/contacts');
    },
  });

  const contact = contactsData?.data.find(c => c.id === contactId);
  const relatedDeals = (dealsData?.data || []).filter(d => d.contact_id === contactId);
  const relatedActivities = (activitiesData?.data || []).filter(a => a.contact_id === contactId);

  const isLoading = cLoading || dLoading || aLoading;

  const cleanPhone = contact?.phone?.replace(/\D/g, '') || '';
  const waPhone = cleanPhone.startsWith('0') ? `972${cleanPhone.slice(1)}` : cleanPhone;

  const startEditing = () => {
    if (!contact) return;
    setEditForm({
      name: contact.name,
      phone: contact.phone || '',
      email: contact.email || '',
      company: contact.company || '',
      notes: contact.notes || '',
    });
    setEditing(true);
  };

  if (isLoading) {
    return (
      <div className="pt-8 px-2 md:px-0 pb-24 md:pb-8 page-enter">
        <div className="h-8 w-24 rounded-xl bg-slate-200 animate-pulse mb-6" />
        <div className="h-32 rounded-3xl glass-card animate-pulse mb-4" />
        <div className="h-20 rounded-3xl glass-card animate-pulse mb-4" />
        <div className="h-40 rounded-3xl glass-card animate-pulse" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="pt-8 px-2 md:px-0 pb-24 md:pb-8 text-center page-enter">
        <Link href="/contacts" className="flex items-center gap-1 text-primary text-sm font-medium mb-8">
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          חזור לאנשי קשר
        </Link>
        <span className="material-symbols-outlined text-slate-300 text-[48px] mb-3 block">person_off</span>
        <p className="text-slate-400">איש הקשר לא נמצא</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-24 md:pb-8 page-enter">
      <div className="md:grid md:grid-cols-3 md:gap-8">
        {/* Right column — profile + contact info */}
        <div className="md:col-span-1">
          {/* Back button */}
          <header className="pt-8 px-2 md:px-0 pb-4">
            <Link href="/contacts" className="inline-flex items-center gap-1 text-primary text-sm font-medium mb-6 hover:underline transition-colors duration-200">
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              אנשי קשר
            </Link>

            {/* Profile Card */}
            <div className="glass-panel-dark rounded-3xl p-6 shadow-glass relative overflow-hidden fade-in-up">
              <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl" />
              <div className="relative z-10 flex items-start gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-primary text-2xl font-extrabold shadow-glass-sm shrink-0">
                  {contact.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-extrabold text-slate-900 leading-tight">{contact.name}</h1>
                  {contact.company && <p className="text-slate-500 text-sm mt-0.5">{contact.company}</p>}
                  {contact.source && (
                    <span className="text-[10px] font-medium text-primary bg-blue-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                      {contact.source}
                    </span>
                  )}
                </div>
              </div>

              {/* Edit / Delete */}
              <div className="flex gap-2 mt-4">
                <button onClick={startEditing} className="flex-1 glass-panel rounded-xl py-2 text-sm font-medium text-slate-600 hover:bg-white/80 flex items-center justify-center gap-1 transition-all duration-200 active:scale-95">
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  עריכה
                </button>
                <button
                  onClick={() => { if (confirm(`למחוק את ${contact.name}?`)) deleteMutation.mutate(); }}
                  className="glass-panel rounded-xl py-2 px-4 text-sm font-medium text-red-500 hover:bg-red-50 flex items-center justify-center gap-1 transition-all duration-200 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  מחק
                </button>
              </div>
            </div>
          </header>

          {/* Contact Info */}
          <section className="px-2 md:px-0 mb-4">
            <div className="glass-panel rounded-3xl p-4 shadow-glass space-y-3 fade-in-up" style={{ animationDelay: '60ms' }}>
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-3 hover:bg-white/40 p-2 -mx-2 rounded-xl transition-colors duration-200">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">phone_iphone</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">טלפון</p>
                    <p className="text-slate-900 font-bold text-sm" dir="ltr">{contact.phone}</p>
                  </div>
                </a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-3 hover:bg-white/40 p-2 -mx-2 rounded-xl transition-colors duration-200">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">alternate_email</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">אימייל</p>
                    <p className="text-slate-900 font-bold text-sm truncate" dir="ltr">{contact.email}</p>
                  </div>
                </a>
              )}
              {contact.notes && (
                <div className="flex items-start gap-3 p-2 -mx-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                    <span className="material-symbols-outlined text-[20px]">sticky_note_2</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">הערות</p>
                    <p className="text-slate-700 text-sm leading-relaxed">{contact.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Action Buttons */}
          {contact.phone && (
            <section className="px-2 md:px-0 mb-4">
              <div className="flex gap-3 fade-in-up" style={{ animationDelay: '120ms' }}>
                <a href={`tel:${contact.phone}`} className="flex-1 glass-panel rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:bg-white/80 transition-all duration-200 active:scale-95">
                  <span className="material-symbols-outlined text-[20px]">call</span>
                  התקשר
                </a>
                <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#25D366] text-white rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#20b458] transition-all duration-200 shadow-lg active:scale-95">
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                  וואטסאפ
                </a>
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex-1 glass-panel rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-semibold text-purple-600 hover:bg-white/80 transition-all duration-200 active:scale-95">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                    מייל
                  </a>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Left column — deals + activities */}
        <div className="md:col-span-2 md:pt-8">
          {/* Related Deals */}
          <section className="px-2 md:px-0 mb-4">
            <h3 className="text-base font-bold text-slate-800 mb-3">עסקאות קשורות</h3>
            {relatedDeals.length === 0 ? (
              <div className="glass-panel rounded-3xl p-6 text-center fade-in-up">
                <span className="material-symbols-outlined text-slate-300 text-[36px] mb-2 block">handshake</span>
                <p className="text-slate-400 text-sm">אין עסקאות קשורות</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {relatedDeals.map((deal, i) => (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="glass-card rounded-2xl p-4 shadow-glass flex items-center gap-3 hover:shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] fade-in-up"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm font-bold shrink-0">
                      {(deal.name || deal.title || '').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 font-semibold text-sm truncate">{deal.name || deal.title || ''}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getStageBadge(deal.stage_display || deal.stage)}`}>
                        {deal.stage_display || deal.stage}
                      </span>
                    </div>
                    {deal.value && (
                      <span className="text-slate-900 font-bold text-sm shrink-0">
                        {formatCurrency(Number(deal.value) || 0)}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Activity History */}
          <section className="px-2 md:px-0">
            <h3 className="text-base font-bold text-slate-800 mb-3">היסטוריית פעילות</h3>
            {aLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-14 rounded-2xl glass-card animate-pulse" />
                ))}
              </div>
            ) : relatedActivities.length === 0 ? (
              <div className="glass-panel rounded-3xl p-6 text-center">
                <span className="material-symbols-outlined text-slate-300 text-[36px] mb-2 block">history</span>
                <p className="text-slate-400 text-sm">אין פעילות עדיין</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {relatedActivities.map((activity, i) => (
                  <div
                    key={activity.id}
                    className="glass-card rounded-2xl p-4 shadow-glass flex items-start gap-3 fade-in-up"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getActivityTypeColor(activity.type)}`}>
                      <span className="material-symbols-outlined text-[18px]">{getActivityTypeIcon(activity.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 font-semibold text-sm">{activity.description}</p>
                      {activity.deal_title && (
                        <span className="text-[10px] text-primary bg-blue-50 px-2 py-0.5 rounded-full">{activity.deal_title}</span>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(activity.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 backdrop-enter" onClick={() => setEditing(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-2xl space-y-4 scale-in" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-slate-900">עריכת איש קשר</h2>
                <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors duration-200">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 font-medium">שם *</label>
                  <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="w-full h-10 rounded-xl bg-white/60 border border-slate-200 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 font-medium">טלפון</label>
                    <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} dir="ltr" className="w-full h-10 rounded-xl bg-white/60 border border-slate-200 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-medium">אימייל</label>
                    <input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} dir="ltr" className="w-full h-10 rounded-xl bg-white/60 border border-slate-200 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">חברה</label>
                  <input value={editForm.company} onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))} className="w-full h-10 rounded-xl bg-white/60 border border-slate-200 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">הערות</label>
                  <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full rounded-xl bg-white/60 border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-100 transition-colors duration-200">ביטול</button>
                <button onClick={() => updateMutation.mutate(editForm)} disabled={!editForm.name || updateMutation.isPending} className="px-5 py-2 rounded-xl bg-primary hover:bg-blue-600 text-white text-sm font-bold shadow-lg transition-all duration-200 disabled:opacity-40 active:scale-95">
                  {updateMutation.isPending ? 'שומר...' : 'שמור'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
