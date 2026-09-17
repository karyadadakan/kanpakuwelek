const CACHE_NAME = "catatan-shopiput-offline-v71";
const ROOT = new URL("./", self.registration.scope).href;
const INDEX = new URL("./index.html", self.registration.scope).href;

const ASSETS = [
  ROOT,
  INDEX,
  new URL("./manifest.json", self.registration.scope).href,
  new URL("./icon-192.png", self.registration.scope).href,
  new URL("./icon-512.png", self.registration.scope).href,
  new URL("./screenshot-mobile.png", self.registration.scope).href,
  new URL("./screenshot-desktop.png", self.registration.scope).href,
  new URL("./fontawesome-offline.css", self.registration.scope).href,
  new URL("./fontawesome-webfont.ttf", self.registration.scope).href
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    for (const url of ASSETS) {
      try {
        const response = await fetch(url, {cache:"no-store"});
        if (response.ok) await cache.put(url, response.clone());
      } catch (e) {
        console.warn("Cache skip:", url);
      }
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const request = event.request;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);

      // Match exact request first.
      const cached = await cache.match(request);
      if (cached) return cached;

      // Offline PWA launch uses ROOT, so this is the critical fallback.
      if (url.origin === self.location.origin) {
        const root = await cache.match(ROOT);
        if (root) return root;
      }

      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response.clone());
        }
        return response;
      } catch (e) {
        const root = await cache.match(ROOT);
        return root || new Response("Catatan Shopiput sedang offline.", {
          status: 503,
          headers: {"Content-Type":"text/plain;charset=utf-8"}
        });
      }
    })());
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch (e) {
        return Response.error();
      }
    })());
  }
});
