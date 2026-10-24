import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// The browser's core.js in a bare context: spaced repetition, merging for sync,
// answer matching and JSON import/export.
const js = f => readFileSync(new URL(`../../apps/deutsch/js/${f}`, import.meta.url), 'utf8');
const store = new Map();
const ctx = vm.createContext({
  console, matchMedia: () => ({ matches: false }),
  localStorage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), get length() { return store.size; }, key: i => [...store.keys()][i] },
});
ctx.window = ctx;
for (const f of ['content.js', 'core.js']) vm.runInContext(js(f), ctx, { filename: f });
// plain-data results from the vm realm, so deepEqual compares them with local literals
const exec = code => vm.runInContext(code, ctx);
const run = code => JSON.parse(JSON.stringify(vm.runInContext(`(${code})`, ctx) ?? null));
const call = (fn, ...args) => run(`${fn}(...${JSON.stringify(args)})`);
const today = run('todayStr()');

test('schedule: a new card grows 1 → 4 → ease-scaled days, and never passes 45', () => {
  let c = run('newCard()');
  c = call('schedule', c, 2); assert.deepEqual(c.slice(1, 4), [1, 250, 1]);
  c = call('schedule', c, 2); assert.deepEqual(c.slice(1, 4), [4, 250, 2]);
  c = call('schedule', c, 2); assert.equal(c[1], 10);
  for (let i = 0; i < 10; i++) c = call('schedule', c, 3);
  assert.equal(c[1], 45);
  assert.equal(c[0], run(`addDays(todayStr(), 45)`));
});

test('schedule: a lapse resets the card, counts the lapse and lowers ease to a floor', () => {
  let c = [today, 20, 140, 5, 0];
  c = call('schedule', c, 0);
  assert.deepEqual(c, [today, 0, 130, 0, 1]);
  c = call('schedule', [today, 4, 135, 2, 0], 1);
  assert.equal(c[2], 130);
});

test('mergeProgress keeps everything either device achieved', () => {
  const a = { updatedAt: 2, lessonsDone: [1, 3], days: { d1: { new: 5, reviews: 1 } }, sounds: false, talkCount: 2, levelsPassed: ['A1'], examCooldown: { A1: 5 } };
  const b = { updatedAt: 1, lessonsDone: [2, 3], days: { d1: { new: 2, reviews: 9 }, d2: { new: 1, reviews: 0 } }, sounds: true, talkCount: 7, examCooldown: { A1: 9, A2: 1 } };
  for (const [x, y] of [[a, b], [b, a]]) { // order must not matter for the union parts
    const m = call('mergeProgress', x, y);
    assert.deepEqual(m.lessonsDone, [1, 2, 3]);
    assert.deepEqual(m.levelsPassed, ['A1']);
    assert.equal(m.sounds, true);
    assert.equal(m.talkCount, 7);
    assert.deepEqual(m.days.d1, { new: 5, reviews: 9, secs: 0 });
    assert.ok(m.days.d2);
    assert.deepEqual(m.examCooldown, { A1: 9, A2: 1 });
  }
});

test('mergeProgress does not modify its inputs', () => {
  const a = { updatedAt: 2, lessonsDone: [1] }, b = { updatedAt: 1, lessonsDone: [2] };
  const before = JSON.stringify([a, b]);
  call('mergeProgress', a, b);
  assert.equal(JSON.stringify([a, b]), before);
});

test('mergeShard keeps, per card, the copy with more reviews', () => {
  const local = { updatedAt: 5, w: { x: { r: [today, 4, 250, 3, 0], learned: true }, y: { r: [today, 1, 250, 1, 0] } } };
  const remote = { updatedAt: 9, w: { x: { r: [today, 1, 250, 1, 0] }, z: { r: [today, 1, 250, 1, 0], learned: true } } };
  const m = call('mergeShard', local, remote);
  assert.equal(m.updatedAt, 9);
  assert.equal(m.w.x.r[3], 3);
  assert.ok(m.w.y && m.w.z);
  assert.equal(call('mergeShard', null, remote).updatedAt, 9);
  assert.equal(call('mergeShard', local, null).updatedAt, 5);
});

test('answers match loosely on umlauts, case and punctuation', () => {
  assert.equal(call('sameWord', 'Grüße', 'gruesse'), true);
  assert.equal(call('sameWord', 'Straße', 'Strasse'), true);
  assert.equal(call('sameWord', 'Haus', 'Maus'), false);
  assert.equal(call('exactWord', 'Haus', 'haus'), true);
  assert.deepEqual(call('deTokens', '„Hallo, wie geht es?“'), ['Hallo', 'wie', 'geht', 'es']);
  assert.equal(call('editDist', 'Tisch', 'Tich'), 1);
  assert.equal(call('applyShortcuts', 'Scho:n, Mu:ller, a"'), 'Schön, Müller, ä');
});

test('checkEnglish accepts the meaning, forgives plurals, rejects other words', () => {
  assert.equal(call('checkEnglish', 'the house', ['house']).ok, true);
  assert.equal(call('checkEnglish', 'houses', ['house']).ok, true);
  assert.equal(call('checkEnglish', 'table', ['house']).ok, false);
  assert.equal(call('checkEnglish', '', ['house']).ok, false);
});

test('export then import moves learned words and progress to a fresh copy', () => {
  const word = run('LESSONS[0].words[0]');
  exec(`S.settings = DEF_SETTINGS(); S.profile = DEF_PROFILE(); S.progress = DEF_PROGRESS(); S.cards = {}; S.ready = true;
       markLearned(LESSONS[0].words[0], LESSONS[0].n); S.progress.lessonsDone = [LESSONS[0].n];`);
  assert.equal(run('learnedCount()'), 1);
  const json = vm.runInContext('exportJSON()', ctx);
  const out = JSON.parse(json);
  assert.equal(out.words.length, 1);
  assert.equal(out.words[0].de, word.de);

  exec('S.progress = DEF_PROGRESS(); S.cards = {}');
  assert.deepEqual(run(`importJSON(${JSON.stringify(json)})`), { added: 1, merged: 0 });
  assert.equal(run('learnedCount()'), 1);
  assert.equal(run(`isLearned(${JSON.stringify(word.de)})`), true);
  // importing again merges instead of duplicating
  assert.deepEqual(run(`importJSON(${JSON.stringify(json)})`), { added: 0, merged: 1 });
  assert.equal(run('learnedCount()'), 1);
  assert.throws(() => vm.runInContext('importJSON("{}")', ctx), /words/);
});
