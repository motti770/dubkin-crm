'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { activitiesApi, Activity } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

const HEBREW_DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

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

function getActivityDotColor(type: string): string {
  switch (type) {
    case 'call': return 'bg-green-500';
    case 'meeting': return 'bg-blue-500';
    case 'email': return 'bg-purple-500';
    case 'note': return 'bg-amber-500';
    default: return 'bg-slate-400';
  }
}

export default function CalendarPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const { data: activitiesData, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activitiesApi.list(),
  });

  const activities = activitiesData?.data || [];

  const activitiesByDay = useMemo(() => {
    const map: Record<number, Activity[]> = {};
    activities.forEach(activity => {
      const d = new Date(activity.created_at);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(activity);
      }
    });
    return map;
  }, [activities, currentYear, currentMonth]);

  const selectedActivities = selectedDay ? (activitiesByDay[selectedDay] || []) : [];

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (day: number) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  return (
    <div className="flex flex-col min-h-screen pb-24 md:pb-8 page-enter">
      {/* Header */}
      <header className="pt-8 px-2 md:px-0 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-slate-900">יומן</h1>
          <button
            onClick={() => {
              setCurrentYear(today.getFullYear());
              setCurrentMonth(today.getMonth());
              setSelectedDay(today.getDate());
            }}
            className="glass-panel px-3 py-1.5 rounded-full text-xs font-semibold text-primary hover:bg-white/80 transition-all duration-200 active:scale-95"
          >
            {selectedDay && !(selectedDay === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear())
              ? `${selectedDay} ${HEBREW_MONTHS[currentMonth]}`
              : 'היום'}
          </button>
        </div>
      </header>

      {/* Desktop: side-by-side. Mobile: stacked */}
      <div className="flex-1 md:grid md:grid-cols-5 md:gap-6 px-2 md:px-0">
        {/* Calendar Card */}
        <section className="md:col-span-3 mb-4 md:mb-0">
          <div className="glass-panel rounded-3xl shadow-glass p-4 md:p-6 fade-in-up">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="h-8 w-8 rounded-full glass-panel flex items-center justify-center text-slate-600 hover:bg-white/80 transition-all duration-200 active:scale-95">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
              <h2 className="text-base font-bold text-slate-900">{HEBREW_MONTHS[currentMonth]} {currentYear}</h2>
              <button onClick={nextMonth} className="h-8 w-8 rounded-full glass-panel flex items-center justify-center text-slate-600 hover:bg-white/80 transition-all duration-200 active:scale-95">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {HEBREW_DAYS.map(d => (
                <div key={d} className="text-center text-[11px] font-bold text-slate-400 py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {cells.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} />;
                const hasActivities = !!activitiesByDay[day];
                const isSelected = selectedDay === day;
                const todayMark = isToday(day);

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                    className={`relative flex flex-col items-center justify-center rounded-2xl aspect-square transition-all duration-200
                      ${isSelected ? 'bg-primary text-white shadow-lg shadow-primary/30' : ''}
                      ${todayMark && !isSelected ? 'ring-2 ring-primary/50' : ''}
                      ${!isSelected ? 'hover:bg-white/60' : ''}
                    `}
                  >
                    <span className={`text-sm font-semibold ${isSelected ? 'text-white' : todayMark ? 'text-primary' : 'text-slate-700'}`}>
                      {day}
                    </span>
                    {hasActivities && (
                      <div className="flex gap-0.5 mt-0.5 justify-center">
                        {(activitiesByDay[day] || []).slice(0, 3).map((act, i) => (
                          <span key={i} className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white/70' : getActivityDotColor(act.type)}`} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Selected Day Activities — sidebar on desktop */}
        <section className="md:col-span-2">
          {selectedDay && (
            <div className="fade-in-up">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  {new Date(currentYear, currentMonth, selectedDay).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {isToday(selectedDay) && (
                    <span className="text-xs font-normal text-primary bg-blue-50 px-2 py-0.5 rounded-full">היום</span>
                  )}
                </h3>
                <span className="text-xs text-slate-400">{selectedActivities.length} פעילויות</span>
              </div>

              {isLoading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-16 rounded-2xl glass-card animate-pulse" />
                  ))}
                </div>
              ) : selectedActivities.length === 0 ? (
                <div className="glass-panel rounded-3xl p-8 text-center">
                  <span className="material-symbols-outlined text-slate-300 text-[40px] mb-2 block">event_available</span>
                  <p className="text-slate-400 text-sm">אין פעילויות ביום זה</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {selectedActivities.map((activity, i) => (
                    <div
                      key={activity.id}
                      className="glass-card rounded-2xl p-4 shadow-glass flex items-start gap-3 hover:shadow-lg transition-all duration-200 fade-in-up"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getActivityTypeColor(activity.type)}`}>
                        <span className="material-symbols-outlined text-[18px]">{getActivityTypeIcon(activity.type)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900 font-semibold text-sm">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {activity.contact_name && <span className="text-[10px] text-slate-500">{activity.contact_name}</span>}
                          {activity.deal_title && <span className="text-[10px] text-primary bg-blue-50 px-2 py-0.5 rounded-full">{activity.deal_title}</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(activity.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!selectedDay && !isLoading && (
            <div className="glass-panel rounded-3xl p-8 text-center fade-in-up">
              <span className="material-symbols-outlined text-slate-300 text-[40px] mb-2 block">touch_app</span>
              <p className="text-slate-400 text-sm">בחר יום לצפייה בפעילויות</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
