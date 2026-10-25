/* Protoa service worker for the German course: the installed app keeps working offline.
   - Install: caches index.html, everything it loads (scripts, styles, fonts, icons) and the painted art in WARM.
   - Pages, code and data: network first, so an update shows on the next load; the cached copy is used
     when offline or when the network takes longer than SLOW_MS.
   - Images, fonts and audio: cache first; a copy older than STALE_MS is refreshed in the background.
   - /api is never cached (AI turns itself off offline), nor are other origins or non-GET requests. */
const CACHE = 'protoa-deutsch-v1';
const SLOW_MS = 4000;
const STALE_MS = 12 * 60 * 60 * 1000;
// Art the scripts load by name (not listed in index.html), so lessons never opened online still have their pictures.
const WARM = [
  'art/night/orb.png', 'art/night/ground.jpg', 'art/night/scene.jpg',
  'art/night/ava-ana.jpg', 'art/night/ava-lena.jpg', 'art/night/ava-murat.jpg', 'art/night/ava-weber.jpg',
  'art/night/scenes/bar.jpg', 'art/night/scenes/cafe.jpg', 'art/night/scenes/classroom.jpg',
  'art/night/scenes/feld.jpg', 'art/night/scenes/flat.jpg', 'art/night/scenes/hermannplatz.jpg',
  'art/night/scenes/market.jpg', 'art/night/scenes/neukoelln.jpg', 'art/night/scenes/ubahn.jpg',
];
const CODE = /\.(html|js|mjs|css|json|webmanifest)$/;

// Same-origin files index.html loads: <script src>, <link href> (stylesheets, preloads, icons, manifest).
function shellUrls(html, base) {
  const out = new Set();
  for (const [tag] of html.matchAll(/<(script|link)\b[^>]*>/gi)) {
    const ref = /\b(?:src|href)="([^"]+)"/i.exec(tag);
    if (!ref || /\brel="(preconnect|dns-prefetch)"/i.test(tag)) continue;
    const url = new URL(ref[1], base);
    if (url.origin === new URL(base).origin) out.add(url.href);
  }
  return [...out];
}

// 'skip' (browser handles it), 'network' (network first) or 'cache' (cache first).
function strategy(request, origin) {
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== origin) return 'skip';
  if (url.pathname.startsWith('/api/') || request.headers.get('range')) return 'skip';
  if (request.mode === 'navigate' || url.pathname.endsWith('/') || CODE.test(url.pathname)) return 'network';
  return 'cache';
}

const indexUrl = () => new URL('./', self.location).href;

async function put(cache, request, response) {
  if (response && response.ok && response.type === 'basic') await cache.put(request, response.clone());
  return response;
}

async function precache() {
  const cache = await caches.open(CACHE);
  const index = await fetch(indexUrl(), { cache: 'no-cache' });
  if (!index.ok) throw new Error('index.html: ' + index.status);
  await put(cache, indexUrl(), index);
  const urls = [...shellUrls(await index.text(), indexUrl()), ...WARM.map(p => new URL(p, indexUrl()).href)];
  // One missing picture must not stop the app installing.
  await Promise.all(urls.map(u => fetch(u, { cache: 'no-cache' }).then(r => put(cache, u, r)).catch(() => {})));
}

async function networkFirst(event) {
  const { request } = event;
  const cache = await caches.open(CACHE);
  const fromCache = () => cache.match(request, { ignoreSearch: request.mode === 'navigate' })
    .then(hit => hit || (request.mode === 'navigate' ? cache.match(indexUrl()) : undefined));
  const fromNet = fetch(request).then(r => put(cache, request, r));
  event.waitUntil(fromNet.catch(() => {}));
  let timer;
  const slow = new Promise(resolve => { timer = setTimeout(resolve, SLOW_MS); });
  try {
    const first = await Promise.race([fromNet, slow.then(fromCache)]);
    if (first) return first;
    return await fromNet; // slow and nothing cached: keep waiting for the network
  } catch (e) {
    const hit = await fromCache();
    if (hit) return hit;
    throw e;
  } finally { clearTimeout(timer); }
}

async function cacheFirst(event) {
  const { request } = event;
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  const refresh = () => fetch(request).then(r => put(cache, request, r));
  if (!hit) return refresh();
  const age = Date.now() - Date.parse(hit.headers.get('date') || '');
  if (!(age < STALE_MS)) event.waitUntil(refresh().catch(() => {}));
  return hit;
}

self.addEventListener('install', event => event.waitUntil(precache().then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('protoa-deutsch-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const how = strategy(event.request, self.location.origin);
  if (how === 'network') event.respondWith(networkFirst(event));
  else if (how === 'cache') event.respondWith(cacheFirst(event));
});
