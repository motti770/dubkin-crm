'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketingApi, MarketingChannel, ChannelActivity } from '@/lib/api';

const RESULT_LABELS: Record<string, { label: string; color: string }> = {
  pending:      { label: 'ממתין',        color: 'bg-slate-100 text-slate-600' },
  lead:         { label: '🎯 ליד!',      color: 'bg-green-100 text-green-700' },
  no_response:  { label: 'לא ענה',       color: 'bg-yellow-100 text-yellow-700' },
  not_relevant: { label: 'לא רלוונטי',   color: 'bg-red-100 text-red-700' },
  success:      { label: '✅ הצלחה',     color: 'bg-emerald-100 text-emerald-700' },
};

const ACTIVITY_TYPES = [
  { value: 'post',     label: '📝 פוסט / תוכן' },
  { value: 'message',  label: '💬 הודעה' },
  { value: 'call',     label: '📞 שיחה' },
  { value: 'meeting',  label: '🤝 פגישה' },
  { value: 'ad',       label: '💰 מודעה' },
  { value: 'referral', label: '🔗 הפניה' },
  { value: 'other',    label: '📌 אחר' },
];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('he-IL', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function MarketingPage() {
  const qc = useQueryClient();
  const [selectedChannel, setSelectedChannel] = useState<MarketingChannel | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    channel_id: '',
    type: 'message',
    description: '',
    result: 'pending',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['marketing'],
    queryFn: () => marketingApi.list(),
  });

  const { data: channelData } = useQuery({
    queryKey: ['marketing-channel', selectedChannel?.id],
    queryFn: () => marketingApi.get(selectedChannel!.id),
    enabled: !!selectedChannel,
  });

  const addMutation = useMutation({
    mutationFn: () => marketingApi.addActivity(Number(addForm.channel_id), {
      type: addForm.type as any,
      description: addForm.description,
      result: addForm.result as any,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing'] });
      qc.invalidateQueries({ queryKey: ['marketing-channel', Number(addForm.channel_id)] });
      setAddForm({ channel_id: '', type: 'message', description: '', result: 'pending' });
      setShowAddForm(false);
    },
  });

  const channels = data?.channels || [];

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-slate-400 text-sm">טוען...</div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">ערוצי שיווק</h1>
          <p className="text-sm text-slate-500 mt-0.5">5 ערוצי תזרים — פעילות יומיומית להביא לידים</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-blue-600 text-white text-sm font-bold shadow-lg transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          רשום פעילות
        </button>
      </div>

      {/* 5 Channel Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => setSelectedChannel(selectedChannel?.id === ch.id ? null : ch)}
            className={`relative text-right p-4 rounded-2xl border-2 transition-all duration-200 ${
              selectedChannel?.id === ch.id
                ? 'border-primary bg-blue-50 shadow-lg'
                : 'border-slate-200 bg-white hover:border-primary/40 hover:shadow-md'
            }`}
          >
            <div className="text-3xl mb-2">{ch.icon}</div>
            <div className="font-bold text-slate-900 text-sm">{ch.display_name}</div>
            <div className="text-xs text-slate-500 mt-1 line-clamp-2">{ch.description}</div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <div className="text-lg font-black text-primary">{ch.leads_count || 0}</div>
                <div className="text-xs text-slate-400">לידים</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <div className="text-lg font-black text-emerald-600">{ch.activities_this_week || 0}</div>
                <div className="text-xs text-slate-400">השבוע</div>
              </div>
            </div>

            {ch.last_activity && (
              <div className="mt-2 text-xs text-slate-400">
                פעילות אחרונה: {formatDate(ch.last_activity)}
              </div>
            )}

            {(!ch.last_activity || Number(ch.activities_this_week) === 0) && (
              <div className="mt-2 inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                לא פעיל השבוע
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Channel Activities Panel */}
      {selectedChannel && channelData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <span className="text-2xl">{selectedChannel.icon}</span>
            <div>
              <h2 className="font-bold text-slate-900">{selectedChannel.display_name}</h2>
              <p className="text-xs text-slate-500">{channelData.activities.length} פעילויות</p>
            </div>
            <button
              onClick={() => { setAddForm(f => ({ ...f, channel_id: String(selectedChannel.id) })); setShowAddForm(true); }}
              className="mr-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              הוסף פעילות
            </button>
          </div>

          {channelData.activities.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-2">📭</div>
              <div className="text-sm">אין פעילויות עדיין — התחל עכשיו!</div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {channelData.activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50/60 transition-colors">
                  <div className="text-xl mt-0.5">
                    {ACTIVITY_TYPES.find(t => t.value === act.type)?.label.split(' ')[0] || '📌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800">{act.description}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RESULT_LABELS[act.result]?.color}`}>
                        {RESULT_LABELS[act.result]?.label}
                      </span>
                      {act.contact_name && (
                        <span className="text-xs text-slate-500">👤 {act.contact_name}</span>
                      )}
                      <span className="text-xs text-slate-400">{formatDate(act.occurred_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Activity Modal */}
      {showAddForm && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowAddForm(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5" dir="rtl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">רשום פעילות שיווק</h3>
                <button onClick={() => setShowAddForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 font-medium">ערוץ *</label>
                  <select
                    value={addForm.channel_id}
                    onChange={e => setAddForm(f => ({ ...f, channel_id: e.target.value }))}
                    className="w-full h-10 rounded-xl bg-slate-50 border border-slate-200 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">-- בחר ערוץ --</option>
                    {channels.map(ch => (
                      <option key={ch.id} value={ch.id}>{ch.icon} {ch.display_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-500 font-medium">סוג פעילות</label>
                  <select
                    value={addForm.type}
                    onChange={e => setAddForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full h-10 rounded-xl bg-slate-50 border border-slate-200 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {ACTIVITY_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-500 font-medium">מה עשיתי? *</label>
                  <textarea
                    value={addForm.description}
                    onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                    placeholder='לדוג׳: "שלחתי הודעה לבר על לקוח פוטנציאלי", "פרסמתי פוסט בקהילת יזמים"'
                    rows={3}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 font-medium">תוצאה</label>
                  <select
                    value={addForm.result}
                    onChange={e => setAddForm(f => ({ ...f, result: e.target.value }))}
                    className="w-full h-10 rounded-xl bg-slate-50 border border-slate-200 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="pending">⏳ ממתין</option>
                    <option value="lead">🎯 ליד!</option>
                    <option value="no_response">📭 לא ענה</option>
                    <option value="not_relevant">❌ לא רלוונטי</option>
                    <option value="success">✅ הצלחה</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => addMutation.mutate()}
                  disabled={!addForm.channel_id || !addForm.description || addMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-blue-600 text-white text-sm font-bold shadow transition-all disabled:opacity-40"
                >
                  {addMutation.isPending ? 'שומר...' : '✅ שמור פעילות'}
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
