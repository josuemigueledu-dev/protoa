import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { tasks } from '../src/apps/deutsch/tasks.js';
import { PLANS, TASK_GROUP, allowanceFor, monetizationOn } from '../src/entitlements.js';
import { createQuota, periodBounds } from '../src/quota.js';
import { fakePayments, appStorePayments } from '../src/payments.js';

const post = (app, task, body, user = 'u1') => app.request(`/api/deutsch/ai/${task}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-user': user }, body: JSON.stringify(body) });
const userOf = c => c.req.header('x-user');
const CORRECT = { sentence: 'Ich komme aus Orlando.' };
const okJSON = async () => ({ corrected: 'x', error: '', extend: '' });
function withKey(fn) {
  return async () => {
    const old = process.env.ANTHROPIC_API_KEY; process.env.ANTHROPIC_API_KEY = 'test-key';
    try { await fn(); } finally { if (old === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = old; }
  };
}

test('every AI task has an allowance group, and every plan defines every group', () => {
  assert.deepEqual(Object.keys(TASK_GROUP).sort(), Object.keys(tasks).sort());
  for (const plan of Object.values(PLANS)) for (const g of new Set(Object.values(TASK_GROUP))) assert.ok(plan[g], g);
  assert.equal(allowanceFor('plus', 'toString'), null);
  assert.equal(allowanceFor('nonsense', 'talkTurn').limit, PLANS.free.talk.limit);
});

test('plus is never tighter than free, and the course exam is not gated', () => {
  for (const g of Object.keys(PLANS.free)) assert.ok(PLANS.plus[g].limit >= PLANS.free[g].limit, g);
  assert.ok(PLANS.free.exam.limit > 0);
});

test('monetization is off unless MONETIZATION=on', () => {
  assert.equal(monetizationOn({}), false);
  assert.equal(monetizationOn({ MONETIZATION: 'off' }), false);
  assert.equal(monetizationOn({ MONETIZATION: 'ON' }), true);
});

test('period bounds: UTC day, Monday-start week, calendar month', () => {
  const t = Date.UTC(2026, 9, 25, 13, 0); // Sunday 25 Oct 2026
  assert.deepEqual(periodBounds('day', t), [Date.UTC(2026, 9, 25), Date.UTC(2026, 9, 26)]);
  assert.deepEqual(periodBounds('week', t), [Date.UTC(2026, 9, 19), Date.UTC(2026, 9, 26)]);
  assert.deepEqual(periodBounds('month', t), [Date.UTC(2026, 9, 1), Date.UTC(2026, 10, 1)]);
});

test('quota blocks past the limit, counts users apart, refills next period, and release gives a call back', async () => {
  let now = Date.UTC(2026, 9, 25, 10);
  const quota = createQuota({ now: () => now });
  for (let i = 0; i < PLANS.free.exam.limit; i++) assert.ok((await quota.take('a', 'free', 'gradeExam')).ok);
  const blocked = await quota.take('a', 'free', 'gradeExam');
  assert.equal(blocked.ok, false);
  assert.equal(blocked.resetsAt, Date.UTC(2026, 9, 26));
  assert.ok((await quota.take('b', 'free', 'gradeExam')).ok);
  now += 86_400_000;
  const again = await quota.take('a', 'free', 'gradeExam');
  assert.ok(again.ok);
  await again.release(); await again.release(); // second release is a no-op
  assert.equal((await quota.take('a', 'free', 'gradeExam')).used, 1);
  assert.equal((await quota.take('a', 'free', 'generateLesson')).ok, false); // limit 0 on free
});

test('with monetization off nothing is counted or blocked', withKey(async () => {
  const app = createApp({ runJSON: okJSON, monetization: false, userOf });
  for (let i = 0; i < PLANS.free.tools.limit + 5; i++) assert.equal((await post(app, 'correctSentence', CORRECT)).status, 200);
}));

test('with monetization on, the free limit answers 429 quota_exceeded and plus lifts it', withKey(async () => {
  const payments = fakePayments({ pro: 'plus' });
  const app = createApp({ runJSON: okJSON, monetization: true, payments, userOf });
  for (let i = 0; i < PLANS.free.tools.limit; i++) assert.equal((await post(app, 'correctSentence', CORRECT)).status, 200);
  const r = await post(app, 'correctSentence', CORRECT);
  assert.equal(r.status, 429);
  const { error } = await r.json();
  assert.equal(error.code, 'quota_exceeded');
  assert.equal(error.limit, PLANS.free.tools.limit);
  assert.ok(Date.parse(error.resetsAt) > Date.now());
  assert.equal((await post(app, 'correctSentence', CORRECT, 'pro')).status, 200);
  assert.equal((await post(app, 'correctSentence', CORRECT, 'other')).status, 200);
}));

test('a call that fails on the server or is rejected as bad input does not use up the allowance', withKey(async () => {
  let fail = true;
  const app = createApp({ runJSON: async () => { if (fail) throw new Error('boom'); return okJSON(); }, monetization: true, userOf });
  const log = console.error; console.error = () => {};
  try {
    for (let i = 0; i < PLANS.free.tools.limit + 2; i++) assert.equal((await post(app, 'correctSentence', CORRECT)).status, 502);
  } finally { console.error = log; }
  assert.equal((await post(app, 'correctSentence', { nope: 1 })).status, 400);
  fail = false;
  for (let i = 0; i < PLANS.free.tools.limit; i++) assert.equal((await post(app, 'correctSentence', CORRECT)).status, 200);
  assert.equal((await post(app, 'correctSentence', CORRECT)).status, 429);
}));

test('payments: the fake provider defaults to free, and store stubs refuse until implemented', async () => {
  const p = fakePayments();
  assert.equal(await p.planOf('x'), 'free');
  p.set('x', 'plus');
  assert.equal(await p.planOf('x'), 'plus');
  await assert.rejects(appStorePayments().planOf('x'), /not implemented/);
});
