const CACHE = 'canopy-run-v2';
const ASSETS = [
  './index.html',
  './style.css',
  './manifest.json',
  './manifest.webmanifest',
  './src/config.js',
  './src/main.js',
  './src/engine/audio.js',
  './src/engine/camera.js',
  './src/engine/input.js',
  './src/engine/loop.js',
  './src/engine/renderer.js',
  './src/engine/storage.js',
  './src/engine/touch.js',
  './src/game/chunks.js',
  './src/game/collectibles.js',
  './src/game/particles.js',
  './src/game/player.js',
  './src/game/world.js',
  './src/util/math.js',
  './src/util/pool.js',
  './src/util/rng.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Only handle same-origin requests.
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return res;
      }).catch(() => {
        if (e.request.mode === 'navigate') return caches.match('./index.html');
        return undefined;
      });
    })
  );
});