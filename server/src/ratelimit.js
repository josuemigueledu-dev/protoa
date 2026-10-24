// In-memory sliding-window limiter, keyed per client. Enough for one server
// process; with several instances (or once there are accounts) this moves to a
// shared store and keys on the user instead of the IP.
export function rateLimiter({ limit, windowMs, key }) {
  const hits = new Map();
  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [k, list] of hits) { const kept = list.filter(t => t > cutoff); kept.length ? hits.set(k, kept) : hits.delete(k); }
  }, windowMs).unref();
  return async (c, next) => {
    const k = key(c), now = Date.now(), cutoff = now - windowMs;
    const list = (hits.get(k) || []).filter(t => t > cutoff);
    if (list.length >= limit) {
      c.header('Retry-After', String(Math.ceil((list[0] + windowMs - now) / 1000)));
      return c.json({ error: { code: 'rate_limited', message: 'Too many requests. Try again in a moment.' } }, 429);
    }
    list.push(now); hits.set(k, list);
    await next();
  };
}
