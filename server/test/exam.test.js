import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { lessonFiles } from '../support/lessons.js';

// Load the browser's scripts in a bare context, in the page's order, with a
// learner who has learned every built-in lesson word.
const js = f => readFileSync(new URL(`../../apps/deutsch/js/${f}`, import.meta.url), 'utf8');
const ctx = vm.createContext({ console, matchMedia: () => ({ matches: false }) });
ctx.window = ctx;
for (const f of ['content.js', ...lessonFiles(), 'core.js', 'levels.js']) vm.runInContext(js(f), ctx, { filename: f });
const get = expr => vm.runInContext(expr, ctx);
const run = code => vm.runInContext(code, ctx);

const lessons = get('LESSONS');
const words = lessons.flatMap(L => L.words);
const known = new Set(words.map(w => w.de));
const bare = s => s.replace(/[\[\]]/g, '');
const examples = new Set(words.map(w => bare(w.ex)));

function learner({ ai = false, passed = [], extra = 0 } = {}) {
  run(`S.ai = ${ai ? '{}' : 'null'};
    S.progress = { lessonsDone: [], levelsPassed: ${JSON.stringify(passed)} };
    S.cards = { all: { updatedAt: 0, w: {} } };`);
  const w = get('S.cards.all.w');
  for (const x of words) w[x.de] = { learned: true };
  for (let i = 0; i < extra; i++) w[`extra${i}`] = { learned: true };
}

test('A1 exam is full and built only from the learner\'s own words', () => {
  learner();
  const plan = get('EXAM_PLAN.A1');
  for (let round = 0; round < 20; round++) { // the exam is shuffled; check many draws
    const exam = get('buildExam("A1")');
    const by = sec => exam.items.filter(i => i.sec === sec);
    assert.equal(exam.code, 'A1');
    assert.equal(by('wort').filter(i => i.type === 'in').length, plan.vocabIn);
    assert.equal(by('wort').filter(i => i.type === 'out').length, plan.vocabOut);
    assert.equal(by('gram').length, plan.gram);
    for (const sec of ['hoeren', 'lesen', 'gap', 'order', 'trans']) assert.ok(by(sec).length > 0, `no ${sec} items`);
    for (const i of by('wort')) assert.ok(known.has(i.de), `vocabulary item "${i.de}" is not a lesson word`);
    for (const i of [...by('gap'), ...by('order'), ...by('trans')]) assert.ok(examples.has(i.de), `sentence "${i.de}" is not a lesson example`);
    for (const i of by('hoeren').filter(i => i.type === 'dict')) assert.ok(examples.has(i.de), `dictation "${i.de}" is not a lesson example`);
    for (const i of by('gap')) assert.ok(i.shown.includes('_____') && i.de.includes(i.a[0]));
    // no word or sentence twice
    const vocab = by('wort').map(i => i.type + i.de);
    assert.equal(new Set(vocab).size, vocab.length, 'a word is asked twice');
  }
});

test('A1 exam without Claude has no free production; with Claude it adds writing and speaking', () => {
  learner({ ai: false });
  const off = get('buildExam("A1")');
  assert.equal(off.claude, false);
  assert.ok(!off.items.some(i => i.sec === 'schreiben' || i.sec === 'sprechen'));
  learner({ ai: true });
  const on = get('buildExam("A1")');
  assert.equal(on.items.filter(i => i.sec === 'schreiben').length, 1);
  assert.equal(on.items.filter(i => i.sec === 'sprechen').length, get('EXAM_PLAN.A1.speak'));
});

test('every exam text item is well formed and has an answer', () => {
  for (const code of ['A1', 'A2']) {
    const T = get(`EXAM_TEXTS.${code}`);
    for (const t of [...T.read, ...T.listen]) {
      assert.ok(t.text.length > 40 && t.q.length >= 3);
      for (const q of t.q) {
        if (Array.isArray(q)) assert.ok(typeof q[0] === 'string' && typeof q[1] === 'boolean');
        else { assert.ok(q.o.length >= 2 && Number.isInteger(q.a) && q.a >= 0 && q.a < q.o.length); }
      }
    }
    assert.ok(T.write && T.speak.length >= get(`EXAM_PLAN.${code}.speak`));
  }
});

test('the A1 gate opens at the A1 word count and closes when the exam is passed', () => {
  const need = get('LEVELS[0].words');
  learner({ extra: 0 });
  const have = get('learnedCount()');
  const gate = () => get('examGate()');
  if (have < need) assert.equal(gate(), null, 'gate open before enough words');
  learner({ extra: need - have });
  assert.equal(get('learnedCount()'), need);
  assert.equal(gate().code, 'A1');
  assert.equal(get('lessonBlocked(1)').code, 'A1', 'new lessons must be blocked until the exam is passed');
  learner({ extra: need - have, passed: ['A1'] });
  assert.equal(gate(), null);
});

test('the course can reach the A1 gate: 60 A1 lessons of at least 10 words, no word taught twice', () => {
  const need = get('LEVELS[0].words');
  const a1 = get('COURSE').length; // the course is the A1 course until A2 stations are added
  assert.ok(a1 * 10 >= need, `${a1} lessons x 10 words < the A1 gate of ${need}`);
  assert.equal(known.size, words.length, 'a word appears in two lessons, so it counts once toward the gate');
});
