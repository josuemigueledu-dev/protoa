/* ---------- installable app: register the service worker (sw.js) so lessons work offline ---------- */
// Only when served over http(s); opening index.html as a file has no service worker.
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(e => console.warn('Offline mode unavailable', e)));
}
