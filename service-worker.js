const CACHE_VERSION = 'source';
const scope = new URL(self.registration.scope);
const prefix = `long-term-goals-todo:${scope.href}:`;
const cacheName = `${prefix}${CACHE_VERSION}`;
const shell = scope.href;
const index = new URL('index.html', scope).pathname;
const assets = new Set(['./', 'styles.css', 'task-store.js', 'install-prompt.js', 'app.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png']
  .map(path => new URL(path, scope).href));

self.addEventListener('install', event => {
  const requests = [...assets].map(url => new Request(url, { cache: 'reload' }));
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(requests)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(prefix) && name !== cacheName)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== scope.origin) return;
  const appPage = request.mode === 'navigate' && (url.pathname === scope.pathname || url.pathname === index);
  const key = appPage ? shell : url.href;
  if (!assets.has(key)) return;

  // Keep a page and its assets on the same release. A new worker waits for old tabs to close.
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const response = await cache.match(key);
    return response ?? fetch(request);
  })());
});
