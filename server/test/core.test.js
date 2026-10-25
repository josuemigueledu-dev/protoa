import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { lessonFiles } from '../support/lessons.js';

// The browser's core.js in a bare context: spaced repetition, merging for sync,
// answer matching and JSON import/export.
const js = f => readFileSync(new URL(`../../apps/deutsch/js/${f}`, import.meta.url), 'utf8');
const store = new Map();
const ctx = vm.createContext({
  console, matchMedia: () => ({ matches: false }),
  localStorage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), get length() { return store.size; }, key: i => [...store.keys()][i] },
});
ctx.window = ctx;
for (const f of ['content.js', ...lessonFiles(), 'core.js']) vm.runInContext(js(f), ctx, { filename: f });
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

test('a word-order miss names the verb rule only when the verb moved, and otherwise the first word out of place', () => {
  exec('var orderLex = mergedLex({ verbs: {} })');
  const hint = (answer, target) => run(`diagnose(${JSON.stringify(answer)}, ${JSON.stringify(target)}, orderLex, null)`);
  assert.equal(hint('Ich komme aus Berlin.', 'Ich komme aus Berlin.').ok, true);
  const order = (answer, target) => { const r = hint(answer, target); assert.equal(r.kind, 'order', answer); return r.hint.replace(/<\/?em>/g, ''); };
  // lines with no verb get no verb rule
  assert.equal(order('Morgen Guten, Herr Weber.', 'Guten Morgen, Herr Weber.'), 'All the right words. It starts with Guten.');
  assert.equal(order('Guten Morgen, Weber Herr.', 'Guten Morgen, Herr Weber.'), 'All the right words. Guten Morgen is right; next comes Herr.');
  assert.equal(order('null zwei vier Raum', 'Raum zwei null vier.'), 'All the right words. It starts with Raum.');
  // the verb moved
  assert.equal(order('Ich aus Berlin komme.', 'Ich komme aus Berlin.'), 'All the right words. In a statement the verb is the second element.');
  assert.equal(order('Warum du lernst Deutsch?', 'Warum lernst du Deutsch?'), 'All the right words. The question word comes first, then the verb.');
  assert.equal(order('Du trinkst auch Kaffee, Lena?', 'Trinkst du auch Kaffee, Lena?'), 'All the right words. In a yes/no question the verb comes first.');
  assert.equal(order('Danke. Du spielst Gitarre?', 'Danke. Spielst du Gitarre?'), 'All the right words. In a yes/no question the verb comes first.');
  assert.equal(order('Arbeitest du dort, oder?', 'Du arbeitest dort, oder?'), 'All the right words. In a statement the verb is the second element.');
  // the verb is where it belongs, so the slip is elsewhere
  assert.equal(order('Deutsch lerne ich heute.', 'Heute lerne ich Deutsch.'), 'All the right words. It starts with Heute.');
});

test('checkEnglish accepts the meaning, forgives plurals, rejects other words', () => {
  assert.equal(call('checkEnglish', 'the house', ['house']).ok, true);
  assert.equal(call('checkEnglish', 'houses', ['house']).ok, true);
  assert.equal(call('checkEnglish', 'table', ['house']).ok, false);
  assert.equal(call('checkEnglish', '', ['house']).ok, false);
});

test('checkEnglish forgives a one-letter typo, but not another course word one letter away', () => {
  assert.equal(call('checkEnglish', 'teacer', ['teacher']).ok, true);
  assert.equal(call('checkEnglish', 'coffe', ['coffee']).ok, true);
  // wo/dort, Deutschland/Deutsch, richtig/acht, später/Wasser: the learner mixed up two words
  assert.equal(call('checkEnglish', 'there', ['where']).ok, false);
  assert.equal(call('checkEnglish', 'where', ['there']).ok, false);
  assert.equal(call('checkEnglish', 'German', ['Germany']).ok, false);
  assert.equal(call('checkEnglish', 'eight', ['right', 'correct']).ok, false);
  assert.equal(call('checkEnglish', 'water', ['later']).ok, false);
});

