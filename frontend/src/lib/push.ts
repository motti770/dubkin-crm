// Push Notification utilities for Dubkin CRM

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[PWA] Service Worker registered:', reg.scope);
    return reg;
  } catch (err) {
    console.error('[PWA] SW registration failed:', err);
    return null;
  }
}

export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

export async function subscribeToPush(reg: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  try {
    // In production, use your VAPID public key here
    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    if (!VAPID_PUBLIC_KEY) {
      console.warn('[Push] No VAPID key configured. Push subscription skipped.');
      return null;
    }
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
    });
    console.log('[Push] Subscribed:', sub.endpoint);
    return sub;
  } catch (err) {
    console.error('[Push] Subscription failed:', err);
    return null;
  }
}

export function showLocalNotification(title: string, body: string, url = '/') {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const n = new Notification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    dir: 'rtl',
    lang: 'he',
  });
  n.onclick = () => { window.focus(); window.location.href = url; n.close(); };
}

export async function scheduleFollowUpReminders(deals: Array<{ title: string; follow_up_date?: string; value?: number }>) {
  const today = new Date().toDateString();
  const due = deals.filter((d) => {
    if (!d.follow_up_date) return false;
    return new Date(d.follow_up_date).toDateString() === today;
  });

  if (due.length === 0) return;

  showLocalNotification(
    `⚡ ${due.length} follow-ups להיום`,
    due.map((d) => `• ${d.title}`).join('\n'),
    '/'
  );
}

// Helper: convert VAPID base64 key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
