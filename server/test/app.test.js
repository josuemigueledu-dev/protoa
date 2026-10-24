import { test } from 'node:test';
import assert from 'node:assert/strict';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { createApp } from '../src/app.js';
import { parseJSONText, AIError } from '../src/claude.js';
import { tasks } from '../src/apps/deutsch/tasks.js';

// Inputs the browser actually sends, one per task.
const SAMPLE = {
  checkFree: { question: 'Wie heißen Sie?', answer: 'Ich heiße Alex.', words: ['heißen', 'ich'] },
  correctSentence: { sentence: 'Ich komme aus Orlando.' },
  explainMistake: { en: 'I am from Orlando.', target: 'Ich komme aus Orlando.', answer: 'Ich bin aus Orlando.' },
  talkTurn: { profile: { name: 'Alex', city: 'Orlando' }, brief: 'You meet the student.', known: 'hallo, ich', history: [{ who: 'w', de: 'Hallo!' }, { who: 'l', de: 'Hallo, ich bin Alex.' }] },
  talkHelp: { brief: 'At a café.', question: 'I would like a coffee' },
  gradeExam: { code: 'A1', items: [{ i: 0, kind: 'trans', task: 'I am Alex.', model: 'Ich bin Alex.', answer: 'Ich bin Alex.', max: 1 }] },
  generateLesson: { n: 2, topic: 'People', station: 'Görlitzer Bahnhof', profile: { name: 'Alex' }, known: ['hallo'], art: [{ id: 'plate.cafe', kind: 'plate', tags: ['food'] }], example: { n: 1, title: 'Greetings' } },
};

const post = (app, path, body) => app.request(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) });

function withKey(fn) {
  return async () => {
    const old = process.env.ANTHROPIC_API_KEY; process.env.ANTHROPIC_API_KEY = 'test-key';
    try { await fn(); } finally { if (old === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = old; }
  };
}

test('every task builds a prompt from its sample input, and its output schema is accepted by structured outputs', () => {
  assert.deepEqual(Object.keys(SAMPLE).sort(), Object.keys(tasks).sort());
  for (const [name, t] of Object.entries(tasks)) {
    const vars = t.input.parse(SAMPLE[name]);
    const prompt = t.prompt(vars);
    assert.ok(prompt.length > 50, name);
    assert.ok(!prompt.includes('undefined'), `${name} prompt contains "undefined"`);
    if (t.long) assert.equal(t.output, undefined, name);
    else assert.doesNotThrow(() => betaZodOutputFormat(t.output), name);
  }
});

test('the conversation prompt keeps the original transcript format', () => {
  const p = tasks.talkTurn.prompt(tasks.talkTurn.input.parse(SAMPLE.talkTurn));
  assert.match(p, /Conversation so far:\nProtoa: Hallo!\nStudent: Hallo, ich bin Alex\.$/);
  assert.match(p, /your student Alex \(lives in Orlando, studies\/works in unknown, interests: unknown\)/);
});

test('health reports whether AI is configured', async () => {
  const old = process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_API_KEY;
  assert.deepEqual(await (await createApp().request('/api/health')).json(), { ok: true, ai: false });
  process.env.ANTHROPIC_API_KEY = 'x';
  assert.deepEqual(await (await createApp().request('/api/health')).json(), { ok: true, ai: true });
  if (old === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = old;
});

test('without an API key, AI calls answer 503 unavailable', async () => {
  const old = process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_API_KEY;
  const r = await post(createApp(), '/api/deutsch/ai/correctSentence', SAMPLE.correctSentence);
  assert.equal(r.status, 503); assert.equal((await r.json()).error.code, 'unavailable');
  if (old !== undefined) process.env.ANTHROPIC_API_KEY = old;
});

test('a task runs with its tier, prompt and schema, and returns the result', withKey(async () => {
  let seen;
  const app = createApp({ runJSON: async args => { seen = args; return { corrected: 'Ich komme aus Orlando.', error: 'No errors.', extend: '' }; } });
  const r = await post(app, '/api/deutsch/ai/correctSentence', SAMPLE.correctSentence);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).result.error, 'No errors.');
  assert.equal(seen.tier, 'quick'); assert.equal(seen.schema, tasks.correctSentence.output);
  assert.match(seen.prompt, /wrote this sentence: "Ich komme aus Orlando\."/);
}));

test('lesson generation goes through the long, free-form path', withKey(async () => {
  let longCalled = false;
  const app = createApp({ runJSON: async () => { throw new Error('wrong path'); }, runLong: async ({ tier }) => { longCalled = true; assert.equal(tier, 'default'); return { title: 'People' }; } });
  const r = await post(app, '/api/deutsch/ai/generateLesson', SAMPLE.generateLesson);
  assert.equal(r.status, 200); assert.ok(longCalled);
}));