test('checkEnglish: no meaning of one course word passes as a typo of another word\'s meaning', () => {
  const clashes = run(`(() => { const out = [], words = allLessons().flatMap(L => L.words);
    for (const d of words) for (const o of words.concat(V1_WORDS)) if (o.de !== d.de) for (const m of o.en) {
      if (d.en.some(e => enKey(e) === enKey(m))) continue; // a shared meaning is right for both
      if (checkEnglish(m, d.en).ok) out.push(m + ' passes for ' + d.de);
    }
    return [...new Set(out)]; })()`);
  assert.deepEqual(clashes, []);
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

const reset = () => exec('S.settings = DEF_SETTINGS(); S.profile = DEF_PROFILE(); S.progress = DEF_PROGRESS(); S.cards = {}; S.ready = true');

test('export then import on a fresh copy keeps lessons done, activity, review stops and a passed exam', () => {
  reset();
  exec(`markLearned(LESSONS[0].words[0], LESSONS[0].n);
       Object.assign(S.progress, { lessonsDone: [1, 2, 3], v1Lessons: [4], reviewStops: ['r3'], stampsSeen: [1], levelsPassed: ['A1'], talkCount: 2, sounds: true,
         exams: [{ code: 'A1', date: '2026-10-20', score: 82, passed: true }], days: { '2026-10-20': { new: 12, reviews: 30, secs: 900 } } });`);
  const json = vm.runInContext('exportJSON()', ctx);

  // the new copy has its own lesson in progress; importing keeps it and adds what the export achieved
  exec(`S.progress = DEF_PROGRESS(); S.progress.lessonsDone = [5]; S.progress.lessonState = { n: 6, step: 2 }; S.progress.updatedAt = Date.now(); S.cards = {}`);
  run(`importJSON(${JSON.stringify(json)})`);
  const p = run('S.progress');
  assert.deepEqual(p.lessonsDone, [1, 2, 3, 5]);
  assert.deepEqual(p.v1Lessons, [4]);
  assert.deepEqual(p.days['2026-10-20'], { new: 12, reviews: 30, secs: 900 });
  assert.deepEqual(p.reviewStops, ['r3']);
  assert.deepEqual(p.levelsPassed, ['A1']);
  assert.equal(p.exams.length, 1);
  assert.equal(p.talkCount, 2);
  assert.equal(p.sounds, true);
  assert.deepEqual(p.lessonState, { n: 6, step: 2 });
  assert.equal(run('learnedCount()'), 1);
  // importing twice changes nothing
  run(`importJSON(${JSON.stringify(json)})`);
  assert.deepEqual(run('S.progress.lessonsDone'), [1, 2, 3, 5]);
  assert.equal(run('S.progress.exams.length'), 1);
});

test('import of a v1 export keeps its lessons apart from this app\'s and reads its n/r activity', () => {
  reset();
  run(`importJSON(${JSON.stringify(JSON.stringify({ lang: 'de', words: [{ de: 'Hallo', en: 'hello' }], lessonsDone: [0, 1, 2], history: { activity: { '2026-01-02': { n: 5, r: 9 } } } }))})`);
  const p = run('S.progress');
  assert.deepEqual(p.lessonsDone, []);
  assert.deepEqual(p.v1Lessons, [1, 2]);
  assert.equal(p.sounds, true);
  assert.deepEqual(p.days['2026-01-02'], { new: 5, reviews: 9 });
});

test('fixLessonArt swaps an unknown plate for the best tag match, drops unknown pictures and events, and reports unknown cast', () => {
  const manifest = [
    { kind: 'plate', id: 'plate.classroom', tags: ['kurs'] },
    { kind: 'plate', id: 'plate.cafe', tags: ['café', 'kaffee'] },
    { kind: 'cast', id: 'cast.weber' },
    { kind: 'word', id: 'word.kaffee' },
    { kind: 'event', id: 'event.rain' },
  ];
  const lesson = {
    title: 'Ein Kaffee im Café', theme: '', scene: { plate: 'plate.moon', place: '', cap: '', cast: [{ id: 'cast.weber' }, { id: 'cast.ghost' }] },
    words: [{ de: 'Kaffee', pic: 'kaffee' }, { de: 'Tee', pic: 'word.tee' }, { de: 'Wasser' }],
    twist: { event: 'event.snow' },
  };
  const out = JSON.parse(JSON.stringify(vm.runInContext(
    `(() => { const L = ${JSON.stringify(lesson)}, log = []; const bad = fixLessonArt(L, ${JSON.stringify(manifest)}, m => log.push(m)); return { L, bad, log }; })()`, ctx)));
  assert.equal(out.L.scene.plate, 'plate.cafe');
  assert.deepEqual(out.bad, ['unknown cast cast.ghost']);
  assert.equal(out.L.words[0].pic, 'kaffee');
  assert.equal('pic' in out.L.words[1], false);
  assert.equal('twist' in out.L, false);
  assert.equal(out.log.length, 3);
  // a known plate is kept, and the legacy scene id still resolves
  const kept = call('fixLessonArt', { scene: { id: 'classroom' }, words: [] }, manifest, () => {});
  assert.deepEqual(kept, []);
});

test('fixLessonArt falls back to the classroom when no tag matches, and reports a manifest without plates', () => {
  const plates = [{ kind: 'plate', id: 'plate.cafe', tags: ['café'] }, { kind: 'plate', id: 'plate.classroom', tags: [] }];
  const L = { title: 'Zahlen', scene: { plate: 'plate.nope' }, words: [] };
  const r = JSON.parse(JSON.stringify(vm.runInContext(`(() => { const L = ${JSON.stringify(L)}; fixLessonArt(L, ${JSON.stringify(plates)}, () => {}); return L.scene.plate; })()`, ctx)));
  assert.equal(r, 'plate.classroom');
  assert.deepEqual(call('fixLessonArt', { scene: {}, words: [] }, [], () => {}), ['no plates available']);
});

test('checkGlosses accepts a gloss that follows the German word for word, and names each mismatch', () => {
  const ok = { de: 'Guten Tag!', g: 'Guten=good|Tag=day' };
  const lesson = {
    notice: ok,
    words: [{ de: 'Tag', ex: 'Guten [Tag].', exG: 'Guten=good|Tag=day' }, { de: 'Hallo', ex: 'Hallo!', exG: 'Hi=hello' }, { de: 'Ja', ex: 'Ja.', exG: '' }],
    build: [{ de: 'Wie geht’s?', g: 'Wie=how|geht’s=goes' }],
    conv: [{ w: 'Danke.', g: 'Danke=thanks' }, { de: 'Bitte.' }],
  };
  assert.deepEqual(call('checkGlosses', lesson), [
    'word Hallo: "hallo" vs gloss "hi"',
    'word Ja: no gloss',
    'conv 1: no gloss',
  ]);
});

test('markLearned creates the card once, counts the word as new once, and keeps it in its first shard', () => {
  reset();
  const w = { de: 'Tisch' };
  exec(`markLearned(${JSON.stringify(w)}, 4); markLearned(${JSON.stringify(w)}, 7)`);
  assert.equal(run('learnedCount()'), 1);
  assert.equal(run(`cardShard('Tisch')`), 'l4');
  assert.equal(run('S.cards.l7'), null);
  assert.equal(run(`S.progress.days[todayStr()].new`), 1);
  assert.equal(run(`cardOf('Tisch').since`), today);
  assert.equal(run(`isLearned('Stuhl')`), false);
});

test('addSentenceCard stores a sentence card, and a repeat only pulls its due date earlier', () => {
  reset();
  const turn = { de: 'Ich [komme] aus Spanien.', en: 'I come from Spain.', g: 'x=y' };
  exec(`addSentenceCard(${JSON.stringify(turn)}, 3, { due: '2099-01-10' })`);
  const id = Object.keys(run('S.cards.sent.w'))[0];
  assert.equal(id.startsWith('s:'), true);
  assert.equal(run(`S.cards.sent.w[${JSON.stringify(id)}].learned`), true);
  assert.equal(run(`S.cards.sent.w[${JSON.stringify(id)}].r[0]`), '2099-01-10');
  exec(`addSentenceCard(${JSON.stringify(turn)}, 3, { due: '2099-01-20' })`);
  assert.equal(run(`S.cards.sent.w[${JSON.stringify(id)}].r[0]`), '2099-01-10');
  exec(`addSentenceCard(${JSON.stringify(turn)}, 3, { due: '2099-01-05' })`);
  assert.equal(run(`S.cards.sent.w[${JSON.stringify(id)}].r[0]`), '2099-01-05');
  assert.equal(run('Object.keys(S.cards.sent.w).length'), 1);
});

test('conversation lines are not counted as words by learnedCount or the goal', () => {
  reset();
  exec(`markLearned({ de: 'Tisch' }, 1); markLearned({ de: 'Stuhl' }, 1);
        addSentenceCard({ de: 'Das ist ein Tisch.', en: 'That is a table.' }, 1);
        addSentenceCard({ de: 'Guten Tag.', en: 'Good day.' }, 1)`);
  assert.equal(run('learnedCount()'), 2);
  assert.equal(run('goalInfo().learned'), 2);
});

test('goalInfo projects the finish date from words per day, or words per day from a fixed date', () => {
  reset();
  exec(`S.settings.target = 100; S.settings.perDay = 10;
        for (let i = 0; i < 20; i++) markLearned({ de: 'w' + i }, 1)`);
  let g = run('goalInfo()');
  assert.deepEqual([g.learned, g.remaining, g.perDay, g.today, g.pct], [20, 80, 10, 20, 20]);
  assert.equal(g.date, run(`addDays(todayStr(), 8)`));
  exec(`S.settings.fixed = 'date'; S.settings.targetDate = addDays(todayStr(), 4)`);
  g = run('goalInfo()');
  assert.equal(g.perDay, 20); // 80 words in 4 days
  exec(`S.settings.targetDate = todayStr()`);
  assert.equal(run('goalInfo().perDay'), 80); // the target day itself is the last day: never divides by zero
  // a date that has gone by (a learner back after weeks) is over: the per-day pace takes over, not every word today
  exec(`S.settings.targetDate = addDays(todayStr(), -3)`);
  g = run('goalInfo()');
  assert.deepEqual([g.perDay, g.passed, g.date], [10, true, run(`addDays(todayStr(), 8)`)]);
  assert.equal(run(`(S.settings.targetDate = addDays(todayStr(), 4), goalInfo().passed)`), false);
  exec('S.settings.target = 10');
  g = run('goalInfo()');
  assert.deepEqual([g.remaining, g.perDay, g.pct], [0, 0, 100]);
});
