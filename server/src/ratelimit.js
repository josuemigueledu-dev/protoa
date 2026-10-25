// Sliding-window limiter, keyed per client, over a RateStore so several server
// instances can share one count. The memory store is enough for one process; a
// shared store (Redis sorted sets, a Durable Object, Postgres) implements the same
// contract (test/ratelimit.test.js runs it against any adapter), and once there are
// accounts the key is the user instead of the IP.
//
// RateStore: hit(key, { limit, windowMs, now }) -> { ok, retryAfterMs }
//   One atomic check-and-record: ok when fewer than `limit` hits fall inside the
//   window, and then this hit is recorded. A blocked hit is not recorded.
//   retryAfterMs (when blocked) is when the oldest hit leaves the window.
export function memoryRateStore({ sweepMs = 60_000 } = {}) {
  const hits = new Map();
  let longest = 0;
  setInterval(() => {
    const cutoff = Date.now() - longest;
    for (const [k, list] of hits) { const kept = list.filter(t => t > cutoff); kept.length ? hits.set(k, kept) : hits.delete(k); }
  }, sweepMs).unref();
  return {
    async hit(key, { limit, windowMs, now }) {
      longest = Math.max(longest, windowMs);
      const cutoff = now - windowMs;
      const list = (hits.get(key) || []).filter(t => t > cutoff);
      if (list.length >= limit) { hits.set(key, list); return { ok: false, retryAfterMs: list[0] + windowMs - now }; }
      list.push(now); hits.set(key, list);
      return { ok: true, retryAfterMs: 0 };
    },
  };
}

// If the store fails (a shared store is down), the call goes through: learners keep
// working, and the per-user quota and the provider's own limits still bound the cost.
export function rateLimiter({ limit, windowMs, key, store = memoryRateStore({ sweepMs: windowMs }) }) {
  return async (c, next) => {
    let verdict;
    try { verdict = await store.hit(key(c), { limit, windowMs, now: Date.now() }); }
    catch (e) { console.error('rate store failed, letting the call through:', e); verdict = { ok: true }; }
    if (!verdict.ok) {
      c.header('Retry-After', String(Math.max(1, Math.ceil(verdict.retryAfterMs / 1000))));
      return c.json({ error: { code: 'rate_limited', message: 'Too many requests. Try again in a moment.' } }, 429);
    }
    await next();
  };
}