test('bad requests are rejected before Claude is called', withKey(async () => {
  const app = createApp({ runJSON: async () => { throw new Error('must not be called'); } });
  assert.equal((await post(app, '/api/deutsch/ai/nope', {})).status, 404);
  assert.equal((await post(app, '/api/other/ai/correctSentence', SAMPLE.correctSentence)).status, 404);
  assert.equal((await post(app, '/api/deutsch/ai/correctSentence', 'not json')).status, 400);
  assert.equal((await post(app, '/api/deutsch/ai/correctSentence', { sentence: 'x'.repeat(501) })).status, 400);
  assert.equal((await post(app, '/api/deutsch/ai/gradeExam', { code: 'C2', items: [] })).status, 400);
  assert.equal((await post(app, '/api/deutsch/ai/correctSentence', { sentence: 'x'.repeat(300 * 1024) })).status, 413);
}));

// Every string and list an input accepts has a cap, so one request cannot carry a huge prompt.
function inflate(value, path = []) {
  if (typeof value === 'string') return [[path, 'x'.repeat(100_000)]];
  if (Array.isArray(value)) return [[path, Array(10_000).fill(value[0] ?? 'x')], ...(value.length ? inflate(value[0], [...path, 0]) : [])];
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => inflate(v, [...path, k]));
  return [];
}
function setAt(obj, path, v) {
  const copy = structuredClone(obj);
  let o = copy;
  path.slice(0, -1).forEach(k => { o = o[k]; });
  o[path.at(-1)] = v;
  return path.length ? copy : v;
}

test('every task rejects an oversized string or list anywhere in its input', () => {
  for (const [name, t] of Object.entries(tasks)) {
    assert.ok(t.input.safeParse(SAMPLE[name]).success, `${name}: sample must be valid`);
    for (const [path, big] of inflate(SAMPLE[name])) {
      assert.ok(t.input.safeParse(setAt(SAMPLE[name], path, big)).error, `${name}: no size cap at ${path.join('.') || '(root)'}`);
    }
  }
});

test('the lesson prompt lists the art ids it may use, and the list is capped', () => {
  const t = tasks.generateLesson;
  assert.match(t.prompt(t.input.parse(SAMPLE.generateLesson)), /"id":"plate\.cafe"/);
  assert.ok(t.input.safeParse({ ...SAMPLE.generateLesson, art: Array(401).fill({ id: 'a', kind: 'word', tags: [] }) }).error);
  assert.ok(t.input.safeParse({ ...SAMPLE.generateLesson, art: [{ id: 'a', kind: 'word', tags: Array(13).fill('t') }] }).error);
});

test('AI errors keep their code and status', withKey(async () => {
  const app = createApp({ runJSON: async () => { throw new AIError('refused', 'Claude declined this request.', 422); } });
  const r = await post(app, '/api/deutsch/ai/correctSentence', SAMPLE.correctSentence);
  assert.equal(r.status, 422); assert.equal((await r.json()).error.code, 'refused');
}));

test('AI calls are rate limited per client', withKey(async () => {
  const old = process.env.AI_RATE_LIMIT; process.env.AI_RATE_LIMIT = '3';
  const app = createApp({ runJSON: async () => ({ corrected: '', error: '', extend: '' }) });
  const codes = [];
  for (let i = 0; i < 4; i++) codes.push((await post(app, '/api/deutsch/ai/correctSentence', SAMPLE.correctSentence)).status);
  assert.deepEqual(codes, [200, 200, 200, 429]);
  if (old === undefined) delete process.env.AI_RATE_LIMIT; else process.env.AI_RATE_LIMIT = old;
}));

test('serves the app, the shared orb, and nothing outside them', async () => {
  const app = createApp();
  assert.equal((await app.request('/')).headers.get('location'), '/deutsch/');
  const page = await app.request('/deutsch/');
  assert.equal(page.status, 200); assert.match(await page.text(), /<script src="js\/ai\.js"><\/script>/);
  assert.equal((await app.request('/deutsch/js/core.js')).status, 200);
  assert.equal((await app.request('/shared/orb/glorb.js')).status, 200);
  for (const p of ['/shared/../server/package.json', '/deutsch/../../.env', '/shared/%2e%2e/server/package.json']) assert.notEqual((await app.request(p)).status, 200, p);
});

test('static files are found when the server starts from the repository root', async () => {
  const before = process.cwd(); process.chdir(new URL('../..', import.meta.url).pathname);
  try {
    const app = createApp();
    assert.equal((await app.request('/shared/orb/glorb.js')).status, 200);
    assert.equal((await app.request('/deutsch/css/base.css')).status, 200);
  } finally { process.chdir(before); }
});

test('parseJSONText accepts bare, fenced and wrapped JSON', () => {
  assert.deepEqual(parseJSONText('{"a":1}'), { a: 1 });
  assert.deepEqual(parseJSONText('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(parseJSONText('Here it is: {"a":{"b":2}} done'), { a: { b: 2 } });
  assert.throws(() => parseJSONText('no json here'), e => e.code === 'bad_output');
});
