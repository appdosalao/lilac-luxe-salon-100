import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

self.skipWaiting();
clientsClaim();

// Precache resources
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Cache Supabase API
registerRoute(
  ({ url }) => url.origin.includes('supabase.co'),
  new NetworkFirst({
    cacheName: 'supabase-api',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60 // 24 hours
      })
    ]
  })
);

// Cache Google Fonts
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
      })
    ]
  })
);

// Push Notification Listener
self.addEventListener('push', (event) => {
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Nova Notificação', body: event.data.text() };
    }
  }

  const options = {
    body: data.body || 'Você tem uma nova notificação',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-96x96.png',
    data: data.data || {},
    tag: data.tag || 'general-notification',
    vibrate: data.vibrate || [100, 50, 100],
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Salão de Bolso', options)
  );
});

// Notification Click Listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // URL para abrir ao clicar
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      // Se já houver uma aba aberta com essa URL, foca nela
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Senão, abre uma nova aba
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
