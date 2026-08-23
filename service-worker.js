/**
 * LegioCert Pro - Service Worker
 * Cache offline completo, estrategia Cache-First para assets
 */

const CACHE_NAME = 'legiocert-pro-v1';
const CACHE_STATIC = 'legiocert-static-v1';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './config.js',
  './db.js',
  './clientes.js',
  './instalaciones.js',
  './calculadora.js',
  './legionella.js',
  './gps.js',
  './firma.js',
  './fotos.js',
  './pdf.js',
  './historial.js',
  './dashboard.js',
  './agenda.js',
  './productos.js',
  './manifest.json',
];

// ─── INSTALL ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => {
        console.log('[SW] Cacheando assets estáticos');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Error en install:', err))
  );
});

// ─── ACTIVATE ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_STATIC && key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Eliminando cache antigua:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Solo interceptar requests del mismo origen o assets locales
  if (event.request.method !== 'GET') return;

  // Para la API de Nominatim (geocodificación), Network-First
  if (url.hostname === 'nominatim.openstreetmap.org') {
    event.respondWith(networkFirstWithFallback(event.request));
    return;
  }

  // Para el resto de assets: Cache-First
  event.respondWith(cacheFirst(event.request));
});

// Cache-First: sirve desde cache, actualiza en background
const cacheFirst = async (request) => {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_STATIC);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Recurso no disponible offline', { status: 503 });
  }
};

// Network-First: intenta red, cae a cache si falla
const networkFirstWithFallback = async (request) => {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'Offline' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503,
    });
  }
};

// ─── BACKGROUND SYNC (futuro) ─────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tratamientos') {
    // Aquí iría la sincronización con Firebase/Supabase
    console.log('[SW] Background sync: tratamientos');
  }
});

// ─── PUSH NOTIFICATIONS (futuro) ──────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'LegioCert Pro', {
      body: data.body || 'Tienes una revisión pendiente',
      icon: './assets/icons/icon-192.png',
      badge: './assets/icons/icon-72.png',
      data: data.url || '/',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || '/'));
});
