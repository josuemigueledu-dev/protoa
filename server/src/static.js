// Caching and compression for the apps' static files (the front end has no build step, so the server does this).
// - Code and pages (html, js, css, json, manifest): Cache-Control no-cache. Browsers revalidate them on every
//   load, so an update shows on the next load. Without it, browsers guess a freshness lifetime from
//   Last-Modified (10% of the file's age) and keep running old code for hours or days after an update.
// - Images (SVG too), fonts and audio: cached for MEDIA_MAX_AGE seconds; the service worker keeps its own copy anyway.
// - Every file gets a weak ETag from its size and modification time, and a matching If-None-Match or
//   If-Modified-Since gets an empty 304, so revalidating costs a few hundred bytes instead of the file.
// - Text responses are gzipped for clients that accept it (compress()), about 4x smaller for the app's scripts.
// The middleware wraps serveStatic, whose responses carry Content-Length and Last-Modified.
import { compress } from 'hono/compress';

export const MEDIA_MAX_AGE = 3600;
const CODE = /\.(html|js|mjs|css|json|webmanifest)$/i; // the same split as sw.js

export function cachePolicy(pathname) {
  return pathname.endsWith('/') || CODE.test(pathname) ? 'no-cache' : `public, max-age=${MEDIA_MAX_AGE}`;
}

const etagOf = (size, lastModified) => `W/"${Number(size).toString(36)}-${Date.parse(lastModified).toString(36)}"`;

// If-None-Match wins over If-Modified-Since (RFC 9110 13.2.2). Weak comparison: the W/ prefix is ignored.
function notModified(req, etag, lastModified) {
  const inm = req.header('if-none-match');
  if (inm) return inm.trim() === '*' || inm.split(',').some(t => t.trim().replace(/^W\//, '') === etag.replace(/^W\//, ''));
  const ims = Date.parse(req.header('if-modified-since') || '');
  return !Number.isNaN(ims) && Date.parse(lastModified) <= ims;
}

export function conditional() {
  return async function conditional(c, next) {
    await next();
    const res = c.res, lastModified = res.headers.get('last-modified'), size = res.headers.get('content-length');
    if (res.status !== 200 || !lastModified || size === null || Number.isNaN(Date.parse(lastModified))) return;
    const etag = etagOf(size, lastModified), cacheControl = cachePolicy(new URL(c.req.url).pathname);
    res.headers.set('ETag', etag);
    res.headers.set('Cache-Control', cacheControl);
    if (!['GET', 'HEAD'].includes(c.req.method) || !notModified(c.req, etag, lastModified)) return;
    await res.body?.cancel();
    c.res = undefined; // Hono merges headers into a replaced response; start from an empty one
    c.res = new Response(null, { status: 304, headers: { ETag: etag, 'Cache-Control': cacheControl, 'Last-Modified': lastModified, Vary: 'Accept-Encoding' } });
  };
}

// Mount before serveStatic: compress() runs last, after conditional() has read the uncompressed size.
export const staticFiles = () => [compress(), conditional()];
