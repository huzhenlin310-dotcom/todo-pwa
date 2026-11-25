const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const { resolve } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const root = resolve(__dirname, '..');
const scope = 'https://example.test/todo/';

test('precaches the application at a GitHub Pages-style path and serves it offline', async () => {
  const source = await readFile(resolve(root, 'service-worker.js'), 'utf8');
  const registrations = {};
  const cacheEntries = new Map();
  const deleted = [];
  const cachePrefix = `long-term-goals-todo:${scope}:`;
  let claimed = false;
  let offline = false;
  const cache = {
    async addAll(requests) {
      for (const request of requests) {
        assert.equal(request.cache, 'reload');
        assert(request.url.startsWith(scope));
        const file = request.url.slice(scope.length) || 'index.html';
        cacheEntries.set(request.url, await readFile(resolve(root, file)));
      }
    },
    async match(key) { return cacheEntries.get(key); }
  };
  vm.runInNewContext(source, {
    URL, Request,
    self: {
      registration: { scope }, clients: { async claim() { claimed = true; } },
      addEventListener(name, action) { registrations[name] = action; }
    },
    caches: {
      async open(name) { assert.equal(name, `${cachePrefix}source`); return cache; },
      async keys() { return [`${cachePrefix}source`, `${cachePrefix}old`, 'another-app']; },
      async delete(name) { deleted.push(name); }
    },
    async fetch() { assert(!offline, 'Offline requests must be served from the cache'); }
  });

  function waitForEvent(name) {
    let work;
    registrations[name]({ waitUntil(promise) { work = promise; } });
    return work;
  }
  function request(url, mode = 'navigate', method = 'GET') {
    let response;
    registrations.fetch({ request: { url, mode, method }, respondWith(promise) { response = promise; } });
    return response;
  }

  await waitForEvent('install');
  await waitForEvent('activate');
  assert(claimed);
  assert.deepEqual(deleted, [`${cachePrefix}old`]);
  offline = true;
  const page = await request(`${scope}index.html?launch=1`);
  assert.match(page.toString('utf8'), /<link rel="manifest" href="\.\/manifest\.webmanifest">/);
  for (const file of ['styles.css', 'app.js', 'task-store.js', 'manifest.webmanifest']) {
    assert((await request(scope + file, 'same-origin')).length > 0, `${file} should work offline`);
  }
  assert.equal((await request(scope)).toString('utf8'), page.toString('utf8'));
  assert.equal(request('https://example.test/another-app/'), undefined);
  assert.equal(request(scope, 'navigate', 'POST'), undefined);

  const manifest = JSON.parse(await request(`${scope}manifest.webmanifest`, 'same-origin'));
  assert.equal(new URL(manifest.start_url, scope).href, scope);
  assert.equal(manifest.display, 'standalone');
  for (const size of [192, 512]) {
    const icon = manifest.icons.find(icon => icon.sizes === `${size}x${size}`);
    const bytes = await request(new URL(icon.src, scope).href, 'same-origin');
    assert.equal(bytes.readUInt32BE(16), size);
    assert.equal(bytes.readUInt32BE(20), size);
  }
});
