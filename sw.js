/* Pulse Мозг — офлайн-режим.
   Приложение и Мозг работают без интернета; запросы к таблице и API всегда идут в сеть. */
const CACHE = 'pulse-brain-v12';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // живые данные — только из сети, никакого кэша
  if (url.indexOf('script.google.com') > -1 ||
      url.indexOf('googleusercontent.com') > -1 ||
      url.indexOf('api.anthropic.com') > -1) {
    return;
  }
  if (e.request.method !== 'GET') return;
  // остальное: сначала сеть, при отсутствии интернета — из кэша
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
