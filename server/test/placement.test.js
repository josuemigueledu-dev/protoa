import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { lessonFiles } from '../support/lessons.js';

// The placement test ("Not a beginner?", docs/specs/placement.md), run in the
// browser's scripts in a bare context, in the page's order.
const js = f => readFileSync(new URL(`../../apps/deutsch/js/${f}`, import.meta.url), 'utf8');
const ctx = vm.createContext({ console, matchMedia: () => ({ matches: false }) });
ctx.window = ctx;
for (const f of ['content.js', ...lessonFiles(), 'core.js', 'levels.js']) vm.runInContext(js(f), ctx, { filename: f });
const get = expr => vm.runInContext(expr, ctx);
const run = code => vm.runInContext(code, ctx);

const lessons = get('LESSONS');
const order = lessons.map(L => L.n).sort((a, b) => a - b);
const last = order[order.length - 1];
const wordsOf = n => lessons.find(L => L.n === n).words;
const right = it => (it.type === 'gap' ? it.a[0] : it.de);

function fresh() {
  run(`S.ai = null; S.progress = DEF_PROGRESS(); S.cards = {};`);
}
// plays the test as a learner who knows every lesson before `knows` (and none after); returns the finished state
function play(knows, { dunno = false, t0 = 0, step = 5000 } = {}) {
  fresh();
  let P = get(`startPlacement(${t0})`), t = t0, items = 0;
  while (!P.done) {
    assert.ok(P.item, 'a running test always has an item');
    assert.equal(P.item.lesson, P.order[P.at], 'the item comes from the lesson being tested');
    assert.ok(wordsOf(P.item.lesson).some(w => w.de === P.item.de || w.ex.replace(/[[\]]/g, '') === P.item.de), `item "${P.item.de}" is not from lesson ${P.item.lesson}`);
    ctx.__P = P; ctx.__a = P.item.lesson < knows ? right(P.item) : dunno ? null : 'xyz';
    t += step; items++;
    P = get(`answerPlacement(__P, __a, ${t})`);
  }
  return { P, items };
}

test('placement: a learner is placed at the first lesson they miss, for every lesson', () => {
  for (const k of order) for (let round = 0; round < 5; round++) {
    const { P, items } = play(k);
    assert.equal(P.place, k, `knows lessons before ${k}`);
    assert.equal(items, k - order[0] + 2, 'one item per lesson passed, then two misses');
    assert.deepEqual([...P.log.slice(-2)].map(l => [l.lesson, l.type, l.ok]), [[k, 'gap', false], [k, 'out', false]]);
  }
});

test('placement: every lesson right places past the last built-in lesson, in one item each', () => {
  const { P, items } = play(last + 1);
  assert.equal(P.place, null);
  assert.equal(items, order.length);
  assert.ok(P.log.every(l => l.ok && l.type === 'gap'));
  assert.equal(new Set(P.log.map(l => l.lesson)).size, order.length);
});

test('placement: "I don\'t know" ends the test at that lesson, without a second item', () => {
  const { P, items } = play(4, { dunno: true });
  assert.equal(P.place, 4);
  assert.equal(items, 4);
  assert.equal(P.log.at(-1).answer, null);
  assert.ok(P.log.at(-1).expected, 'the right answer is kept for the result screen');
  assert.match(P.log.at(-1).prompt, /_____/, 'and the gap sentence it was asked in');
});

test('placement: a miss, then the second item right, passes the lesson', () => {
  fresh();
  ctx.__P = get('startPlacement(0)');
  get('answerPlacement(__P, "xyz", 1000)');
  assert.equal(ctx.__P.at, 0); assert.equal(ctx.__P.item.type, 'out'); assert.equal(ctx.__P.item.lesson, order[0]);
  assert.notEqual(ctx.__P.item.de, ctx.__P.used[0], 'the second item asks another word');
  ctx.__a = ctx.__P.item.de; const en = ctx.__P.item.en.join(', ');
  get('answerPlacement(__P, __a, 2000)');
  assert.equal(ctx.__P.at, 1); assert.equal(ctx.__P.miss, 0); assert.equal(ctx.__P.item.type, 'gap'); assert.equal(ctx.__P.done, false);
  assert.equal(ctx.__P.log[1].prompt, en, 'an English → German item keeps its English as the prompt');
});

test('placement: it stops at 3 minutes, at the lesson it is on', () => {
  const { P, items } = play(last + 1, { step: 20000 }); // 20 s an answer: 9 answers fill 3 minutes
  assert.equal(items, 9);
  assert.equal(P.place, order[9]);
  assert.ok(P.log.every(l => l.ok), 'the answer given at the cap still counts');
});

test('placement: no word is asked twice in one test', () => {
  for (let round = 0; round < 10; round++) {
    const { P } = play(order[Math.floor(order.length / 2)]);
    assert.equal(new Set(P.used).size, P.used.length);
  }
});

