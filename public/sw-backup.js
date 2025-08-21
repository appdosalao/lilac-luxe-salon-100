// Backup do Service Worker original para manter funcionalidade customizada
const STATIC_CACHE_NAME = 'salon-static-v1';
const DYNAMIC_CACHE_NAME = 'salon-dynamic-v1';

// Assets essenciais para offline
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets:', error);
      })
      .then(() => {
        console.log('Service Worker: Install Complete');
        return self.skipWaiting();
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activate Complete');
        return self.clients.claim();
      })
  );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  // Skip para requests não-GET ou de extensões
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  const url = new URL(event.request.url);
  
  // Cache First para assets estáticos
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE_NAME));
  }
  // Network First para documentos HTML
  else if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirstWithCacheFallback(event.request, DYNAMIC_CACHE_NAME));
  }
  // Network First para APIs
  else if (url.hostname.includes('supabase') || url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request, DYNAMIC_CACHE_NAME));
  }
  // Default strategy
  else {
    event.respondWith(networkFirst(event.request, DYNAMIC_CACHE_NAME));
  }
});

// Estratégias de cache
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const response = await cache.match(request);
    
    if (response) {
      console.log('Service Worker: Serving from cache:', request.url);
      return response;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Cache First error:', error);
    return new Response('Offline content not available', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache:', request.url);
    const cache = await caches.open(cacheName);
    const response = await cache.match(request);
    
    if (response) {
      return response;
    }
    
    throw error;
  }
}

async function networkFirstWithCacheFallback(request, cacheName) {
  try {
    return await networkFirst(request, cacheName);
  } catch (error) {
    console.log('Service Worker: Falling back to root for:', request.url);
    const cache = await caches.open(cacheName);
    const fallback = await cache.match('/');
    return fallback || new Response('Offline', { status: 503 });
  }
}

// Manipular mensagens
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_INVALIDATE') {
    caches.delete(DYNAMIC_CACHE_NAME);
  }
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'salon-data-sync') {
    console.log('Service Worker: Background sync triggered');
    // Implementar lógica de sincronização futura
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Nova notificação do salão',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver agendamentos',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/icon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Sistema do Salão', options)
  );
});