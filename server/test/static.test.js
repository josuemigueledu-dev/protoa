import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../src/app.js';
import { cachePolicy, MEDIA_MAX_AGE } from '../src/static.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const app = createApp();
const get = (url, headers = {}) => app.request(url, { headers });

test('scripts, styles and pages are revalidated on every load, so an update shows on the next one', async () => {
  for (const url of ['/deutsch/', '/deutsch/js/core.js', '/deutsch/css/base.css', '/deutsch/sw.js', '/deutsch/manifest.webmanifest']) {
    const res = await get(url);
    assert.equal(res.status, 200, url);
    assert.equal(res.headers.get('cache-control'), 'no-cache', url);
    assert.match(res.headers.get('etag') || '', /^W\/".+"$/, url);
  }
});

test('images, fonts and audio are cached for a while', async () => {
  assert.equal(cachePolicy('/deutsch/art/night/orb.png'), `public, max-age=${MEDIA_MAX_AGE}`);
  assert.equal(cachePolicy('/shared/fonts/krona-one-latin.woff2'), `public, max-age=${MEDIA_MAX_AGE}`);
  assert.equal(cachePolicy('/shared/brand/favicon.svg'), `public, max-age=${MEDIA_MAX_AGE}`);
  assert.equal(cachePolicy('/deutsch/audio/abc.mp3'), `public, max-age=${MEDIA_MAX_AGE}`);
  const res = await get('/deutsch/art/night/orb.png');
  assert.equal(res.headers.get('cache-control'), `public, max-age=${MEDIA_MAX_AGE}`);
  assert.equal(res.headers.get('content-type'), 'image/png');
});

test('a matching If-None-Match or If-Modified-Since gets an empty 304', async () => {
  const first = await get('/deutsch/js/core.js');
  const etag = first.headers.get('etag'), lastModified = first.headers.get('last-modified');
  for (const headers of [{ 'if-none-match': etag }, { 'if-none-match': `"x", ${etag.replace('W/', '')}` }, { 'if-modified-since': lastModified }]) {
    const res = await get('/deutsch/js/core.js', headers);
    assert.equal(res.status, 304, JSON.stringify(headers));
    assert.equal(await res.text(), '');
    assert.equal(res.headers.get('etag'), etag);
    assert.equal(res.headers.get('cache-control'), 'no-cache');
    assert.equal(res.headers.get('content-length'), null);
  }
});

test('a stale validator gets the whole file', async () => {
  const lastModified = statSync(path.join(ROOT, 'apps/deutsch/js/core.js')).mtime;
  const older = new Date(lastModified.getTime() - 60_000).toUTCString();
  for (const headers of [{ 'if-none-match': 'W/"old"' }, { 'if-modified-since': older }, { 'if-none-match': 'W/"old"', 'if-modified-since': new Date().toUTCString() }]) {
    const res = await get('/deutsch/js/core.js', headers);
    assert.equal(res.status, 200, JSON.stringify(headers));
    assert.equal(await res.text(), readFileSync(path.join(ROOT, 'apps/deutsch/js/core.js'), 'utf8'));
  }
});

test('the ETag changes when the file changes size or date', async () => {
  const a = (await get('/deutsch/js/core.js')).headers.get('etag');
  const b = (await get('/deutsch/js/ui.js')).headers.get('etag');
  assert.notEqual(a, b);
  assert.equal((await get('/deutsch/js/core.js')).headers.get('etag'), a);
});

test('text is gzipped for clients that accept it; images are not', async () => {
  const file = readFileSync(path.join(ROOT, 'apps/deutsch/js/ui.js'));
  const res = await get('/deutsch/js/ui.js', { 'accept-encoding': 'gzip, deflate, br' });
  assert.equal(res.headers.get('content-encoding'), 'gzip');
  assert.match(res.headers.get('vary') || '', /accept-encoding/i);
  const body = Buffer.from(await res.arrayBuffer());
  assert.ok(body.length < file.length / 2, `${body.length} of ${file.length} bytes`);
  assert.deepEqual(gunzipSync(body), file);

  const plain = await get('/deutsch/js/ui.js');
  assert.equal(plain.headers.get('content-encoding'), null);
  assert.equal(Number(plain.headers.get('content-length')), file.length);

  const png = await get('/deutsch/art/night/orb.png', { 'accept-encoding': 'gzip' });
  assert.equal(png.headers.get('content-encoding'), null);
  assert.equal(Buffer.from(await png.arrayBuffer()).length, statSync(path.join(ROOT, 'apps/deutsch/art/night/orb.png')).size);
});

test('a 304 to a client that accepts gzip stays empty', async () => {
  const etag = (await get('/deutsch/css/base.css', { 'accept-encoding': 'gzip' })).headers.get('etag');
  const res = await get('/deutsch/css/base.css', { 'accept-encoding': 'gzip', 'if-none-match': etag });
  assert.equal(res.status, 304);
  assert.equal(res.headers.get('content-encoding'), null);
  assert.equal((await res.arrayBuffer()).byteLength, 0);
});

test('missing files are still 404, and the API is not touched', async () => {
  const missing = await get('/deutsch/js/nope.js');
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get('etag'), null);
  const health = await get('/api/health', { 'accept-encoding': 'gzip' });
  assert.equal(health.headers.get('etag'), null);
  assert.equal(health.headers.get('cache-control'), null);
});

test('a byte range (audio seeking) is answered as before', async () => {
  const res = await get('/deutsch/art/night/orb.png', { range: 'bytes=0-9', 'accept-encoding': 'gzip' });
  assert.equal(res.status, 206);
  assert.equal((await res.arrayBuffer()).byteLength, 10);
  assert.equal(res.headers.get('content-encoding'), null);
});