test('placement: placing at a lesson marks the ones before it done and their words yours, due over two weeks', () => {
  fresh();
  run(`S.cards.l2 = { updatedAt: 0, w: { 'ich': { r: ['2030-01-01', 30, 260, 5, 0], p: null, learned: true, hist: [1], lesson: 2 } } };`);
  const n = get('applyPlacement(5)'), today = get('todayStr()'), soon = get('addDays(todayStr(), 14)');
  assert.equal(n, 4);
  assert.deepEqual([...get('S.progress.lessonsDone')].sort((a, b) => a - b), [1, 2, 3, 4]);
  const before = lessons.filter(L => L.n < 5).flatMap(L => L.words.map(w => w.de));
  for (const de of before) {
    const c = get(`cardOf(${JSON.stringify(de)})`);
    assert.ok(c && c.learned, `${de} is not yours`);
    if (de === 'ich') { assert.deepEqual([...c.r], ['2030-01-01', 30, 260, 5, 0], 'a word already yours keeps its history'); continue; }
    assert.ok(c.placed);
    assert.ok(c.r[0] > today && c.r[0] <= soon, `${de} is due ${c.r[0]}`);
    // dueCards() (ui.js) makes a missing English → German card due today once the interval is 4 days or more
    assert.ok(c.p && c.p[0] > soon, `${de}'s English → German card is due ${c.p && c.p[0]}, inside the first two weeks`);
  }
  for (const de of lessons.filter(L => L.n >= 5).flatMap(L => L.words.map(w => w.de))) assert.equal(get(`cardOf(${JSON.stringify(de)})`), null, `${de} is from a lesson not placed out of`);
  assert.equal(get('learnedCount()'), before.length);
  assert.equal(get('Object.keys(S.progress.days).length'), 0, 'placed words are not counted as new today');
  const perDay = {}; for (const de of before) { const d = get(`cardOf(${JSON.stringify(de)})`).r[0]; perDay[d] = (perDay[d] || 0) + 1; }
  assert.ok(Math.max(...Object.values(perDay)) <= Math.ceil(before.length / 14), 'first reviews are spread out');
  assert.deepEqual({ ...get('S.progress.placement') }, { date: today, place: 5, lessons: 4 });
});

test('placement: placed at lesson 1 changes nothing; placed past the end marks every built-in lesson done', () => {
  fresh();
  assert.equal(get('applyPlacement(1)'), 0);
  assert.equal(get('S.progress.lessonsDone.length'), 0);
  assert.equal(get('learnedCount()'), 0);
  fresh();
  assert.equal(get('applyPlacement(null)'), order.length);
  assert.equal(get('learnedCount()'), lessons.flatMap(L => L.words).length);
  assert.ok(get('learnedCount()') < get('LEVELS[0].words'), 'placing out of every lesson stays below the A1 gate');
});

test('markTyped marks like the exam: articles, umlaut shortcuts and case', () => {
  const mark = (it, a) => { ctx.__it = it; ctx.__a = a; return get('markTyped(__it, __a)'); };
  assert.equal(mark({ type: 'out', de: 'die Tomate', en: ['the tomato'] }, 'die tomate'), true);
  assert.equal(mark({ type: 'out', de: 'die Tomate', en: ['the tomato'] }, 'Tomate'), false);
  assert.equal(mark({ type: 'gap', a: ['zwölf'] }, 'zwo:lf'), true);
  assert.equal(mark({ type: 'gap', a: ['Guten Morgen'] }, 'guten morgen.'), true);
  assert.equal(mark({ type: 'in', de: 'falsch', en: ['wrong'] }, 'wrong'), true);
  const it = { type: 'in', de: 'falsch', en: ['wrong', 'false'] };
  assert.equal(mark(it, 'right'), false);
  assert.equal(it.expected, 'wrong, false');
});

test('gap items: one blank per missing word, the prompt says "words" when there are two, and the noun alone fills an article + noun gap', () => {
  const gaps = lessons.flatMap(L => L.words).filter(w => /\[[^\]]+\]/.test(w.ex));
  assert.ok(gaps.some(w => /\[\S+ \S+\]/.test(w.ex)), 'the lessons have two-word gaps to check');
  for (const w of gaps) {
    ctx.__w = w; const it = get('gapItem(__w)'), m = w.ex.match(/\[([^\]]+)\]/)[1], n = m.split(' ').length;
    assert.equal(it.shown.match(/_____/g).length, n, `"${w.ex}" shows ${n} blank(s)`);
    assert.equal(it.a[0], m);
    ctx.__it = it; const text = get('gapText(__it)');
    assert.match(text.ask, n > 1 ? /missing words/ : /missing word in/);
    assert.equal(text.label, n > 1 ? 'Missing words' : 'Missing word');
  }
  const mark = (ex, a) => { ctx.__it = get(`gapItem(${JSON.stringify({ ex, exEn: 'x' })})`); ctx.__a = a; return get('markTyped(__it, __a)'); };
  assert.equal(mark('Herr Weber ist [der Lehrer].', 'Lehrer'), true, '"Herr Weber ist Lehrer." is right too');
  assert.equal(mark('Herr Weber ist [der Lehrer].', 'der Lehrer'), true);
  assert.equal(mark('Herr Weber ist [der Lehrer].', 'die Lehrer'), false);
  assert.equal(mark('[Das ist] Ana.', 'ist'), false, 'only an article before a noun can be left out');
  assert.equal(mark('Der Test ist [ein bisschen] schwer.', 'bisschen'), false);
  assert.equal(mark('Ana kommt aus Mexiko. [Das stimmt].', 'Stimmt'), false);
});

test('placement: a learner who writes "Lehrer" for "Herr Weber ist [der Lehrer]." passes that lesson', () => {
  const L = lessons.find(L => L.words.some(w => w.ex.includes('[der Lehrer]')));
  assert.ok(L, 'a lesson has the gap');
  ctx.__w = L.words.find(w => w.ex.includes('[der Lehrer]'));
  ctx.__P = { order: [L.n, L.n + 1], at: 0, miss: 0, used: [], log: [], startedAt: 0, done: false, place: L.n };
  run(`__P.item = Object.assign(gapItem(__w), { lesson: ${L.n} })`);
  get('answerPlacement(__P, "Lehrer", 1000)');
  assert.equal(ctx.__P.log[0].ok, true);
  assert.equal(ctx.__P.at, 1);
});
