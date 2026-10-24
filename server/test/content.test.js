import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Load the browser's content.js and the pure helpers from core.js in a bare
// context (no DOM), the same way the page does: one shared global scope.
const js = f => readFileSync(new URL(`../../apps/deutsch/js/${f}`, import.meta.url), 'utf8');
const ctx = vm.createContext({ console, matchMedia: () => ({ matches: false }) });
ctx.window = ctx; // core.js feature-detects speechSynthesis on window
vm.runInContext(js('content.js'), ctx, { filename: 'content.js' });
vm.runInContext(js('core.js'), ctx, { filename: 'core.js' });
const get = expr => vm.runInContext(expr, ctx);
const lessons = get('LESSONS');
const checkGlosses = get('checkGlosses');
const scenes = get('Object.keys(SCENES)');
const pics = get('Object.keys(PICS)');
const course = get('COURSE');

const TYPES = ['n', 'v', 'adj', 'adv', 'prep', 'phrase', 'interj', 'conj', 'pron'];
const MOODS = ['neutral', 'pleased', 'thinking', 'amused', 'surprised'];
const PLACEHOLDER = /\{(\w+)\}/g;
const str = v => typeof v === 'string' && v.trim().length > 0;

for (const L of lessons) {
  test(`lesson ${L.n} (${L.title}) follows the content.js conventions`, () => {
    const at = (where, msg) => `lesson ${L.n} ${where}: ${msg}`;
    for (const k of ['title', 'theme', 'can']) assert.ok(str(L[k]), at(k, 'missing'));
    assert.ok(course.some(c => c.n === L.n), at('COURSE', 'no station for this lesson'));

    // scene: the old shape (id) or the new one (plate + cast)
    const sc = L.scene;
    assert.ok(sc && str(sc.place) && str(sc.time) && str(sc.cap), at('scene', 'needs place, time, cap'));
    assert.ok(Array.isArray(sc.intro) && sc.intro.length > 0 && sc.intro.every(str), at('scene.intro', 'needs lines'));
    if (sc.id !== undefined) assert.ok(scenes.includes(sc.id), at('scene.id', `unknown scene "${sc.id}"`));
    else assert.ok(str(sc.plate) && sc.plate.startsWith('plate.'), at('scene', 'needs id or plate.*'));
    if (sc.plate !== undefined) assert.match(sc.plate, /^plate\.[\w-]+$/, at('scene.plate', 'bad id'));
    if (sc.cast !== undefined) {
      assert.ok(Array.isArray(sc.cast) && sc.cast.length > 0, at('scene.cast', 'must be a non-empty array'));
      for (const c of sc.cast) {
        assert.match(c.id, /^cast\.[\w-]+$/, at('scene.cast', 'bad id'));
        assert.ok(Number.isFinite(c.x), at('scene.cast', 'x must be a number'));
      }
    }

    // notice
    const n = L.notice;
    for (const k of ['de', 'g', 'q', 'note', 'grammar']) assert.ok(str(n?.[k]), at('notice', `missing ${k}`));
    if (n.sketch !== undefined) assert.ok(str(n.sketch.type), at('notice.sketch', 'needs a type'));

    // words
    assert.ok(L.words.length >= 8 && L.words.length <= 14, at('words', `need 8–14, has ${L.words.length}`));
    const seen = new Set();
    for (const w of L.words) {
      const wh = `word "${w.de}"`;
      for (const k of ['de', 'ipa', 'resp', 'syl', 'ex', 'exEn', 'exG']) assert.ok(str(w[k]), at(wh, `missing ${k}`));
      assert.ok(Array.isArray(w.en) && w.en.length > 0 && w.en.every(str), at(wh, 'en must be a list'));
      assert.ok(TYPES.includes(w.type), at(wh, `bad type "${w.type}"`));
      assert.ok(/\[[^\]]+\]/.test(w.ex), at(wh, 'ex needs the word in [brackets]'));
      assert.ok(!seen.has(w.de), at(wh, 'listed twice'));
      seen.add(w.de);
      if (w.type === 'n') {
        assert.ok(['m', 'f', 'n'].includes(w.g), at(wh, 'noun needs g'));
        assert.ok(str(w.pl), at(wh, 'noun needs pl'));
        assert.ok(w.de.startsWith({ m: 'der ', f: 'die ', n: 'das ' }[w.g]), at(wh, 'article does not match g'));
      }
      if (w.type === 'v' && w.forms) {
        assert.deepEqual([...Object.keys(w.forms)], ['ich', 'du', 'er', 'wir', 'ihr', 'Sie'], at(wh, 'forms keys'));
      }
      if (w.pic !== undefined) {
        assert.ok(str(w.pic), at(wh, 'pic must be an id'));
        if (!/^[\w-]+\.[\w-]+$/.test(w.pic)) assert.ok(pics.includes(w.pic), at(wh, `unknown pic "${w.pic}"`));
      }
    }

    // build
    assert.ok(L.build.length >= 3, at('build', 'need at least 3 items'));
    L.build.forEach((b, i) => {
      assert.ok(['tiles', 'gap'].includes(b.type), at(`build ${i}`, 'bad type'));
      assert.ok(str(b.de) && str(b.en), at(`build ${i}`, 'needs de and en'));
      if (b.type === 'gap') {
        const len = b.de.split(/\s+/).length;
        assert.ok(b.gaps?.length > 0 && b.gaps.every(g => Number.isInteger(g) && g >= 0 && g < len), at(`build ${i}`, 'gaps out of range'));
      }
    });

    // conversation
    assert.ok(L.conv.length >= 6, at('conv', 'too short'));
    assert.ok(L.conv.some(t => t.l), at('conv', 'no learner turns'));
    assert.ok(!L.conv[0].l, at('conv', 'must open with the partner'));
    L.conv.forEach((t, i) => {
      if (t.l) {
        assert.ok(str(t.de) && str(t.en) && str(t.react), at(`conv ${i}`, 'learner turn needs de, en, react'));
        assert.ok(['tiles', 'gap', 'translate', 'free'].includes(t.type), at(`conv ${i}`, 'bad type'));
        if (t.type === 'tiles' || t.type === 'gap') {
          const len = t.de.split(/\s+/).length;
          assert.ok(t.gaps?.every(g => Number.isInteger(g) && g >= 0 && g < len), at(`conv ${i}`, 'gaps out of range'));
        }
      } else {
        assert.ok(str(t.w), at(`conv ${i}`, 'partner line needs w'));
        assert.ok(MOODS.includes(t.mood), at(`conv ${i}`, `bad mood "${t.mood}"`));
      }
    });

    // placeholders must be ones fill() knows about
    const all = JSON.stringify(L);
    for (const m of all.matchAll(PLACEHOLDER)) assert.ok(['name', 'city', 'field'].includes(m[1]), at('text', `unknown placeholder {${m[1]}}`));

    // lexicon
    assert.ok(L.lex?.verbs && L.lex?.nouns, at('lex', 'needs verbs and nouns'));
    for (const [v, f] of Object.entries(L.lex.verbs)) assert.deepEqual([...Object.keys(f)], ['ich', 'du', 'er', 'wir', 'ihr', 'Sie'], at(`lex.verbs.${v}`, 'forms'));
    for (const [nn, g] of Object.entries(L.lex.nouns)) assert.ok(['m', 'f', 'n'].includes(g), at(`lex.nouns.${nn}`, 'bad gender'));

    // optional new-format fields, checked when present
    if (L.sound !== undefined) assert.ok(str(L.sound.focus), at('sound', 'needs focus'));
    if (L.sound?.words !== undefined) assert.ok(Array.isArray(L.sound.words) && L.sound.words.length > 0, at('sound.words', 'must be a list'));
    if (L.twist !== undefined) {
      assert.ok(Number.isInteger(L.twist.at) && L.twist.at >= 0 && L.twist.at < L.conv.length, at('twist.at', 'not a conversation index'));
      assert.match(L.twist.event, /^event\.[\w-]+$/, at('twist.event', 'bad id'));
      if (L.twist.mood !== undefined) assert.ok(MOODS.includes(L.twist.mood), at('twist.mood', 'bad mood'));
    }
    if (L.warmup !== undefined) assert.ok(Array.isArray(L.warmup) && L.warmup.length >= 3 && L.warmup.length <= 5, at('warmup', 'needs 3–5 words'));
  });

  test(`lesson ${L.n} glosses cover every German word`, () => {
    const bad = [...checkGlosses(L)];
    assert.equal(bad.length, 0, bad.join("; "));
  });
}

test('lessons are numbered 1..N in order with no repeated word across lessons', () => {
  lessons.forEach((L, i) => assert.equal(L.n, i + 1));
  const owner = new Map();
  for (const L of lessons) for (const w of L.words) {
    assert.ok(!owner.has(w.de), `"${w.de}" is in lesson ${owner.get(w.de)} and lesson ${L.n}`);
    owner.set(w.de, L.n);
  }
});

test('COURSE and CHAPTERS are consistent', () => {
  course.forEach((c, i) => assert.equal(c.n, i + 1));
  const ch = get('CHAPTERS');
  assert.equal(ch[0].from, 1);
  ch.forEach((c, i) => i && assert.ok(c.from > ch[i - 1].from));
  assert.ok(ch.at(-1).from <= course.length);
});
