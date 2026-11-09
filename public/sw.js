/**
 * Operation ME - Tactical Service Worker
 * Precaches app shell & static assets, protects authenticated API calls,
 * and delivers clear offline feedback.
 */

const CACHE_VERSION = 'op-me-v1.0.2';
const STATIC_CACHE = `op-me-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `op-me-runtime-${CACHE_VERSION}`;

// Core static assets to precache during install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/logo.svg',
];

// Install: precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      // Use individual puts so a single failure does not abort the entire precache
      for (const url of PRECACHE_ASSETS) {
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (res.ok) {
            await cache.put(url, res);
          }
        } catch (err) {
          // Precache individual asset fallback
        }
      }
    })
  );
  // Do not automatically skipWaiting here so user can see the "Update available" toast
});

// Activate: clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== RUNTIME_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Message listener: allows client UI to trigger immediate activation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. NON-GET REQUESTS (POST, PUT, PATCH, DELETE)
  // Must NEVER be cached. If offline, fail with a clear, loud message so the app never fails silently.
  if (request.method !== 'GET') {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            error: 'Offline: Cannot save changes or execute mission directives while disconnected from network.',
            code: 'OFFLINE_WRITE_BLOCKED',
            status: 503,
          }),
          {
            status: 503,
            statusText: 'Offline: Write Blocked',
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // 2. SUPABASE REST / AUTH / API CALLS
  // RULE: NEVER cache authenticated API responses or Supabase data.
  // Always use network-first / network-only.
  const isSupabase = url.hostname.includes('supabase.co');
  const isApiCall = url.pathname.startsWith('/api/') || url.pathname.includes('/rest/v1/');
  const hasAuthHeader = request.headers.has('authorization') || request.headers.has('apikey');

  if (isSupabase || isApiCall || hasAuthHeader) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            error: 'Database connection unreachable. You are currently offline.',
            code: 'OFFLINE_READ_BLOCKED',
            status: 503,
          }),
          {
            status: 503,
            statusText: 'Offline: Network Unavailable',
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // 3. NAVIGATION REQUESTS (HTML Pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If valid response, update runtime cache with latest page shell
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          // Deliver the branded friendly offline screen
          const offlinePage = await caches.match('/offline.html');
          if (offlinePage) return offlinePage;

          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;

          return new Response('You are offline', {
            status: 503,
            headers: { 'Content-Type': 'text/html' },
          });
        })
    );
    return;
  }

  // 4. STATIC ASSETS (_next/static, images, fonts, styles)
  // Stale-While-Revalidate: deliver fast from cache while updating in background
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff2?|css|js)$/i)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              const clone = networkResponse.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 5. DEFAULT FALLBACK
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
