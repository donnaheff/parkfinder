const CACHE_NAME = 'parkswift-v2';
const ASSETS = ['/', '/manifest.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (new URL(event.request.url).pathname.startsWith('/api/')) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).catch(() => caches.match('/'))));
});
