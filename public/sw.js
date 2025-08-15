const CACHE_NAME = 'salon-app-v1.0.0';
const STATIC_CACHE_NAME = 'salon-static-v1.0.0';

// Assets essenciais para funcionamento offline
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Assets dinâmicos que serão cacheados conforme uso
const DYNAMIC_CACHE_NAME = 'salon-dynamic-v1.0.0';

// Install event - cachear assets essenciais
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - estratégia cache-first para assets estáticos, network-first para dados
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip para requisições que não são GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip para requisições de extensões do browser
  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
    return;
  }
  
  event.respondWith(
    // Estratégia diferente para diferentes tipos de recursos
    handleRequest(request)
  );
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Para assets estáticos (CSS, JS, imagens, fontes) - Cache First
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' || 
      request.destination === 'font' ||
      url.pathname.includes('/icons/') ||
      url.pathname.includes('/assets/')) {
    
    return cacheFirst(request, STATIC_CACHE_NAME);
  }
  
  // Para navegação (HTML) - Network First with Cache Fallback
  if (request.destination === 'document') {
    return networkFirstWithCacheFallback(request, DYNAMIC_CACHE_NAME);
  }
  
  // Para APIs e dados - Network First
  if (url.pathname.startsWith('/api') || url.hostname !== location.hostname) {
    return networkFirst(request, DYNAMIC_CACHE_NAME);
  }
  
  // Fallback para outros recursos
  return networkFirstWithCacheFallback(request, DYNAMIC_CACHE_NAME);
}

// Estratégia Cache First
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Cache First failed', error);
    // Fallback para página offline se disponível
    if (request.destination === 'document') {
      const offlinePage = await cache.match('/');
      return offlinePage || new Response('Offline', { status: 503 });
    }
    throw error;
  }
}

// Estratégia Network First
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Estratégia Network First com fallback para cache
async function networkFirstWithCacheFallback(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Se não há cache, tentar servir a página inicial para SPAs
    if (request.destination === 'document') {
      const fallback = await cache.match('/');
      return fallback || new Response('App offline. Verifique sua conexão.', { 
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    throw error;
  }
}

// Message event para comunicação com o app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_INVALIDATE') {
    caches.delete(DYNAMIC_CACHE_NAME);
  }
});

// Background sync para quando voltar online
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background Sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Aqui você pode implementar lógica para sincronizar dados quando voltar online
      console.log('Sincronizando dados em background...')
    );
  }
});

// Push notifications (para futuras implementações)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do seu salão',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Sistema do Salão', options)
  );
});