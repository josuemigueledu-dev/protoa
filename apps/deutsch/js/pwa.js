/* ---------- installable app: register the service worker (sw.js) so lessons work offline ---------- */
// Only when served over http(s); opening index.html as a file has no service worker.
// Once the page is idle, the worker saves the rest of the painted art for offline use ('warm', in sw.js).
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('Offline mode unavailable', e));
    navigator.serviceWorker.ready.then(reg => {
      const warm = () => reg.active && reg.active.postMessage('warm');
      if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 5000 }); else setTimeout(warm, 2000);
    });
  });
}
