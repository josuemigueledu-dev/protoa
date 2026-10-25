// One place where Protoa talks to the Claude API. The key stays on the server;
// the browser only ever sees the task results.
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

const MODEL = process.env.PROTOA_MODEL || 'claude-opus-5-5';
// 'quick' tasks (checking one answer, a hint) run at low effort; 'default' tasks
// (conversation turns, exam marking, lesson writing) at medium. Both on one model
// unless PROTOA_MODEL_QUICK is set.
const MODEL_QUICK = process.env.PROTOA_MODEL_QUICK || MODEL;
const EFFORT = { quick: 'low', default: 'medium' };

// If a request is declined by a safety classifier, the API re-runs it on a
// fallback model chosen by the refusal category.
const FALLBACK = { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' };

// The longest a call may take, retries included, before the learner gets a 'timeout' error instead of
// a spinner: the SDK alone would wait up to 10 minutes per try, 3 tries. Writing a lesson takes minutes.
export const DEADLINE_MS = { quick: 60_000, default: 120_000, long: 600_000 };

export class AIError extends Error {
  constructor(code, message, status = 502) { super(message); this.code = code; this.status = status; }
}

let client = null;
export function aiAvailable() { return Boolean(process.env.ANTHROPIC_API_KEY); }
// Tests hand in a stub; pass nothing to go back to the real client.
export function setClientForTests(stub = null) { client = stub; }
function getClient() {
  if (!aiAvailable()) throw new AIError('unavailable', 'AI is not configured on this server.', 503);
  return (client ??= new Anthropic());
}

function params(tier, prompt, maxTokens) {
  return {
    model: tier === 'quick' ? MODEL_QUICK : MODEL,
    max_tokens: maxTokens,
    output_config: { effort: EFFORT[tier] || 'medium' },
    messages: [{ role: 'user', content: prompt }],
    ...FALLBACK,
  };
}

function checkStop(msg) {
  if (msg.stop_reason === 'refusal') throw new AIError('refused', 'Claude declined this request.', 422);
  if (msg.stop_reason === 'max_tokens') throw new AIError('bad_output', 'The reply was cut off.', 502);
}

// Stops the call at the deadline, or as soon as `signal` aborts (the learner closed the page or left the screen).
function deadline(ms, signal) {
  const timer = AbortSignal.timeout(ms);
  return { timer, signal: signal ? AbortSignal.any([signal, timer]) : timer };
}

function mapError(e, timer) {
  if (e instanceof AIError) return e;
  if (timer?.aborted || e instanceof Anthropic.APIConnectionTimeoutError) return new AIError('timeout', 'Claude took too long to answer. Try again.', 504);
  if (e instanceof Anthropic.APIUserAbortError) return new AIError('cancelled', 'The request was cancelled.', 499);
  if (e instanceof Anthropic.RateLimitError) return new AIError('rate_limited', 'Too many requests. Try again in a moment.', 429);
  if (e instanceof Anthropic.AuthenticationError) return new AIError('unavailable', 'The server API key was rejected.', 503);
  if (e instanceof Anthropic.BadRequestError) return new AIError('bad_request', e.message, 502);
  if (e instanceof Anthropic.APIError) return new AIError('upstream', `Claude API error ${e.status ?? ''}`.trim(), 502);
  return new AIError('upstream', 'Could not reach Claude.', 502);
}

// A short reply whose shape is enforced by a Zod schema (structured outputs).
export async function askJSON({ tier, prompt, schema, signal, timeoutMs = DEADLINE_MS[tier] || DEADLINE_MS.default }) {
  const stop = deadline(timeoutMs, signal);
  try {
    const msg = await getClient().beta.messages.parse({
      ...params(tier, prompt, 16000),
      output_config: { effort: EFFORT[tier] || 'medium', format: betaZodOutputFormat(schema) },
    }, { signal: stop.signal });
    checkStop(msg);
    if (!msg.parsed_output) throw new AIError('bad_output', 'The reply did not match the expected shape.');
    return msg.parsed_output;
  } catch (e) { throw mapError(e, stop.timer); }
}

// A long free-form JSON reply (a whole lesson). Streamed so a long generation
// does not hit an HTTP timeout; the caller validates the shape.
export async function askLongJSON({ tier, prompt, signal, timeoutMs = DEADLINE_MS.long }) {
  const stop = deadline(timeoutMs, signal);
  try {
    const msg = await getClient().beta.messages.stream(params(tier, prompt, 64000), { signal: stop.signal }).finalMessage();
    checkStop(msg);
    const text = msg.content.filter(b => b.type === 'text').map(b => b.text).join('');
    return parseJSONText(text);
  } catch (e) { throw mapError(e, stop.timer); }
}

export function parseJSONText(text) {
  const s = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(s); } catch { /* fall through */ }
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch { /* fall through */ } }
  throw new AIError('bad_output', 'The reply was not valid JSON.');
}
