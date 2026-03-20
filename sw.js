const CACHE = 'alphadesk-v1';
const SHELL = [
  '/AlphaDesk/',
  '/AlphaDesk/index.html',
  '/AlphaDesk/manifest.json',
  'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap'
];

// Install — cache app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — serve from cache for app shell, network for API calls
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Always go to network for API calls
  if(url.includes('api.upstox.com') || url.includes('api.anthropic.com') || url.includes('corsproxy.io')) {
    return e.respondWith(fetch(e.request).catch(() => new Response('{"error":"offline"}', {headers:{'Content-Type':'application/json'}})));
  }

  // Cache-first for app shell
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(resp => {
        if(resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match('/AlphaDesk/index.html'));
    })
  );
});

// Background sync — notify when token is about to expire
self.addEventListener('periodicsync', e => {
  if(e.tag === 'token-check') {
    e.waitUntil(checkAndNotify());
  }
});

async function checkAndNotify() {
  // Will be implemented via push notifications in future
}
