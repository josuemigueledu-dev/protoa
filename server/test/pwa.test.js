import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createApp } from '../src/app.js';

// The installable German course: manifest, icons, and the service worker (apps/deutsch/sw.js),
// which runs here in a sandbox with fake caches and fetch. No browser and no network.
const APP = new URL('../../apps/deutsch/', import.meta.url);
const read = p => readFileSync(new URL(p, APP), 'utf8');
const ORIGIN = 'http://localhost';
const SCOPE = ORIGIN + '/deutsch/';
// /deutsch/... is served from apps/deutsch, /shared/... from shared
const onDisk = href => { const p = new URL(href).pathname; return new URL('../..' + (p.startsWith('/deutsch/') ? '/apps' + p : p), APP); };
const pngSize = buf => [buf.readUInt32BE(16), buf.readUInt32BE(20)];

test('the web manifest is installable: scope, start page and icons that exist at their stated sizes', () => {
  const m = JSON.parse(read('manifest.webmanifest'));
  const base = SCOPE + 'manifest.webmanifest';
  assert.equal(new URL(m.start_url, base).href, SCOPE);
  assert.equal(new URL(m.scope, base).href, SCOPE);
  assert.equal(new URL(m.id, base).href, SCOPE);
  assert.ok(m.name && m.short_name && m.short_name.length <= 12, 'short_name fits under a home-screen icon');
  assert.ok(['standalone', 'fullscreen'].includes(m.display));
  assert.match(m.background_color, /^#[0-9a-f]{6}$/i);
  for (const icon of m.icons) {
    const file = new URL(icon.src, APP);
    assert.ok(existsSync(file), icon.src + ' exists (npm run icons)');
    assert.equal(pngSize(readFileSync(file)).join('x'), icon.sizes, icon.src);
  }
  const has = (size, purpose) => m.icons.some(i => i.sizes === size && i.purpose.split(' ').includes(purpose));
  assert.ok(has('192x192', 'any') && has('512x512', 'any') && has('512x512', 'maskable'));
});

test('index.html links the manifest and the Apple touch icon, and registers the service worker last', () => {
  const html = read('index.html');
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
  const touch = /<link rel="apple-touch-icon" href="([^"]+)">/.exec(html);
  assert.ok(touch && existsSync(new URL(touch[1], APP)));
  assert.equal(pngSize(readFileSync(new URL(touch[1], APP))).join('x'), '180x180');
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  assert.equal(scripts.at(-1), 'js/pwa.js');
  assert.match(read('js/pwa.js'), /serviceWorker\.register\('sw\.js'\)/);
});

test('the server serves the manifest and the service worker with the right types', async () => {
  const app = createApp();
  const m = await app.request('/deutsch/manifest.webmanifest');
  assert.equal(m.status, 200);
  assert.match(m.headers.get('content-type'), /^application\/manifest\+json/);
  const sw = await app.request('/deutsch/sw.js');
  assert.equal(sw.status, 200);
  assert.match(sw.headers.get('content-type'), /javascript/);
  for (const icon of ['icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png']) {
    assert.equal((await app.request('/deutsch/' + icon)).headers.get('content-type'), 'image/png', icon);
  }
});

/* ---------- the service worker in a sandbox ---------- */

const res = (body, { status = 200, date = new Date().toUTCString(), type = 'basic' } = {}) => {
  const r = new Response(body, { status, headers: { date } });
  Object.defineProperty(r, 'type', { value: type });
  return r;
};
const key = r => (typeof r === 'string' ? r : r.url);
const req = (path, { mode = 'no-cors', method = 'GET', headers = {} } = {}) => ({ url: new URL(path, SCOPE).href, mode, method, headers: new Headers(headers) });

function fakeCaches() {
  const stores = new Map();
  const open = async name => {
    if (!stores.has(name)) {
      const m = new Map();
      stores.set(name, {
        m,
        async put(r, response) { m.set(key(r), response); },
        async match(r, opts = {}) {
          const k = opts.ignoreSearch ? key(r).split('?')[0] : key(r);
          const hit = m.get(k) ?? (opts.ignoreSearch ? [...m].find(([u]) => u.split('?')[0] === k)?.[1] : undefined);
          return hit && hit.clone();
        },
      });
    }
    return stores.get(name);
  };
  return { stores, open, keys: async () => [...stores.keys()], delete: async name => stores.delete(name) };
}

