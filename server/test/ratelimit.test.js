import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { Hono } from 'hono';
import { rateLimiter } from '../src/ratelimit.js';

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
