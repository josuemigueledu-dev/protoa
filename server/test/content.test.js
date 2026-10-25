import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { lessonFiles } from '../support/lessons.js';

// Load the browser's content.js and the pure helpers from core.js in a bare
// context (no DOM), the same way the page does: one shared global scope.
const js = f => readFileSync(new URL(`../../apps/deutsch/js/${f}`, import.meta.url), 'utf8');
const ctx = vm.createContext({ console, matchMedia: () => ({ matches: false }) });
ctx.window = ctx; // core.js feature-detects speechSynthesis on window
for (const f of ['content.js', ...lessonFiles()]) vm.runInContext(js(f), ctx, { filename: f });
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
    assert.ok(L.words.length >= 10 && L.words.length <= 14, at('words', `need 10–14 new words, has ${L.words.length}`));
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

// Generated lessons: art ids outside the manifest are repaired or dropped, never defaulted to the classroom.
vm.runInContext(js('art-bundle.js'), ctx, { filename: 'art-bundle.js' });
const fixLessonArt = get('fixLessonArt');
const manifest = get('ART_MANIFEST');

test('fixLessonArt swaps an unknown plate for the best tag match and logs it', () => {
  const log = [];
  const L = { title: 'At the café', theme: 'Ein Kaffee, bitte', words: [], scene: { plate: 'plate.moon', place: 'Café, food and drink' } };
  assert.deepEqual([...fixLessonArt(L, manifest, m => log.push(m))], []);
  assert.equal(L.scene.plate, 'plate.cafe');
  assert.equal(log.length, 1);
});

test('fixLessonArt leaves known ids alone and drops unknown pictures and events', () => {
  const log = [];
  const L = { title: 't', theme: 't', scene: { plate: 'plate.cafe', cast: [{ id: 'cast.weber', x: 1 }] }, words: [{ de: 'der Kaffee', pic: 'kaffee' }, { de: 'das Ufo', pic: 'ufo' }, { de: 'das Brot', pic: 'word.brot' }], twist: { at: 1, event: 'event.ufo' } };
  assert.deepEqual([...fixLessonArt(L, manifest, m => log.push(m))], []);
  assert.equal(L.scene.plate, 'plate.cafe');
  assert.deepEqual(L.words.map(w => w.pic), ['kaffee', undefined, 'word.brot']);
  assert.equal(L.twist, undefined);
  assert.equal(log.length, 2);
});

test('fixLessonArt maps a legacy scene.id to its plate and rejects unknown cast', () => {
  const L = { title: 't', theme: 't', scene: { id: 'cafe', cast: [{ id: 'cast.ghost', x: 1 }] }, words: [] };
  assert.deepEqual([...fixLessonArt(L, manifest, () => {})], ['unknown cast cast.ghost']);
  assert.equal(L.scene.plate, 'plate.cafe');
});

test('index.html loads every lesson file, in order, right after content.js', () => {
  const html = readFileSync(new URL('../../apps/deutsch/index.html', import.meta.url), 'utf8');
  const loaded = [...html.matchAll(/<script src="js\/([^"]+)"/g)].map(m => m[1]);
  const files = lessonFiles();
  assert.ok(files.length > 0, 'no lesson files found');
  assert.deepEqual(loaded.slice(loaded.indexOf('content.js') + 1, loaded.indexOf('content.js') + 1 + files.length), files,
    'index.html must load js/lessons/*.js in order, directly after content.js');
});

test('each lesson file holds the lesson its name says', () => {
  const ns = [...lessons.map(L => L.n)];
  assert.deepEqual(ns, lessonFiles().map(f => Number(f.match(/(\d+)\.js$/)[1])).sort((a, b) => a - b));
  assert.equal(new Set(ns).size, ns.length, 'two lessons share a number');
});

// lesson-experience.md §2: never test what wasn't taught. Every German word the
// learner must choose or produce (build tiles, gap answers and distractors, the
// learner's own conversation lines) was introduced in this lesson or an earlier one.
// Lessons on this list still break the rule and wait for the story agent's rework;
// remove a number when its lesson is fixed (a stale entry fails the test).
const NOT_YET_REWORKED = new Set([]);
const NAMES = new Set(['herr', 'frau', 'weber', 'ana', 'lena', 'murat', 'alex', 'name', 'city', 'field',
  'tomasz', 'berlin', 'madrid', 'paris', 'mexiko', 'rom', 'neukölln']); // people and places, not vocabulary
const tokens = s => String(s).toLowerCase().replace(/\{(\w+)\}/g, '$1').split(/[^\p{L}]+/u).filter(Boolean);

function untaught(upTo) {
  const known = new Set(NAMES);
  for (const L of lessons.filter(l => l.n <= upTo.n)) {
    for (const w of L.words) {
      for (const t of tokens(w.de)) known.add(t);
      for (const t of tokens(w.pl ?? '')) known.add(t);
      for (const f of Object.values(w.forms ?? {})) for (const t of tokens(f)) known.add(t);
    }
  }
  const used = [];
  const add = (where, text) => { for (const t of tokens(text)) if (!known.has(t)) used.push(`${where}: "${t}"`); };
  upTo.build.forEach((b, i) => { add(`build ${i}`, b.de); for (const e of b.extra ?? []) add(`build ${i} extra`, e); });
  upTo.conv.forEach((t, i) => {
    if (!t.l) return;
    add(`conv ${i}`, t.de);
    for (const e of t.extra ?? []) add(`conv ${i} extra`, e);
  });
  return used;
}

for (const L of lessons) {
  test(`lesson ${L.n} only tests words taught so far`, () => {
    const bad = untaught(L);
    if (NOT_YET_REWORKED.has(L.n)) return assert.ok(bad.length > 0, `lesson ${L.n} is clean now: remove it from NOT_YET_REWORKED`);
    assert.equal(bad.length, 0, `untaught words in lesson ${L.n}: ${bad.join(', ')}`);
  });
}

// Owner's rule: nothing religious or political anywhere in the lessons (text, scenes, examples, exam).
// Everyday words stay allowed: wählen / Wahl (to dial or choose, a choice) are not listed.
// Known gap: christ\w* also matches the name Christian and Christstollen; reword or adjust if one appears.
const BANNED = /\b(kirche|kirchen|church|gott|god|jesus|christ\w*|weihnacht\w*|christmas|ostern|easter|ramadan|moschee|mosque|synagoge|synagogue|gebet|prayer|pray|religio\w*|bibel|bible|papst|pope|politi\w*|partei\w*|party leader|wahlen|election|vote|voting|protest\w*|demonstration|regierung|government|kanzler\w*|chancellor|präsident\w*|president|minister\w*|bundestag|afd|cdu|spd|fdp|trump|merkel|putin)\b/i;

test('no lesson text is religious or political', () => {
  const hits = [];
  for (const L of lessons) {
    const text = JSON.stringify(L).replace(/"[\w$]+":/g, ' ');
    const m = text.match(BANNED);
    if (m) hits.push(`lesson ${L.n}: "${m[0]}"`);
  }
  assert.deepEqual(hits, [], 'remove religious or political content (owner rule); if this is a false positive, adjust BANNED');
});
