'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Smartphone, Shield, Info, CheckCircle2 } from 'lucide-react';
import { requestPushPermission, showLocalNotification } from '@/lib/push';

export default function SettingsPage() {
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [isStandalone, setIsStandalone] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('Notification' in window) setNotifPermission(Notification.permission);
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((reg) => setSwRegistered(!!reg));
      }
    }
  }, []);

  async function handleEnableNotifications() {
    const granted = await requestPushPermission();
    if ('Notification' in window) setNotifPermission(Notification.permission);
    if (granted) {
      showLocalNotification('✅ התראות מופעלות!', 'תקבל עדכונים על follow-ups ולידים חדשים');
    }
  }

  async function handleTestNotification() {
    showLocalNotification(
      '⚡ follow-up להיום',
      'מנחם דובקין - עסקה של ₪2,500 ממתינה לך'
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <h1 className="text-base font-bold">הגדרות</h1>
        <p className="text-xs text-muted-foreground mt-0.5">ניהול אפליקציה</p>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        {/* PWA Status */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Smartphone size={16} className="text-blue-400" />
            סטטוס PWA
          </h2>

          <div className="space-y-2">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">מותקן כאפליקציה</span>
              <span className={`text-xs font-medium ${isStandalone ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                {isStandalone ? '✅ כן' : '⬜ לא'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Service Worker</span>
              <span className={`text-xs font-medium ${swRegistered ? 'text-emerald-400' : 'text-amber-400'}`}>
                {swRegistered ? '✅ פעיל' : '⚠️ לא רשום'}
              </span>
            </div>
          </div>

          {!isStandalone && (
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-300">
              💡 להתקנה: לחץ על "שתף" בדפדפן ← "הוסף למסך הבית"
            </div>
          )}
        </div>

        {/* Push Notifications */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Bell size={16} className="text-blue-400" />
            התראות Push
          </h2>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm">הרשאת התראות</span>
            <span className={`text-xs font-medium ${
              notifPermission === 'granted' ? 'text-emerald-400' :
              notifPermission === 'denied' ? 'text-red-400' : 'text-amber-400'
            }`}>
              {notifPermission === 'granted' ? '✅ מאושר' :
               notifPermission === 'denied' ? '❌ חסום' : '⏳ ממתין'}
            </span>
          </div>

          {notifPermission !== 'granted' ? (
            <button
              onClick={handleEnableNotifications}
              disabled={notifPermission === 'denied'}
              className="btn-primary w-full text-sm"
            >
              <Bell size={16} />
              {notifPermission === 'denied' ? 'חסום בדפדפן — שנה ב-Settings' : 'הפעל התראות'}
            </button>
          ) : (
            <button
              onClick={handleTestNotification}
              className="w-full py-3 rounded-xl border border-blue-500/30 text-blue-300 text-sm font-medium min-h-[48px] hover:bg-blue-500/10 transition-colors"
            >
              🔔 שלח התראת בדיקה
            </button>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• follow-up שמגיע היום</p>
            <p>• עסקה חדשה שנפתחה</p>
            <p>• תזכורת ידנית</p>
          </div>
        </div>

        {/* About */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Info size={16} className="text-muted-foreground" />
            אודות
          </h2>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Dubkin CRM · גרסה 1.0.0</p>
            <p>פותח עבור מורדי דובקין 🚀</p>
          </div>
        </div>
      </div>
    </div>
  );
}
