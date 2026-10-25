// claude.js with a stubbed SDK client: stop reasons, error mapping, request shape. No network.
import test from 'node:test';
import assert from 'node:assert/strict';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { askJSON, askLongJSON, setClientForTests, AIError, DEADLINE_MS } from '../src/claude.js';

const keep = process.env.ANTHROPIC_API_KEY;
process.env.ANTHROPIC_API_KEY = 'test-key';
test.after(() => {
  setClientForTests();
  if (keep === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = keep;
});

const schema = z.object({ ok: z.boolean() });
const withParse = (impl) => setClientForTests({ beta: { messages: { parse: impl } } });
const withStream = (impl) => setClientForTests({ beta: { messages: { stream: (p, o) => ({ finalMessage: () => impl(p, o) }) } } });
const rejects = (p, code, status) => assert.rejects(p, e => e instanceof AIError && e.code === code && e.status === status);
const apiErr = (Cls, status) => new Cls(status, { error: { message: 'x' } }, 'x', new Headers());

test('askJSON sends the tier\'s effort and returns the parsed output', async () => {
  const seen = [];
  withParse(async (p) => { seen.push(p); return { stop_reason: 'end_turn', parsed_output: { ok: true } }; });
  assert.deepEqual(await askJSON({ tier: 'quick', prompt: 'hi', schema }), { ok: true });
  await askJSON({ tier: 'default', prompt: 'hi', schema });
  assert.deepEqual(seen.map(p => p.output_config.effort), ['low', 'medium']);
  assert.equal(seen[0].messages[0].content, 'hi');
  assert.ok(seen[0].output_config.format, 'structured output format is set');
  assert.equal(seen[0].fallbacks, 'default');
});

test('askJSON maps refusals, cut-off replies and missing output', async () => {
  withParse(async () => ({ stop_reason: 'refusal' }));
  await rejects(askJSON({ tier: 'quick', prompt: 'x', schema }), 'refused', 422);
  withParse(async () => ({ stop_reason: 'max_tokens', parsed_output: { ok: true } }));
  await rejects(askJSON({ tier: 'quick', prompt: 'x', schema }), 'bad_output', 502);
  withParse(async () => ({ stop_reason: 'end_turn', parsed_output: null }));
  await rejects(askJSON({ tier: 'quick', prompt: 'x', schema }), 'bad_output', 502);
});

test('SDK errors become AIErrors with a safe code and status', async () => {
  const cases = [
    [apiErr(Anthropic.RateLimitError, 429), 'rate_limited', 429],
    [apiErr(Anthropic.AuthenticationError, 401), 'unavailable', 503],
    [apiErr(Anthropic.BadRequestError, 400), 'bad_request', 502],
    [apiErr(Anthropic.InternalServerError, 500), 'upstream', 502],
    [new TypeError('socket hang up'), 'upstream', 502],
  ];
  for (const [err, code, status] of cases) {
    withParse(async () => { throw err; });
    await rejects(askJSON({ tier: 'quick', prompt: 'x', schema }), code, status);
  }
});

test('the upstream message of a connection failure is not passed on', async () => {
  withParse(async () => { throw new Error('connect ECONNREFUSED 10.0.0.1:443'); });
  await assert.rejects(askJSON({ tier: 'quick', prompt: 'x', schema }), e => !/10\.0\.0\.1/.test(e.message));
});

test('askLongJSON joins text blocks, ignores others, and parses fenced JSON', async () => {
  let seen;
  withStream(async (p) => {
    seen = p;
    return { stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: '...' }, { type: 'text', text: '```json\n{"a":' }, { type: 'text', text: '1}\n```' }] };
  });
  assert.deepEqual(await askLongJSON({ tier: 'default', prompt: 'lesson' }), { a: 1 });
  assert.equal(seen.max_tokens, 64000);
  assert.equal(seen.output_config.effort, 'medium');
});

test('askLongJSON maps refusal, truncation and unparseable text', async () => {
  withStream(async () => ({ stop_reason: 'refusal', content: [] }));
  await rejects(askLongJSON({ tier: 'default', prompt: 'x' }), 'refused', 422);
  withStream(async () => ({ stop_reason: 'max_tokens', content: [{ type: 'text', text: '{"a":' }] }));
  await rejects(askLongJSON({ tier: 'default', prompt: 'x' }), 'bad_output', 502);
  withStream(async () => ({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'sorry' }] }));
  await rejects(askLongJSON({ tier: 'default', prompt: 'x' }), 'bad_output', 502);
});

test('without an API key, calls fail with 503 before touching the client', async () => {
  setClientForTests();
  delete process.env.ANTHROPIC_API_KEY;
  try { await rejects(askJSON({ tier: 'quick', prompt: 'x', schema }), 'unavailable', 503); }
  finally { process.env.ANTHROPIC_API_KEY = 'test-key'; }
});

// A call that never answers on its own: it ends only when its signal aborts, the way the SDK does.
// (AbortSignal.timeout does not keep the process alive, so the interval stands in for the server.)
const hangs = async (_p, opts) => {
  const alive = setInterval(() => {}, 1000);
  await new Promise(resolve => opts.signal.addEventListener('abort', resolve, { once: true }));
  clearInterval(alive);
  throw new Anthropic.APIUserAbortError();
};

test('a call that runs past its deadline fails with 504 timeout instead of hanging', async () => {
  withParse(hangs);
  await rejects(askJSON({ tier: 'quick', prompt: 'x', schema, timeoutMs: 20 }), 'timeout', 504);
  withStream(hangs);
  await rejects(askLongJSON({ tier: 'default', prompt: 'x', timeoutMs: 20 }), 'timeout', 504);
  withParse(async () => { throw new Anthropic.APIConnectionTimeoutError(); });
  await rejects(askJSON({ tier: 'quick', prompt: 'x', schema }), 'timeout', 504);
});

test('when the caller aborts (the learner left), the Claude call is cancelled', async () => {
  withParse(hangs);
  const ctl = new AbortController(), call = askJSON({ tier: 'default', prompt: 'x', schema, signal: ctl.signal });
  ctl.abort();
  await rejects(call, 'cancelled', 499);
  withStream(hangs);
  const ctl2 = new AbortController(), long = askLongJSON({ tier: 'default', prompt: 'x', signal: ctl2.signal });
  ctl2.abort();
  await rejects(long, 'cancelled', 499);
});

test('every call carries a deadline signal, longest for lesson writing', async () => {
  const seen = [];
  withParse(async (_p, opts) => { seen.push(opts.signal); return { stop_reason: 'end_turn', parsed_output: { ok: true } }; });
  await askJSON({ tier: 'quick', prompt: 'x', schema });
  withStream(async (_p, opts) => { seen.push(opts.signal); return { stop_reason: 'end_turn', content: [{ type: 'text', text: '{}' }] }; });
  await askLongJSON({ tier: 'default', prompt: 'x' });
  assert.ok(seen.every(sig => sig instanceof AbortSignal && !sig.aborted));
  assert.ok(DEADLINE_MS.quick < DEADLINE_MS.default && DEADLINE_MS.default < DEADLINE_MS.long);
  assert.ok(DEADLINE_MS.quick >= 30_000, 'quick calls get time for a retry');
});
