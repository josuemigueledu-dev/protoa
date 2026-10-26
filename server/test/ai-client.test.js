import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { FAILURES } from '../src/fake-ai.js';

// The browser's ai.js in a bare context: how a failed call reaches the app, and what the learner reads.
const src = readFileSync(new URL('../../apps/deutsch/js/ai.js', import.meta.url), 'utf8');
function load(fetch) {
  const ctx = vm.createContext({ navigator: { onLine: true }, location: { protocol: 'http:' }, fetch });
  ctx.window = ctx;
  vm.runInContext(src + '\nvar S = { ai: AI };', ctx, { filename: 'ai.js' });
  return ctx;
}
// a server answer in the shape app.js sends for a failed task
const fails = code => async () => ({ ok: false, status: FAILURES[code]?.[0] ?? 502, json: async () => ({ error: { code, message: FAILURES[code]?.[1] ?? '' } }) });
const failure = async ctx => { try { await vm.runInContext("AI.run('talkTurn', {})", ctx); } catch (e) { return e; } assert.fail('AI.run resolved'); };

test('AI.run: the server saying AI is unavailable turns the AI features off for the session', async () => {
  const ctx = load(fails('unavailable'));
  const e = await failure(ctx);
  assert.equal(e.code, 'unavailable');
  assert.equal(vm.runInContext('S.ai', ctx), null);
});

test('AI.run: any other failure leaves AI on, so the learner can try again', async () => {
  for (const code of Object.keys(FAILURES).filter(c => c !== 'unavailable').concat('unsupported')) {
    const ctx = load(fails(code));
    assert.equal((await failure(ctx)).code, code);
    assert.ok(vm.runInContext('S.ai', ctx), code);
  }
  const offline = load(async () => { throw new TypeError('Failed to fetch'); });
  assert.equal((await failure(offline)).code, 'network');
  assert.ok(vm.runInContext('S.ai', offline));
  const bare = load(async () => ({ ok: false, status: 500, json: async () => { throw new SyntaxError('not JSON'); } }));
  assert.equal((await failure(bare)).code, 'upstream');
});

test('AI.message: a failure trying again can fix says so; AI being off says what still works', () => {
  const ctx = load(fails('upstream'));
  const msg = code => vm.runInContext(`AI.message(${JSON.stringify({ code })}, 'FALLBACK')`, ctx);
  assert.match(msg('rate_limited'), /in a moment/);
  assert.match(msg('timeout'), /Try again/);
  assert.match(msg('network'), /server/);
  assert.match(msg('unavailable'), /not reachable/);
  assert.doesNotMatch(msg('unavailable'), /try again/i, 'trying again cannot help when the key is missing or rejected');
  for (const code of ['refused', 'bad_output', 'upstream', 'unsupported', 'bad_request']) assert.equal(msg(code), 'FALLBACK', code);
  assert.equal(vm.runInContext("AI.message(null, 'FALLBACK')", ctx), 'FALLBACK');
});
