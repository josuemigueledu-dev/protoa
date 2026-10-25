import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { lessonFiles } from '../support/lessons.js';

// Load the browser's scripts in a bare context, in the page's order, up to map.js.
const js = f => readFileSync(new URL(`../../apps/deutsch/js/${f}`, import.meta.url), 'utf8');
const ctx = vm.createContext({ console, matchMedia: () => ({ matches: false }), addEventListener: () => {} });
ctx.window = ctx;
for (const f of ['content.js', ...lessonFiles(), 'core.js', 'map.js']) vm.runInContext(js(f), ctx, { filename: f });
const get = expr => vm.runInContext(expr, ctx);

const written = get('LESSONS.map(l => l.n)');
const units = get('GRAMMAR.filter(u => !u.stub)');
function learner(lessonsDone, lessonState = null) {
  vm.runInContext(`S.progress = ${JSON.stringify({ lessonsDone, lessonState })}`, ctx);
}
const featured = () => { const f = get('featuredGrammar()'); return f && { lesson: f.unit.lesson, today: f.today }; };
const newestUnitUpTo = n => Math.max(...units.filter(u => u.lesson <= n).map(u => u.lesson));

test('Grammar features the rule of the lesson you are on', () => {
  learner([]);
  assert.equal(get('currentLessonN()'), 1);
  assert.deepEqual(featured(), { lesson: 1, today: true });
  learner([1]);
  assert.deepEqual(featured(), { lesson: 2, today: true });
});

test('Grammar features the newest earlier rule when the current lesson has none', () => {
  const gap = written.find(n => n > 1 && !units.some(u => u.lesson === n));
  assert.ok(gap, 'some lesson has no grammar unit of its own');
  learner(written.filter(n => n < gap));
  assert.deepEqual(featured(), { lesson: newestUnitUpTo(gap), today: false });
});

test('Grammar features the lesson in progress, even out of order', () => {
  learner([1, 2], { n: 5, step: 'words' });
  assert.equal(get('currentLessonN()'), 5);
  assert.deepEqual(featured(), { lesson: 5, today: true });
});

test('Past the written line, Grammar features the newest rule done, not lesson 1', () => {
  learner(written);
  assert.equal(get('currentLessonN()'), null);
  assert.deepEqual(featured(), { lesson: newestUnitUpTo(Math.max(...written)), today: false });
});
