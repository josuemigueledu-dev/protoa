import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { Hono } from 'hono';
import { rateLimiter, memoryRateStore } from '../src/ratelimit.js';
import { createApp } from '../src/app.js';

function appWith(limit, windowMs) {
  const app = new Hono();
  app.use('*', rateLimiter({ limit, windowMs, key: c => c.req.header('x-client') || 'anon' }));
  app.get('/', c => c.text('ok'));
  return app;
}
const hit = (app, client) => app.request('/', { headers: { 'x-client': client } });

test('the limiter blocks over the limit with Retry-After, and clients are counted separately', async () => {
  mock.timers.enable({ apis: ['Date', 'setInterval'], now: 1_000_000 });
  try {
    const app = appWith(2, 60_000);
    assert.equal((await hit(app, 'a')).status, 200);
    assert.equal((await hit(app, 'a')).status, 200);
    mock.timers.tick(10_000);
    const blocked = await hit(app, 'a');
    assert.equal(blocked.status, 429);
    assert.equal((await blocked.json()).error.code, 'rate_limited');
    assert.equal(blocked.headers.get('retry-after'), '50'); // oldest hit leaves the window in 50 s
    assert.equal((await hit(app, 'b')).status, 200);
  } finally { mock.timers.reset(); }
});

test('the limiter lets a client back in once its hits leave the window, and blocked calls do not count', async () => {
  mock.timers.enable({ apis: ['Date', 'setInterval'], now: 1_000_000 });
  try {
    const app = appWith(1, 60_000);
    assert.equal((await hit(app, 'a')).status, 200);
    for (let i = 0; i < 5; i++) assert.equal((await hit(app, 'a')).status, 429);
    mock.timers.tick(60_001);
    assert.equal((await hit(app, 'a')).status, 200);
  } finally { mock.timers.reset(); }
});

// The contract every RateStore adapter meets. A shared store (Redis, Postgres, a
// Durable Object) runs these same checks against a test instance before it is used.
function rateStoreContract(name, makeStore) {
  const W = { limit: 2, windowMs: 60_000 };
  test(`${name}: allows up to the limit, then blocks until the oldest hit leaves the window`, async () => {
    const s = makeStore(), t = 1_000_000;
    assert.deepEqual(await s.hit('a', { ...W, now: t }), { ok: true, retryAfterMs: 0 });
    assert.equal((await s.hit('a', { ...W, now: t + 5_000 })).ok, true);
    assert.deepEqual(await s.hit('a', { ...W, now: t + 10_000 }), { ok: false, retryAfterMs: 50_000 });
    assert.equal((await s.hit('a', { ...W, now: t + 60_001 })).ok, true); // the first hit has left
    assert.equal((await s.hit('a', { ...W, now: t + 60_002 })).ok, false); // the second is still in
  });
  test(`${name}: keys are counted separately, and blocked hits are not recorded`, async () => {
    const s = makeStore(), t = 1_000_000, one = { limit: 1, windowMs: 60_000 };
    assert.equal((await s.hit('a', { ...one, now: t })).ok, true);
    for (let i = 1; i <= 5; i++) assert.equal((await s.hit('a', { ...one, now: t + i * 10_000 })).ok, false);
    assert.equal((await s.hit('b', { ...one, now: t })).ok, true);
    assert.equal((await s.hit('a', { ...one, now: t + 60_001 })).ok, true);
  });
  test(`${name}: simultaneous hits never get past the limit`, async () => {
    const s = makeStore();
    const verdicts = await Promise.all(Array.from({ length: 10 }, () => s.hit('a', { limit: 3, windowMs: 60_000, now: 1_000_000 })));
    assert.equal(verdicts.filter(v => v.ok).length, 3);
  });
}
rateStoreContract('memory store', () => memoryRateStore());

test('the limiter asks its store with the key, limit and window, and uses its retry time', async () => {
  const asked = [];
  const store = { async hit(key, opts) { asked.push({ key, ...opts }); return { ok: false, retryAfterMs: 1_500 }; } };
  const app = new Hono();
  app.use('*', rateLimiter({ limit: 7, windowMs: 1_000, key: () => 'user-1', store }));
  app.get('/', c => c.text('ok'));
  const r = await app.request('/');
  assert.equal(r.status, 429);
  assert.equal(r.headers.get('retry-after'), '2');
  assert.equal(asked.length, 1);
  assert.deepEqual({ ...asked[0], now: 0 }, { key: 'user-1', limit: 7, windowMs: 1_000, now: 0 });
});

test('when the store fails, the call goes through and the failure is logged', async () => {
  const logged = mock.method(console, 'error', () => {});
  try {
    const app = new Hono();
    app.use('*', rateLimiter({ limit: 1, windowMs: 1_000, key: () => 'k', store: { async hit() { throw new Error('store down'); } } }));
    app.get('/', c => c.text('ok'));
    assert.equal((await app.request('/')).status, 200);
    assert.equal(logged.mock.callCount(), 1);
  } finally { logged.mock.restore(); }
});

test('the AI route counts in the store createApp is given, and health does not', async () => {
  const keys = [];
  const app = createApp({ aiOn: () => true, rateStore: { async hit(key) { keys.push(key); return { ok: false, retryAfterMs: 30_000 }; } } });
  assert.equal((await app.request('/api/health')).status, 200);
  const r = await app.request('/api/deutsch/ai/correctSentence', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"sentence":"Hallo"}' });
  assert.equal(r.status, 429);
  assert.equal((await r.json()).error.code, 'rate_limited');
  assert.equal(r.headers.get('retry-after'), '30');
  assert.equal(keys.length, 1);
});
