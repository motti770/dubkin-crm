'use client';

import { useQuery } from '@tanstack/react-query';
import { activitiesApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

const PARTNERS = [
  {
    name: 'שלמה',
    role: 'שותף בכיר',
    phone: '972501234567',
    initials: 'ש',
    color: 'from-blue-100 to-blue-200 text-blue-700',
  },
  {
    name: 'בר',
    role: 'שותף',
    phone: '972507654321',
    initials: 'ב',
    color: 'from-purple-100 to-purple-200 text-purple-700',
  },
];

function getTypeIcon(type: string): string {
  switch (type) {
    case 'call': return 'call';
    case 'meeting': return 'videocam';
    case 'email': return 'mail';
    case 'note': return 'sticky_note_2';
    default: return 'event';
  }
}

export default function ChatPage() {
  const { data: activitiesData, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activitiesApi.list(),
  });

  const notes = (activitiesData?.data || [])
    .filter(a => a.type === 'note')
    .slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header */}
      <header className="pt-8 px-6 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">תקשורת שותפים</h1>
        <p className="text-slate-500 text-sm mt-1">תיאום עם השותפים</p>
      </header>

      {/* Partner Cards */}
      <section className="px-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wide">שותפים</h2>
        <div className="flex flex-col gap-4">
          {PARTNERS.map(partner => (
            <div
              key={partner.name}
              className="glass-panel rounded-3xl p-5 shadow-glass"
            >
              <div className="flex items-center gap-4 mb-4">
                {/* Avatar */}
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${partner.color} flex items-center justify-center text-xl font-extrabold shadow-glass-sm shrink-0`}>
                  {partner.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900">{partner.name}</h3>
                  <p className="text-slate-500 text-sm">{partner.role}</p>
                </div>
                {/* Online indicator */}
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-green-600 font-medium">זמין</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <a
                  href={`https://wa.me/${partner.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#25D366] text-white rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#20b458] transition-colors shadow-lg"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                  שלח WhatsApp
                </a>
                <a
                  href={`tel:+${partner.phone}`}
                  className="glass-panel rounded-2xl py-3 px-4 flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:bg-white/80 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">call</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Notes */}
      <section className="px-6">
        <h2 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wide">הערות אחרונות</h2>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-2xl glass-card animate-pulse" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="glass-panel rounded-3xl p-8 text-center">
            <span className="material-symbols-outlined text-slate-300 text-[40px] mb-2 block">sticky_note_2</span>
            <p className="text-slate-400 text-sm">אין הערות עדיין</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notes.map(activity => (
              <div
                key={activity.id}
                className="glass-card rounded-2xl p-4 shadow-glass flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 text-amber-600">
                  <span className="material-symbols-outlined text-[18px]">
                    {getTypeIcon(activity.type)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 font-semibold text-sm">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {activity.contact_name && (
                      <span className="text-[10px] text-slate-500">{activity.contact_name}</span>
                    )}
                    {activity.deal_title && (
                      <span className="text-[10px] text-primary bg-blue-50 px-2 py-0.5 rounded-full">
                        {activity.deal_title}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {formatDateTime(activity.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
