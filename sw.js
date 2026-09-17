const CACHE_NAME = 'catatan-shopiput-v70';
const ROOT = new URL('./', self.registration.scope).href;
const ASSETS = [
  './manifest.json',
  './fontawesome-offline.css',
  './fontawesome-webfont.ttf',
  './icon-192.png',
  './icon-512.png',
  './screenshot-mobile.png',
  './screenshot-desktop.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Cache the actual deployed root page. This avoids relying on /index.html
    // being a separately routable URL on Cloudflare.
    try {
      const response = await fetch(ROOT, { cache: 'no-store' });
      if (response.ok) await cache.put(ROOT, response.clone());
    } catch (e) {
      console.error('Shopiput root cache failed', e);
    }
    for (const asset of ASSETS) {
      try {
        const response = await fetch(new URL(asset, self.registration.scope), { cache: 'no-store' });
        if (response.ok) await cache.put(new URL(asset, self.registration.scope).href, response.clone());
      } catch (e) {
        console.warn('Shopiput asset cache skipped', asset, e);
      }
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key !== CACHE_NAME) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    if (cached) return cached;

    try {
      const response = await fetch(event.request);
      if (response && response.ok) await cache.put(event.request, response.clone());
      return response;
    } catch (e) {
      if (event.request.mode === 'navigate') {
        return (await cache.match(ROOT)) || new Response('Catatan Shopiput sedang offline.', {
          status: 503,
          headers: {'Content-Type':'text/plain; charset=utf-8'}
        });
      }
      return new Response('', {status: 504});
    }
  })());
});
