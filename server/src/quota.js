import { allowanceFor } from './entitlements.js';

// Counter store behind an interface so a shared store (Redis, Postgres) can replace the memory one:
//   get(key) -> number, add(key, delta) -> number (new value, never below 0)
export function memoryQuotaStore() {
  const counts = new Map();
  return {
    async get(key) { return counts.get(key) || 0; },
    async add(key, delta) {
      const n = Math.max(0, (counts.get(key) || 0) + delta);
      n ? counts.set(key, n) : counts.delete(key);
      return n;
    },
  };
}

// Start of the UTC day / ISO week (Monday) / month containing `now`, and the start of the next one.
export function periodBounds(period, now) {
  const d = new Date(now);
  const day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  if (period === 'day') return [day, day + 86_400_000];
  if (period === 'week') {
    const start = day - ((d.getUTCDay() + 6) % 7) * 86_400_000;
    return [start, start + 7 * 86_400_000];
  }
  return [Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1), Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)];
}

export function createQuota({ store = memoryQuotaStore(), now = Date.now } = {}) {
  return {
    // Reserves one call. Returns { ok, used, limit, resetsAt, release() }; release() gives the call
    // back, for when the server (not the learner) failed, so mistakes cost nothing.
    async take(user, plan, task) {
      const a = allowanceFor(plan, task);
      if (!a) return { ok: false, used: 0, limit: 0, resetsAt: null, release: async () => {} };
      const [start, end] = periodBounds(a.period, now());
      const key = `${user}|${a.group}|${a.period}|${start}`;
      const used = await store.add(key, 1);
      let released = false;
      const release = async () => { if (!released) { released = true; await store.add(key, -1); } };
      if (used > a.limit) { await release(); return { ok: false, used: a.limit, limit: a.limit, resetsAt: end, group: a.group, release }; }
      return { ok: true, used, limit: a.limit, resetsAt: end, group: a.group, release };
    },
  };
}
