const assert = require('node:assert/strict');
const { test } = require('node:test');
const setupInstallPrompt = require('../install-prompt.js');

function browser({ navigator = {}, standalone = false, secure = true, protocol = 'https:', storage = new Map() } = {}) {
  const attributes = new WeakMap();
  const document = { activeElement: null, getElementById: id => elements[id], querySelector: () => nav };
  function element() {
    const node = Object.assign(new EventTarget(), {
      hidden: true,
      dataset: {},
      focus: () => { document.activeElement = node; },
      setAttribute: (name, value) => attributes.get(node).set(name, value),
      removeAttribute: name => attributes.get(node).delete(name),
      getAttribute: name => attributes.get(node).get(name),
      click: () => node.dispatchEvent(new Event('click'))
    });
    attributes.set(node, new Map());
    return node;
  }
  const tip = element();
  const action = element();
  const dismiss = element();
  const guide = element();
  const entry = element();
  const nav = element();
  tip.contains = node => [tip, action, dismiss, guide].includes(node);
  const elements = { 'install-tip': tip, 'install-action': action, 'install-guide': guide,
    'dismiss-install-tip': dismiss, 'show-install-tip': entry };
  const view = Object.assign(new EventTarget(), {
    isSecureContext: secure,
    document,
    navigator: { userAgent: 'Desktop Chrome', ...navigator },
    location: { protocol },
    matchMedia: () => Object.assign(new EventTarget(), { matches: standalone }),
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key) }
  });
  setupInstallPrompt(view, key => key);
  return { view, document, tip, action, dismiss, guide, entry, nav, storage };
}

function fireInstallPrompt(view, prompt) {
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt });
  view.dispatchEvent(event);
  assert(event.defaultPrevented);
}

test('shows the iPhone and iPad share instructions without a native prompt', () => {
  for (const navigator of [{ userAgent: 'iPhone Safari' }, { userAgent: 'Macintosh Safari', platform: 'MacIntel', maxTouchPoints: 5 }]) {
    const { tip, action, guide } = browser({ navigator });
    assert.equal(tip.hidden, false);
    assert.equal(action.textContent, 'installHelp');
    assert.equal(guide.hidden, true);
    action.click();
    assert.equal(guide.hidden, false);
    assert.equal(guide.textContent, 'installGuideIOS');
    assert.equal(action.getAttribute('aria-expanded'), 'true');
    action.click();
    assert.equal(guide.hidden, true);
  }
});

test('uses one click to start the native prompt and falls back to instructions if dismissed', async () => {
  const { view, tip, action, guide } = browser();
  let calls = 0;
  let finish;
  fireInstallPrompt(view, () => {
    calls++;
    return new Promise(resolve => { finish = resolve; });
  });
  assert.equal(action.textContent, 'installNow');
  assert.equal(action.getAttribute('aria-expanded'), undefined);
  action.click();
  action.click();
  assert.equal(calls, 1);
  finish({ outcome: 'dismissed' });
  await new Promise(setImmediate);
  assert.equal(tip.hidden, false);
  assert.equal(action.textContent, 'installHelp');
  action.click();
  assert.equal(guide.hidden, false);
  assert.equal(calls, 1);
});

test('hides the tip after installation and offers it again when the browser reports eligibility', async () => {
  const { view, tip, action, entry, storage } = browser();
  fireInstallPrompt(view, async () => ({ outcome: 'accepted' }));
  action.click();
  await new Promise(setImmediate);
  assert.equal(tip.hidden, true);
  assert.equal(entry.hidden, true);
  const next = browser({ storage });
  assert.equal(next.tip.hidden, true);
  fireInstallPrompt(next.view, async () => ({ outcome: 'dismissed' }));
  assert.equal(next.tip.hidden, false);
  assert.equal(next.action.textContent, 'installNow');
});

test('remembers dismissal and restores the prompt from the footer', () => {
  const first = browser();
  first.dismiss.click();
  assert.equal(first.tip.hidden, true);
  assert.equal(first.entry.hidden, false);
  assert.equal(first.document.activeElement, first.nav);
  const next = browser({ storage: first.storage });
  assert.equal(next.tip.hidden, true);
  next.entry.click();
  assert.equal(next.tip.hidden, false);
  assert.equal(next.entry.hidden, true);
  assert.equal(next.document.activeElement, next.action);
});

test('keeps the tip hidden in standalone windows and outside a secure web page', () => {
  assert.equal(browser({ standalone: true }).tip.hidden, true);
  assert.equal(browser({ navigator: { standalone: true } }).tip.hidden, true);
  assert.equal(browser({ secure: false, protocol: 'http:' }).tip.hidden, true);
  assert.equal(browser({ protocol: 'file:' }).tip.hidden, true);
});
