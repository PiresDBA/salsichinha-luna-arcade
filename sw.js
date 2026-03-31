const CACHE_NAME = 'luna-arcade-v39.7';
const ASSETS = [
  '/',
  '/index.html',
  '/main.js',
  '/style.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/luna-menu-transparent.png',
  '/luna-icon.png',
  '/frida-game.png',
  '/Cinder-game.png',
  '/urso-sem-fundo.png',
  '/luna-latindo.mp3',
  '/bgm.mp3',
  '/cartoon_bgm.mp3',
  '/bear1.mp3',
  '/bear2.mp3',
  '/bear3.mp3',
  '/crow.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
