import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createApp } from '../src/app.js';
import { fakeAI, TALK_SCRIPT } from '../src/fake-ai.js';
import { tasks } from '../src/apps/deutsch/tasks.js';
import { lessonFiles } from '../support/lessons.js';

const INPUT = {
  checkFree: { question: 'Wie heißen Sie?', answer: 'Ich heiße Alex.', words: ['heißen'] },
  correctSentence: { sentence: 'Ich komme aus Orlando.' },
  explainMistake: { en: 'I am from Orlando.', target: 'Ich komme aus Orlando.', answer: 'Ich bin aus Orlando.' },
  talkTurn: { profile: {}, brief: 'You meet the student.', known: 'hallo', history: [{ who: 'w', de: 'Hallo!' }, { who: 'l', de: 'Hallo.' }] },
  talkHelp: { brief: 'At a café.', question: 'I would like a coffee' },
  gradeExam: { code: 'A1', items: [{ i: 0, kind: 'write', task: 'Write to Ana.', model: '', answer: 'Hallo Ana!', max: 10 }, { i: 1, kind: 'speak', task: 'Wie heißen Sie?', model: '', answer: ' ', max: 1 }] },
  generateLesson: { n: 12, topic: 'Food', station: 'Kottbusser Tor', profile: {}, known: ['hallo'], example: { n: 1 } },
};
const post = (app, task, body) => app.request(`/api/deutsch/ai/${task}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

// the practice AI must not depend on a key: run every test without one
const noKey = fn => async () => {
  const old = process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_API_KEY;
  try { await fn(); } finally { if (old !== undefined) process.env.ANTHROPIC_API_KEY = old; }
};

test('practice AI: health reports AI on without an API key', noKey(async () => {
  assert.deepEqual(await (await createApp(fakeAI()).request('/api/health')).json(), { ok: true, ai: true });
  assert.deepEqual(await (await createApp().request('/api/health')).json(), { ok: true, ai: false });
}));

test('practice AI: every structured task answers in its output schema, through the real route', noKey(async () => {
  assert.deepEqual(Object.keys(INPUT).sort(), Object.keys(tasks).sort());
  const app = createApp(fakeAI());
  for (const [name, t] of Object.entries(tasks)) {
    if (t.long) continue;
    const res = await post(app, name, INPUT[name]);
    assert.equal(res.status, 200, name);
    const { result } = await res.json();
    assert.doesNotThrow(() => t.output.parse(result), name);
  }
}));

test('practice AI: its advice says where it comes from, so nobody takes it for real feedback', noKey(async () => {
  const app = createApp(fakeAI());
  for (const name of ['explainMistake', 'talkHelp', 'correctSentence']) assert.match(JSON.stringify((await (await post(app, name, INPUT[name])).json()).result), /Practice AI/, name);
}));

test('practice AI: exam marks follow the items, an empty answer scores 0', noKey(async () => {
  const { result } = await (await post(createApp(fakeAI()), 'gradeExam', INPUT.gradeExam)).json();
  assert.deepEqual(result.marks.map(m => [m.i, m.points]), [[0, 10], [1, 0]]);
}));

test('practice AI: lesson writing says it is not available instead of returning a broken lesson', noKey(async () => {
  const res = await post(createApp(fakeAI()), 'generateLesson', INPUT.generateLesson);
  assert.equal(res.status, 503);
  assert.equal((await res.json()).error.code, 'unavailable');
}));

test('practice AI: input caps still apply', noKey(async () => {
  const res = await post(createApp(fakeAI()), 'correctSentence', { sentence: 'x'.repeat(501) });
  assert.equal(res.status, 400);
}));

test('practice AI: a Sprechen conversation shows one correction and ends after the script', noKey(async () => {
  const app = createApp(fakeAI());
  const history = [{ who: 'w', de: 'Guten Tag! Wie heißen Sie?' }];
  const turns = [];
  for (let i = 1; i <= TALK_SCRIPT.length; i++) {
    history.push({ who: 'l', de: `Satz ${i}.` });
    const { result } = await (await post(app, 'talkTurn', { ...INPUT.talkTurn, history })).json();
    turns.push(result); history.push({ who: 'w', de: result.de });
  }
  assert.deepEqual(turns.map(t => t.de), TALK_SCRIPT.map(l => l.de));
  assert.deepEqual(turns.map(t => t.correction.ok), [true, false, true, true]);
  assert.equal(turns[1].correction.corrected, 'Satz 2.');
  assert.deepEqual(turns.map(t => t.done), [false, false, false, true]);
}));

test('practice AI: the scripted lines are glossed token by token, as the app checks them', () => {
  const js = f => readFileSync(new URL(`../../apps/deutsch/js/${f}`, import.meta.url), 'utf8');
  const ctx = vm.createContext({ console, matchMedia: () => ({ matches: false }) });
  ctx.window = ctx;
  for (const f of ['content.js', ...lessonFiles(), 'core.js']) vm.runInContext(js(f), ctx, { filename: f });
  // the same comparison renderTalkChat makes before it shows a gloss
  const glossOk = vm.runInContext('(de, g) => deTokens(de).map(fold).join(" ") === parseGloss(g).flatMap(([d]) => deTokens(d)).map(fold).join(" ")', ctx);
  for (const l of TALK_SCRIPT) assert.ok(glossOk(l.de, l.gloss), l.de);
});
