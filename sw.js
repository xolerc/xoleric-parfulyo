const CACHE = 'xoleric-v4';
const ASSETS = [
  '.',
  'index.html',
  'style.css',
  'pwa-manifest.json',
  'icon.png',
  'js/db.js',
  'js/engine.js',
  'js/main.js',
  'js/chat.js',
  'js/repos.js',
  'js/youtube.js',
  'js/playme.js',
  'js/music.js',
  'bg-music.mp3',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      return Promise.allSettled(
        ASSETS.map(url => c.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim()).then(() => {
      return self.clients.matchAll().then(clients => {
        clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' }))
      })
    })
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.origin === 'https://xolerc.github.io' && url.pathname.startsWith('/me/videos/')) {
    e.respondWith(
      caches.open(CACHE + '-media').then(c => {
        return c.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(res => {
            if (res.ok) {
              const clone = res.clone();
              c.put(request, clone).catch(() => {});
            }
            return res;
          }).catch(() => new Response('Video offline', { status: 503 }));
        });
      })
    );
    return;
  }

  if (url.hostname.includes('firebaseio') || url.hostname === 'api.github.com') {
    e.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ offline: true }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE + '-fonts').then(c => {
        return c.match(request).then(cached => cached || fetch(request).then(res => {
          const clone = res.clone();
          c.put(request, clone).catch(() => {});
          return res;
        }));
      })
    );
    return;
  }

  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        if (res.ok && url.protocol === 'https:' &&
            !url.hostname.includes('firebaseio') &&
            url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone)).catch(() => {});
        }
        return res;
      });
    }).catch(() => {
      if (url.pathname === '/' || url.pathname === '/index.html') {
        return caches.match('index.html').then(fallback => {
          return fallback || new Response('Offline', { status: 503 });
        });
      }
      return new Response('Offline', { status: 503 });
    })
  );
});
