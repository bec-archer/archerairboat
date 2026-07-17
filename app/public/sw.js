// Archer Airboat Tours — service worker
// Strategy:
//  - App shell (HTML/CSS/JS/icons): network-first with cache fallback, so the
//    operator app opens offline with the last-seen UI.
//  - Supabase API calls are NOT intercepted; the app layer keeps its own
//    last-known-rides snapshot in the Cache API via postMessage (see lib/offline.ts).
//  - Cache version bumps on deploy via the ?v= param in the register call.

const CACHE = 'archer-shell-v1';
const OFFLINE_URLS = ['/', '/calendar/', '/today/', '/login/', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('archer-shell-') && k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Never intercept cross-origin (Supabase, Turnstile) or non-GET requests.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(event.request).then((hit) => hit || caches.match('/'))
      )
  );
});
