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

// gradeExam runs in the page; give it a stand-in DOM and screen so it can run here.
function sitExam({ ai, marker }) {
  learner({ ai: true });
  run(`S.progress.exam = buildExam("A1"); S.progress.exams = []; S.progress.examCooldown = {}; EXAM_RESULT = null;
    S.progress.exam.items.forEach(it => { it.answer = it.type === 'tf' || it.type === 'mc' ? 1 : 'nein'; });`);
  const el = () => ({ nodeType: 1, append() {}, setAttribute() {} });
  Object.assign(ctx, { document: { createElement: el, createTextNode: () => ({ nodeType: 3 }) }, teacherSlot: el, render() {}, checkStamps() {}, AI: { run: marker } });
  run(`S.ai = ${ai ? '{}' : 'null'}`);
  return get('gradeExam(document.createElement("div"))').then(() => get('EXAM_RESULT'));
}
const free = it => it.type === 'write' || it.type === 'speak';

test('exam: when Claude can\'t mark writing and speaking, they are left out and a failed attempt doesn\'t count', async () => {
  for (const [why, opts] of [['the marking call fails', { ai: true, marker: async () => { throw new Error('timeout'); } }], ['AI went away mid-exam', { ai: false, marker: async () => assert.fail('no call without AI') }]]) {
    const R = await sitExam(opts);
    const items = R.items.filter(free);
    assert.ok(items.length > 0 && items.every(it => it.ungraded), `${why}: free tasks must be unmarked, not scored zero`);
    assert.equal(R.unmarked, items.length, why);
    assert.equal(R.max, R.items.filter(it => !free(it)).reduce((a, it) => a + it.max, 0), `${why}: unmarked tasks are out of the total`);
    assert.ok(!R.bySec.schreiben && !R.bySec.sprechen, why);
    assert.equal(R.passed, false);
    assert.equal(get('examCooldownLeft("A1")'), 0, `${why}: no cooldown for an attempt that couldn't be marked`);
    assert.equal(get('S.progress.exams.length'), 0, `${why}: the attempt is not recorded`);
  }
});

test('exam: when Claude marks writing and speaking, they count and a failed attempt starts the cooldown', async () => {
  let sent;
  const R = await sitExam({ ai: true, marker: async (task, vars) => { sent = vars; return { marks: vars.items.map(x => ({ i: x.i, points: 0, note: 'Noch nicht.' })) }; } });
  assert.equal(R.unmarked, 0);
  assert.ok(sent.items.some(x => x.kind === 'write') && sent.items.some(x => x.kind === 'speak'));
  assert.ok(R.bySec.schreiben && R.bySec.sprechen);
  assert.equal(R.max, R.items.reduce((a, it) => a + it.max, 0));
  assert.equal(R.passed, false);
  assert.ok(get('examCooldownLeft("A1")') > 0);
  assert.equal(get('S.progress.exams.length'), 1);
});

test('exam grammar: uncountable nouns are never asked with ein/eine, and the writing task has its English line', () => {
  learner({ ai: true });
  const mass = [...get('MASS_NOUNS')].map(de => de.replace(/^(der|die|das) /, ''));
  for (const code of ['A1', 'A2']) for (let round = 0; round < 40; round++) {
    const exam = get(`buildExam("${code}")`);
    for (const it of exam.items.filter(i => i.type === 'art' && i.prompt.endsWith('(a / an)'))) {
      assert.ok(!mass.some(m => it.prompt.includes(` ${m}.`)), `${code}: "${it.prompt}" asks for ein/eine with an uncountable noun`);
      assert.ok(!it.prompt.includes(' Moment.'), `${code}: "${it.prompt}"`);
    }
    const write = exam.items.find(i => i.type === 'write');
    assert.ok(write && write.taskEn, `${code}: the writing task has no English line`);
  }
});
