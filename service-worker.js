const CACHE_VERSION = 'source';
const scope = new URL(self.registration.scope);
const prefix = `long-term-goals-todo:${scope.href}:`;
const cacheName = `${prefix}${CACHE_VERSION}`;
const versioned = path => new URL(`${path}?v=${CACHE_VERSION}`, scope).href;
const shell = versioned('./');
const index = new URL('index.html', scope).pathname;
const assets = new Set([shell, ...['styles.css', 'task-store.js', 'install-prompt.js', 'app-update.js', 'app.js'].map(versioned),
  ...['manifest.webmanifest', 'icons/icon-192.png?v=2', 'icons/icon-512.png?v=2', 'icons/apple-touch-icon.png?v=2']
    .map(path => new URL(path, scope).href)]);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    try {
      await cache.addAll([...assets].map(url => new Request(url, { cache: 'reload' })));
      const page = await cache.match(shell);
      if (!(await page.text()).includes(`<meta name="app-build" content="${CACHE_VERSION}">`)) {
        throw new Error('The HTML build does not match the service worker');
      }
    } catch (error) {
      await caches.delete(cacheName);
      throw error;
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'activate-update') return;
  const matches = event.data.build === CACHE_VERSION;
  event.ports[0]?.postMessage(matches);
  if (matches) event.waitUntil(self.skipWaiting());
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

  // Keep the application shell and its assets on the same release.
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const response = await cache.match(key);
    return response ?? fetch(request);
  })());
});