// fetchImpl(url) answers each network request; slow=true makes every timer fire at once.
function loadSW({ fetchImpl, slow = false, caches = fakeCaches() }) {
  const listeners = {};
  const fetched = [];
  const self = {
    location: new URL(SCOPE + 'sw.js'),
    addEventListener: (type, fn) => { listeners[type] = fn; },
    skipWaiting: async () => {}, clients: { claim: async () => {} },
  };
  const ctx = vm.createContext({
    self, caches, URL, Headers, Response, console,
    fetch: async (r, opts) => { fetched.push(key(r)); return fetchImpl(key(r), opts); },
    setTimeout: (fn, ms) => (slow ? (queueMicrotask(fn), 1) : 1), clearTimeout: () => {},
  });
  vm.runInContext(read('sw.js'), ctx, { filename: 'sw.js' });
  const sw = { ctx, caches, fetched };
  sw.fire = async (type, request) => {
    let reply; const waits = [];
    listeners[type]({ request, respondWith: p => { reply = p; }, waitUntil: p => waits.push(p) });
    sw.reply = reply;
    const out = await reply;
    await Promise.all(waits);
    return out;
  };
  sw.cache = async () => (await caches.open([...caches.stores.keys()][0] ?? 'none')).m;
  return sw;
}

const files = { [SCOPE]: read('index.html') };
const site = url => {
  if (url in files) return res(files[url]);
  const file = onDisk(url);
  return existsSync(file) ? res(readFileSync(file)) : res('missing', { status: 404 });
};

test('every file the real index.html loads, and every warm picture, is on disk and same-origin', () => {
  const { ctx } = loadSW({ fetchImpl: site });
  const shell = ctx.shellUrls(read('index.html'), SCOPE);
  for (const p of ['js/content.js', 'js/boot.js', 'js/pwa.js', 'css/night-glass.css', 'manifest.webmanifest', 'icons/apple-touch-icon.png']) {
    assert.ok(shell.includes(SCOPE + p), p);
  }
  assert.ok(shell.some(u => u.endsWith('.woff2')), 'the preloaded fonts are cached');
  assert.ok(shell.includes(ORIGIN + '/shared/art/tokens.css'), 'files under /shared are cached too');
  const warm = vm.runInContext('WARM', ctx).map(p => new URL(p, SCOPE).href);
  for (const u of [...shell, ...warm]) {
    assert.equal(new URL(u).origin, ORIGIN, u);
    assert.ok(existsSync(onDisk(u)), u + ' is missing on disk');
  }
});

test('requests are sorted: /api, POST, other origins and ranges are left alone; code goes network first; pictures cache first', () => {
  const { ctx } = loadSW({ fetchImpl: site });
  const how = (path, o) => ctx.strategy(req(path, o), ORIGIN);
  assert.equal(how('/api/health'), 'skip');
  assert.equal(how('/api/deutsch/ai/talkTurn', { method: 'POST' }), 'skip');
  assert.equal(how('https://fonts.example/x.woff2'), 'skip');
  assert.equal(how('audio/weber/abc.mp3', { headers: { range: 'bytes=0-' } }), 'skip');
  assert.equal(how('./', { mode: 'navigate' }), 'network');
  assert.equal(how('?lesson=3', { mode: 'navigate' }), 'network');
  for (const p of ['js/core.js', 'css/base.css', 'art/manifest.json', 'audio/manifest.json', 'manifest.webmanifest']) assert.equal(how(p), 'network', p);
  for (const p of ['art/night/orb.png', 'art/night/scenes/cafe.jpg', '/shared/fonts/krona-one-latin.woff2', 'audio/weber/abc.mp3']) assert.equal(how(p), 'cache', p);
});

test('install caches index.html, its files and the warm art, and survives one missing picture', async () => {
  const sw = loadSW({ fetchImpl: url => (url.endsWith('scenes/bar.jpg') ? Promise.reject(new TypeError('offline')) : site(url)) });
  await sw.fire('install');
  const cached = await sw.cache();
  assert.ok(cached.has(SCOPE));
  assert.ok(cached.has(SCOPE + 'js/boot.js') && cached.has(SCOPE + 'art/night/scenes/cafe.jpg'));
  assert.ok(!cached.has(SCOPE + 'art/night/scenes/bar.jpg'));
  assert.equal(vm.runInContext('WARM.length', sw.ctx) + sw.ctx.shellUrls(files[SCOPE], SCOPE).length, cached.size);
});

