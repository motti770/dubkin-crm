// Dubkin CRM Service Worker — PWA + Push Notifications
const CACHE_NAME = 'dubkin-crm-v1';
const STATIC_ASSETS = [
  '/',
  '/pipeline',
  '/contacts',
  '/deals',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ---- Install: pre-cache static assets ----
self.addEventListener('install', (event) => {
  console.log('[SW] Installing…');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ---- Activate: clean old caches ----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ---- Fetch: network-first for API, cache-first for static ----
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin && !url.pathname.startsWith('/api')) return;

  // API: network-first, no caching
  if (url.pathname.startsWith('/api') || url.hostname !== self.location.hostname) {
    event.respondWith(fetch(event.request).catch(() => new Response('{"error":"offline"}', {
      headers: { 'Content-Type': 'application/json' }
    })));
    return;
  }

  // Static: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const networkFetch = fetch(event.request).then((res) => {
        if (res.ok) cache.put(event.request, res.clone());
        return res;
      }).catch(() => null);

      return cached || networkFetch || new Response('Offline', { status: 503 });
    })
  );
});

// ---- Push Notifications ----
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const { title = 'Dubkin CRM', body = 'עדכון חדש', url = '/', tag = 'crm-notification' } = data;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag,
      data: { url },
      dir: 'rtl',
      lang: 'he',
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: 'פתח' },
        { action: 'dismiss', title: 'סגור' },
      ],
    })
  );
});

// ---- Notification Click ----
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const win of windows) {
        if (win.url === url && 'focus' in win) return win.focus();
      }
      return clients.openWindow(url);
    })
  );
});

// ---- Background Sync (follow-up reminders) ----
self.addEventListener('sync', (event) => {
  if (event.tag === 'follow-up-check') {
    event.waitUntil(checkFollowUps());
  }
});

async function checkFollowUps() {
  try {
    const res = await fetch('/api/activities?type=follow_up&due_today=true');
    const data = await res.json();
    const items = data?.data || [];
    if (items.length > 0) {
      await self.registration.showNotification('⚡ follow-ups להיום', {
        body: `יש לך ${items.length} follow-ups שמחכים לך`,
        icon: '/icons/icon-192.png',
        tag: 'follow-up-reminder',
        dir: 'rtl',
        data: { url: '/' },
      });
    }
  } catch (_) { /* offline or API unavailable */ }
}