test('install fails when index.html cannot be fetched, so a broken copy is never installed', async () => {
  const sw = loadSW({ fetchImpl: () => res('down', { status: 503 }) });
  await assert.rejects(sw.fire('install'), /index\.html: 503/);
});

test('online, code comes from the network and refreshes the cache; offline, from the cache', async () => {
  let online = true, version = 'v1';
  const sw = loadSW({ fetchImpl: () => (online ? res(version) : Promise.reject(new TypeError('Failed to fetch'))) });
  assert.equal(await (await sw.fire('fetch', req('js/core.js'))).text(), 'v1');
  version = 'v2';
  assert.equal(await (await sw.fire('fetch', req('js/core.js'))).text(), 'v2', 'an update shows on the next load');
  online = false;
  assert.equal(await (await sw.fire('fetch', req('js/core.js'))).text(), 'v2');
  await assert.rejects(sw.fire('fetch', req('js/never-loaded.js')), /Failed to fetch/);
});

test('offline, any page in the app opens the cached index.html', async () => {
  let online = true;
  const sw = loadSW({ fetchImpl: () => (online ? res('<html>app</html>') : Promise.reject(new TypeError('offline'))) });
  await sw.fire('fetch', req('./', { mode: 'navigate' }));
  online = false;
  assert.equal(await (await sw.fire('fetch', req('./?from=homescreen', { mode: 'navigate' }))).text(), '<html>app</html>');
  assert.equal(await (await sw.fire('fetch', req('index.html', { mode: 'navigate' }))).text(), '<html>app</html>');
});

test('on a slow network the cached copy answers, and the late response still refreshes the cache', async () => {
  let release;
  const caches = fakeCaches();
  (await caches.open('protoa-deutsch-v1')).put(SCOPE + 'js/ui.js', res('old'));
  const sw = loadSW({ caches, slow: true, fetchImpl: () => new Promise(r => { release = () => r(res('new')); }) });
  const handled = sw.fire('fetch', req('js/ui.js'));
  assert.equal(await (await sw.reply).text(), 'old', 'answered before the network replies');
  release();
  await handled;
  assert.equal(await (await sw.cache()).get(SCOPE + 'js/ui.js').text(), 'new');
});

test('errors are passed through and not cached', async () => {
  const sw = loadSW({ fetchImpl: () => res('nope', { status: 404 }) });
  assert.equal((await sw.fire('fetch', req('js/gone.js'))).status, 404);
  assert.equal((await sw.cache()).size, 0);
});

test('pictures come from the cache; a copy older than 12 hours is refreshed in the background', async () => {
  const caches = fakeCaches();
  const c = await caches.open('protoa-deutsch-v1');
  c.put(SCOPE + 'art/night/orb.png', res('fresh'));
  c.put(SCOPE + 'art/night/ground.jpg', res('old', { date: new Date(Date.now() - 13 * 3600e3).toUTCString() }));
  const sw = loadSW({ caches, fetchImpl: () => res('network') });
  assert.equal(await (await sw.fire('fetch', req('art/night/orb.png'))).text(), 'fresh');
  assert.equal(await (await sw.fire('fetch', req('art/night/ground.jpg'))).text(), 'old');
  assert.deepEqual(sw.fetched, [SCOPE + 'art/night/ground.jpg']);
  assert.equal(await c.m.get(SCOPE + 'art/night/ground.jpg').text(), 'network');
  assert.equal(await (await sw.fire('fetch', req('art/night/scenes/flat.jpg'))).text(), 'network', 'not cached yet: from the network');
  assert.ok(c.m.has(SCOPE + 'art/night/scenes/flat.jpg'));
});

test('activate removes older versions of this app\'s cache and leaves other caches alone', async () => {
  const caches = fakeCaches();
  for (const n of ['protoa-deutsch-v0', 'protoa-deutsch-v1', 'protoa-other-v1']) await caches.open(n);
  const sw = loadSW({ caches, fetchImpl: site });
  await sw.fire('activate');
  assert.deepEqual((await caches.keys()).sort(), ['protoa-deutsch-v1', 'protoa-other-v1']);
});

test('requests the worker skips get no answer from it', async () => {
  const sw = loadSW({ fetchImpl: site });
  assert.equal(await sw.fire('fetch', req('/api/health')), undefined);
  assert.deepEqual(sw.fetched, []);
});
