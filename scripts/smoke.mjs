// Browser smoke test: the app loads at phone and desktop width, in light and
// dark, with no console errors and no sideways scrolling, and lesson 1 can be
// clicked from its scene to its first word check. Left open overnight, it shows
// the new day without disturbing a lesson in progress. Every built-in lesson can be
// played to its end with its own model answers (Done → Continue lands on the new stop, after the last lesson too), and lesson 1 with misses and a reload.
// A sheet over a lesson (search, a word card) keeps the keys to itself. A step that passes
// straight on lets the old screen finish leaving. Pausing the exam keeps the answer being typed.
// A review card answered wrong and graded Good anyway is not counted as recalled.
// Grammar keeps the tab it was opened from lit, and its back button leads there (or back into the lesson).
// A Grammar unit opens at its top, however far the list or the lesson was scrolled.
// "Not a beginner?" places a learner who knows lessons 1–5 at Lesson 6, on the map.
// Run: npm run smoke (needs playwright: `npm i --no-save playwright && npx playwright install chromium`)
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const PORT = 8790 + Math.floor(Math.random() * 100);
const BASE = `http://localhost:${PORT}/deutsch/`;
const server = spawn('node', ['server/src/index.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), ANTHROPIC_API_KEY: '' }, stdio: 'ignore' });

const failures = [];
const fail = msg => { failures.push(msg); console.error('FAIL ' + msg); };

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(BASE)).ok) return; } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('server did not start');
}

async function open(browser, label, viewport, colorScheme) {
  const ctx = await browser.newContext({ viewport, colorScheme });
  const page = await ctx.newPage();
  // GPU driver chatter from headless WebGL is not an app error
  page.on('console', m => { if (m.type() === 'error') fail(`${label}: console error: ${m.text()}`); });
  page.on('pageerror', e => fail(`${label}: uncaught error: ${e.message}`));
  await page.goto(BASE);
  await page.waitForSelector('#view > *');
  await page.waitForTimeout(500);
  return { page, ctx };
}

// a new screen is drawn two frames after the old one starts leaving (render() in ui.js): wait for it
const drawn = page => page.waitForFunction(() => document.querySelector('#view > .view:not(.leaving)'));

async function noSidewaysScroll(page, label) {
  // the document never scrolls (the app shell); #app is the scroller, so measure both
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: Math.max(document.documentElement.scrollWidth, document.getElementById('app').scrollWidth), innerWidth }));
  if (scrollWidth > innerWidth) fail(`${label}: page scrolls sideways (${scrollWidth}px in a ${innerWidth}px window)`);
}

// The notice's "Show how it works" note sits in a flex box (.fb): its text and
// <b>/<em> must stay one block, not one narrow column each.
async function notesReadAsText(page, label) {
  const show = page.locator('button', { hasText: 'Show how it works' });
  if (!await show.count()) return fail(`${label}: lesson 1 notice has no "Show how it works" button`);
  await show.click();
  const columns = await page.evaluate(() => Math.max(...[...document.querySelectorAll('.fb')].map(f => [...f.childNodes].filter(c => c.nodeType === 1 || c.textContent.trim()).length)));
  if (columns > 1) fail(`${label}: the notice note is split into ${columns} columns`);
  await noSidewaysScroll(page, label + ' notice');
}

// An app left open overnight (a phone asleep with it on screen) shows the new
// day when it is looked at again, but never redraws a lesson under the learner.
async function overnight(browser) {
  const label = 'overnight';
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, timezoneId: 'Europe/Berlin', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') fail(`${label}: console error: ${m.text()}`); });
  page.on('pageerror', e => fail(`${label}: uncaught error: ${e.message}`));
  await page.clock.install({ time: new Date('2026-10-26T22:30:00Z') }); // 23:30 in Berlin
  await page.goto(BASE);
  await page.waitForSelector('#view > *');
  // lesson 1 learned tonight, so its words are due tomorrow
  await page.evaluate(() => { const L = lessonById(1); L.words.forEach(w => markLearned(w, 1)); S.progress.lessonsDone.push(1); for (const sh of Object.values(S.cards)) for (const c of Object.values(sh.w)) c.r[0] = addDays(todayStr(), 1); S.settings.onboarded = true; document.querySelector('.sheet')?.remove(); go('today'); });
  const ring = () => page.locator('.today-hero .goal').getAttribute('aria-label');
  const sleep = async (hidden, time) => {
    await page.evaluate(h => { for (const k of ['hidden', 'visibilityState']) Object.defineProperty(document, k, { value: k === 'hidden' ? h : h ? 'hidden' : 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }, hidden);
    if (time) await page.clock.fastForward(time);
  };
  if (!/^[1-9]\d* of/.test(await ring())) fail(`${label}: tonight's ring shows no new words (${await ring()})`);
  await sleep(true, '08:30:00'); await sleep(false);
  if (!/^0 of/.test(await ring())) fail(`${label}: the next morning Today still shows last night's ring (${await ring()})`);
  if (!await page.locator('.tab .badge').count()) fail(`${label}: the next morning Practice shows no words due`);
  // a lesson open over midnight stays on its step
  await page.evaluate(() => startLesson(2, true));
  await page.locator('.actionbar .btn').last().click();
  await drawn(page);
  await page.evaluate(() => { document.querySelector('#view > .view:not(.leaving)').dataset.night = '1'; });
  await sleep(true, '24:00:00'); await sleep(false); await page.clock.runFor(16000);
  if (!await page.locator('#view > [data-night]').count()) fail(`${label}: the new day redrew the lesson under the learner`);
  await ctx.close();
}

// Driving a lesson as a learner: what the current step asks for and its model answer,
// a right answer the way the learner sees it, and a wrong one.
const btn = (page, name) => page.locator('.actionbar .btn', { hasText: name });
const reEsc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const lessonStep = page => page.evaluate(() => {
  const ls = S.progress.lessonState, L = lessonById(ls.n), out = { step: ls.step, crash: !!document.querySelector('.crash') };
  if (ls.step === 'check' && ls.checkQ?.length) Object.assign(out, { word: ls.checkQ[0], answer: document.querySelector('.choices.pics') ? ls.checkQ[0] : L.words.find(w => w.de === ls.checkQ[0]).en[0] }); // a picture choice is answered by its German word
  const t = ls.step === 'build' ? L.build[ls.bi] : ls.step === 'conv' && ls.conv && ls.conv.pos < ls.conv.queue.length ? L.conv[ls.conv.queue[ls.conv.pos].i] : null;
  if (t) Object.assign(out, { type: ls.step === 'build' ? t.type : ls.conv.queue[ls.conv.pos].type, de: fill(t.de), gaps: t.gaps, at: ls.step === 'build' ? ls.bi : ls.conv.pos });
  return out;
});
// A conversation turn puts the cursor in its first box 50 ms after it appears (learnerTurn in ui.js).
// Type only once it has (or once the turn has been tried, long after): a focus that lands while the second
// gap is being filled moves the text into the first one ("Mitohne" and an empty gap), and the right answer is marked wrong.
const cursorIn = (page, s) => s.step !== 'conv' || s.type === 'tiles' ? Promise.resolve(true)
  : page.waitForFunction(() => document.activeElement?.closest('.turnbox') || S.progress.lessonState.conv.attempts > 0, null, { timeout: 3000 }).then(() => true, () => false);
// tiles in order, each gap with the word in its place, or the whole line typed
async function answerRight(page, s) {
  const toks = s.de.split(/\s+/);
  if (!await cursorIn(page, s)) return 'the cursor never came to the line';
  if (s.type === 'tiles') {
    for (const t of toks) {
      const tile = page.locator('.tiles:not(.answer) > .tile').filter({ hasText: new RegExp(`^${reEsc(t)}$`) }).first();
      if (!await tile.count()) return `no tile "${t}"`;
      await tile.click();
    }
  } else if (s.type === 'gap') {
    const inputs = page.locator('.gapline input'), at = [...s.gaps].sort((a, b) => a - b);
    for (let k = 0; k < at.length; k++) await inputs.nth(k).fill(toks[at[k]].replace(/[.,!?;:"'„“”‚‘’()]/g, ''));
  } else await page.locator('.turnbox input, .turnbox textarea').first().fill(s.de);
  return '';
}
// one tile only (the line is incomplete), or a word that is in no lesson
async function answerWrong(page, s) {
  await cursorIn(page, s);
  if (s.type === 'tiles') { if (!await page.locator('.tiles.answer > .tile').count()) await page.locator('.tiles:not(.answer) > .tile').first().click(); }
  else if (s.type === 'gap') { const inputs = page.locator('.gapline input'); for (let k = 0; k < await inputs.count(); k++) await inputs.nth(k).fill('Quatsch'); }
  else await page.locator('.turnbox input, .turnbox textarea').first().fill('Quatsch Quatsch');
}
const hintText = page => page.evaluate(() => [...document.querySelectorAll('.actionbar .msg, .ladder')].map(e => e.textContent.trim()).filter(Boolean).join(' / '));
// a conversation turn is accepted when the next one comes up; a missed one stays put
const convMoved = (page, at) => page.waitForFunction(at => S.progress.lessonState.conv.pos > at && document.querySelector('.actionbar .btn'), at, { timeout: 3000 }).then(() => true, () => false);

// Done → Continue opens the course map scrolled to the learner's new stop, clear of the tab bar, so the line
// filling up to it is seen (the map is drawn straight from the tap, before its rows are sized: map.js, toStop)
// (`below` is the room kept for the tab bar; a desktop has none, so on screen is enough there)
const stopInView = (page, label, below = 128) => page.waitForFunction(below => {
  const mk = document.querySelector('#view > .view:not(.leaving) .kst.here .kmk'), r = mk?.getBoundingClientRect();
  return r && r.top >= 0 && r.bottom <= innerHeight - below;
}, below, { timeout: 2000 }).catch(async () => fail(`${label}: the map was left at scroll ${await page.evaluate(() => document.getElementById('app').scrollTop)}, with the new stop off the screen`));
// and that stop follows every lesson done: past the last written lesson it is the stop after it, not the
// optional Lesson 0 at the top (map.js, stopIndex)
const stopAfterDone = async (page, label) => {
  const rows = await page.evaluate(() => [...document.querySelectorAll('#view > .view:not(.leaving) .kst')].map(r => r.classList.contains('here') ? 'here' : r.classList.contains('lesson') && r.classList.contains('done') ? 'done' : ''));
  if (rows.lastIndexOf('done') > rows.indexOf('here')) fail(`${label}: the map's stop (row ${rows.indexOf('here')}) is above lessons already done`);
};

// Every built-in lesson, in course order, played to its Done screen by a learner who
// answers right the first time: the lesson's own lines must be accepted at every check,
// build and conversation turn. Catches a lesson that cannot be finished (a tile missing,
// a gap the model answer does not fill, a line diagnose() rejects) before it reaches main.
async function playEveryLesson(browser) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  let label = 'lessons';
  page.on('console', m => { if (m.type() === 'error') fail(`${label}: console error: ${m.text()}`); });
  page.on('pageerror', e => fail(`${label}: uncaught error: ${e.message}`));
  await page.goto(BASE);
  await page.waitForSelector('#view > *');
  // the default mix, as each lesson is written (all right answers would turn on "harder")
  const ns = await page.evaluate(() => { S.settings.onboarded = true; S.settings.difficulty = 'default'; document.querySelector('.sheet')?.remove(); return allLessons().map(l => l.n); });
  for (const n of ns) {
    label = `lesson ${n}`;
    await page.evaluate(n => startLesson(n, true), n);
    const learned = await page.evaluate(() => learnedCount());
    let s, guard = 0, stuck = '';
    while ((s = await lessonStep(page)).step !== 'done' && !s.crash && guard++ < 300) {
      if (s.step === 'check' && s.answer) {
        const choice = page.locator('.choices .choice').filter({ hasText: new RegExp(`\\d${reEsc(s.answer)}$`) });
        if (await choice.count() !== 1) { stuck = `check: "${s.answer}" is not one of the choices`; break; }
        await choice.click();
        if (!await page.locator('.actionbar.ok').count()) { stuck = `check: "${s.answer}" was marked wrong`; break; }
        await btn(page, 'Continue').click();
      } else if ((s.step === 'build' || s.step === 'conv') && s.type) {
        if ((stuck = await answerRight(page, s))) { stuck = `${s.step} ${s.at}: ${stuck}`; break; }
        await btn(page, 'Check').click();
        if (s.step === 'build') {
          if (!await page.locator('.actionbar.ok').count()) { stuck = `build ${s.at}: "${s.de}" was not accepted (${await hintText(page)})`; break; }
          await btn(page, 'Next').click();
        } else if (!await convMoved(page, s.at)) { stuck = `conversation turn ${s.at}: "${s.de}" was not accepted (${await hintText(page)})`; break; }
      } else await page.locator('.actionbar .btn').last().click(); // scene, notice, words, "Build it", "Finish the lesson"
      await noSidewaysScroll(page, `${label} ${s.step}`);
    }
    if (s.crash) stuck = `the ${s.step} step crashed`;
    if (stuck || s.step !== 'done') { fail(`${label}: could not be finished (${stuck || `stuck on "${s.step}"`})`); continue; }
    const after = await page.evaluate(n => ({ done: S.progress.lessonsDone.includes(n), learned: learnedCount() }), n);
    if (!after.done) fail(`${label}: finished but not counted as done`);
    if (after.learned <= learned) fail(`${label}: finished with no new words in the word bank`);
    await btn(page, 'Continue').click();
    await stopInView(page, label);
    await stopAfterDone(page, label);
  }
  console.log(`played lessons ${ns.join(', ')}`);
  await ctx.close();
}

// Lesson 1 played by a learner who gets things wrong and reloads the page halfway:
// a missed word comes back later in the check, a build line missed twice is shown and
// moves on, a conversation turn climbs the help ladder (meaning, hint, the line), comes
// back "once more" a few turns later, and counts as missed on the Done screen and in
// review. The reload lands on the same turn, with the help already earned still shown.
async function missAndRetry(browser) {
  let label = 'misses';
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, colorScheme: 'dark', reducedMotion: 'reduce', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.setDefaultTimeout(5000); // a button that never appears fails fast, after the message saying why
  page.on('console', m => { if (m.type() === 'error') fail(`${label}: console error: ${m.text()}`); });
  page.on('pageerror', e => fail(`${label}: uncaught error: ${e.message}`));
  await page.goto(BASE);
  await page.waitForSelector('#view > *');
  await page.evaluate(() => { S.settings.onboarded = true; S.settings.difficulty = 'default'; save('settings'); document.querySelector('.sheet')?.remove(); startLesson(1, true); });
  const ls = () => page.evaluate(() => S.progress.lessonState);
  const bad = async (what, msg) => { if (!await page.locator('.actionbar.bad').count()) fail(`${label}: ${what} was not marked wrong`); else if (msg && !(await hintText(page)).includes(msg)) fail(`${label}: ${what}: expected "${msg}", got "${await hintText(page)}"`); };
  let s, guard = 0;
  while ((s = await lessonStep(page)).step !== 'check' && guard++ < 20) await page.locator('.actionbar .btn').last().click();

  // the word check: miss the first word, it goes to the back of the queue and comes back
  label = 'misses: word check';
  const missedWord = s.word, left = (await ls()).checkQ.length;
  await page.locator('.choices .choice').filter({ hasNotText: new RegExp(`\\d${reEsc(s.answer)}$`) }).first().click();
  await bad(`choosing a wrong meaning for "${missedWord}"`, 'comes back in a moment');
  const q = (await ls()).checkQ;
  if (q.length !== left || (left > 1 && q[q.length - 1] !== missedWord)) fail(`${label}: "${missedWord}" did not go to the back of the queue (${q.join(', ')})`);
  if (await page.evaluate(w => isLearned(w), missedWord)) fail(`${label}: "${missedWord}" went into the word bank although it was missed`);
  await btn(page, 'Continue').click();
  let askedAgain = false;
  while ((s = await lessonStep(page)).step === 'check' && s.answer && guard++ < 60) {
    if (s.word === missedWord) askedAgain = true;
    await page.locator('.choices .choice').filter({ hasText: new RegExp(`\\d${reEsc(s.answer)}$`) }).click();
    await btn(page, 'Continue').click();
  }
  if (!askedAgain) fail(`${label}: the missed word "${missedWord}" never came back`);
  await btn(page, 'Build it').click();

  // build: wrong twice, then the line is shown and Next moves on
  label = 'misses: build';
  s = await lessonStep(page);
  await answerWrong(page, s); await btn(page, 'Check').click();
  await bad('a wrong first try');
  if (!await btn(page, 'Check again').count()) fail(`${label}: no "Check again" after the first miss`);
  else await btn(page, 'Check again').click();
  await bad('a wrong second try', 'The line is');
  await btn(page, 'Next').click();
  if ((await ls()).bi !== s.at + 1) fail(`${label}: Next after two misses did not move to the next line`);
  while ((s = await lessonStep(page)).step === 'build' && s.type && guard++ < 100) { await answerRight(page, s); await btn(page, 'Check').click(); await btn(page, 'Next').click(); }

  // the conversation: the first learner turn is missed twice, the page reloads, then the third miss
  label = 'misses: conversation';
  while ((s = await lessonStep(page)).step === 'conv' && !s.type && guard++ < 120) await page.waitForTimeout(100);
  const turn = s, len = (await ls()).conv.queue.length;
  await answerWrong(page, turn); await btn(page, 'Check').click();
  if (!(await hintText(page)).includes('Meaning')) fail(`${label}: the first miss does not show the meaning (${await hintText(page)})`);
  await answerWrong(page, turn); await btn(page, 'Check').click();
  const hint2 = await page.locator('.ladder .fb').count();
  if (hint2 < 2) fail(`${label}: the second miss adds no hint (${await hintText(page)})`);
  if ((await ls()).conv.pos !== turn.at) fail(`${label}: a missed turn moved on`);

  label = 'misses: reload';
  await page.reload();
  await page.waitForSelector('#view > *');
  const go = page.locator('button', { hasText: 'Continue lesson' });
  if (!await go.count()) { fail(`${label}: Today has no "Continue lesson" after a reload`); await ctx.close(); return; }
  await go.click();
  s = await lessonStep(page);
  if (s.step !== 'conv' || s.at !== turn.at) fail(`${label}: came back on ${s.step} ${s.at}, not conversation turn ${turn.at}`);
  if (!(await hintText(page)).includes('Meaning')) fail(`${label}: the meaning the learner already earned is gone after the reload`);
  if (await page.locator('.log .bub').count() < turn.at) fail(`${label}: the conversation so far is not shown after the reload`);

  label = 'misses: conversation';
  await answerWrong(page, turn); await btn(page, 'Check').click();
  await bad('a third miss', 'comes back in a few turns');
  if (!(await hintText(page)).includes('The line is')) fail(`${label}: the third miss does not show the line`);
  const C = (await ls()).conv;
  if (C.queue.length !== len + 1 || !C.queue.some((x, k) => k > turn.at && x.again && x.i === C.queue[turn.at].i)) fail(`${label}: the missed turn was not queued again`);
  await btn(page, 'Continue').click();
  let onceMore = false;
  while ((s = await lessonStep(page)).step === 'conv' && guard++ < 250) {
    if (!s.type) { if (await btn(page, 'Finish the lesson').count()) await btn(page, 'Finish the lesson').click(); else await page.waitForTimeout(100); continue; }
    if (s.at > turn.at && (await page.locator('.turnbox .prompt').textContent()).startsWith('Once more')) onceMore = true;
    await answerRight(page, s); await btn(page, 'Check').click();
    if (!await convMoved(page, s.at)) { fail(`${label}: turn ${s.at} "${s.de}" was not accepted (${await hintText(page)})`); break; }
  }
  if (!onceMore) fail(`${label}: the missed turn never came back "once more"`);

  label = 'misses: done';
  if (s.step !== 'done') fail(`${label}: lesson 1 did not finish (stuck on "${s.step}")`);
  else {
    const R = await page.evaluate(t => { const L = lessonById(1), ls = S.progress.lessonState, sent = S.cards.sent.w;
      const due = L.conv.map((c, i) => c.l && sent['s:' + fill(c.de)].r[0]).filter(Boolean);
      return { done: S.progress.lessonsDone.includes(1), missed: ls.summary.missed, first: ls.summary.first, total: ls.summary.total, dueToday: due.filter(d => d === todayStr()).length, missedDue: sent['s:' + fill(L.conv[ls.conv.queue[t].i].de)].r[0] === todayStr() };
    }, turn.at);
    if (!R.done) fail(`${label}: lesson 1 not counted as done`);
    if (R.missed !== 1) fail(`${label}: the Done screen counts ${R.missed} missed lines, expected 1`);
    if (R.first !== R.total - 1) fail(`${label}: ${R.first} of ${R.total} turns right first time, expected all but one`);
    if (!R.missedDue || R.dueToday !== 1) fail(`${label}: the missed line should be due for review today, and only it (${R.dueToday} due today)`);
  }
  await noSidewaysScroll(page, label);
  await ctx.close();
}

// A sheet opened over a lesson (Ctrl+K search, a word card) has the keyboard: Enter picks the
// search result without moving the lesson on, and Esc closes the word card.
async function sheetsOwnKeys(browser) {
  const label = 'sheet over a lesson';
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 820 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => fail(`${label}: uncaught error: ${e.message}`));
  await page.goto(BASE);
  await page.waitForSelector('#view > *');
  await page.evaluate(() => { S.settings.onboarded = true; save('settings'); document.querySelector('.sheet')?.remove(); startLesson(1, true); });
  await drawn(page);
  const step = () => page.evaluate(() => S.progress.lessonState.step);
  const before = await step();
  await page.keyboard.press('Control+k');
  await page.locator('#search-input').fill('kaffee');
  await page.keyboard.press('Enter');
  if (await step() !== before) fail(`${label}: Enter in the search moved the lesson from "${before}" to "${await step()}"`);
  if (!await page.locator('.sheet.word').count()) fail(`${label}: Enter in the search did not open the word card`);
  await page.keyboard.press('Enter');
  if (await step() !== before) fail(`${label}: Enter with the word card open moved the lesson to "${await step()}"`);
  await page.keyboard.press('Escape');
  if (await page.locator('.sheet').count()) fail(`${label}: Esc did not close the word card`);
  await page.keyboard.press('Enter');
  if (await step() === before) fail(`${label}: with the sheets closed, Enter no longer moves the lesson on`);
  await ctx.close();
}

// A step that passes straight on while it is drawn (past the last word to the check, past the last build
// item to the conversation) still lets the old screen's slabs finish leaving, and the next step comes in on time.
async function stepPassesOn(browser) {
  const label = 'step passes on';
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', e => fail(`${label}: uncaught error: ${e.message}`));
  await page.goto(BASE);
  await page.waitForSelector('#view > *');
  await page.evaluate(() => { S.settings.onboarded = true; document.querySelector('.sheet')?.remove(); startLesson(1, true); });
  for (const [step, key, next] of [['words', 'wi', 'check'], ['build', 'bi', 'conv']]) {
    await page.evaluate(() => setStep('scene', {}));
    await drawn(page); await page.waitForTimeout(500);
    const r = await page.evaluate(([step, key]) => new Promise(res => {
      const L = lessonById(1); setStep(step, { [key]: (step === 'words' ? L.words : L.build).length });
      // three frames on, the old screen is still sliding out and the next step is on screen
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => res({ step: S.progress.lessonState.step, leaving: [...document.querySelectorAll('#view > .leaving')].map(e => e.children.length), shown: document.querySelector('#view > .view:not(.leaving)')?.className || '' }))));
    }), [step, key]);
    if (r.step !== next) fail(`${label}: past the last ${step} item the lesson went to "${r.step}", not "${next}"`);
    if (!r.leaving.length || !r.leaving[0]) fail(`${label}: the old screen's slabs vanished instead of leaving (${step} to ${next})`);
    if (!r.shown) fail(`${label}: the ${next} step was not drawn three frames after the ${step} step ended`);
    else if (!r.shown.includes(' in-')) fail(`${label}: the ${next} step popped in instead of sliding in`);
  }
  await ctx.close();
}

// Pausing the exam with ✕ keeps the answer still in the box (typed or picked), so "Continue the exam" shows it again.
async function examPauseKeepsAnswer(browser) {
  const label = 'exam pause';
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', e => fail(`${label}: uncaught error: ${e.message}`));
  await page.goto(BASE);
  await page.waitForSelector('#view > *');
  await page.evaluate(() => { LESSONS.forEach(L => L.words.forEach(w => markLearned(w, L.n))); S.settings.onboarded = true; document.querySelector('.sheet')?.remove(); S.progress.exam = buildExam('A1'); });
  const cur = sel => page.locator(`#view > .view:not(.leaving) ${sel}`);
  const pauseAndContinue = async () => {
    await cur('button[aria-label="Pause the exam"]').click();
    await drawn(page);
    if (await page.evaluate(() => route) === 'exam') return fail(`${label}: ✕ did not leave the exam`);
    await page.evaluate(() => enterExam());
    await drawn(page);
  };
  for (const [kind, types] of [['typed', ['in']], ['picked', ['tf', 'mc']]]) {
    const at = await page.evaluate(types => { const X = S.progress.exam; X.idx = X.items.findIndex(i => types.includes(i.type)); if (X.idx >= 0) enterExam(); return X.idx; }, types);
    if (at < 0) { fail(`${label}: the A1 exam has no ${kind} item`); continue; }
    await drawn(page); await page.waitForTimeout(400);
    if (kind === 'typed') {
      await cur('#exam-input').fill('half an answer');
      await pauseAndContinue();
      const v = await cur('#exam-input').inputValue();
      if (v !== 'half an answer') fail(`${label}: after pausing, the typed answer came back as "${v}"`);
    } else {
      await cur('.exam-item .choice').nth(1).click();
      await pauseAndContinue();
      if (!await cur('.exam-item .choice').nth(1).evaluate(b => b.classList.contains('picked'))) fail(`${label}: after pausing, the picked answer was not picked any more`);
    }
    if (await page.evaluate(() => S.progress.exam.idx) !== at) fail(`${label}: pausing moved the exam on from item ${at + 1}`);
  }
  await ctx.close();
}

// The review summary counts a card as recalled only when its answer was right: a miss graded Good afterwards
// still reschedules as Good (grading yourself is allowed), but the summary does not say "Alles sitzt."
async function reviewSummaryCountsMisses(browser) {
  const label = 'review summary';
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', e => fail(`${label}: uncaught error: ${e.message}`));
  await page.goto(BASE);
  await page.waitForSelector('#view > *');
  await page.evaluate(() => {
    LESSONS[0].words.forEach(w => markLearned(w, 1)); S.settings.onboarded = true; document.querySelector('.sheet')?.remove();
    const ids = LESSONS[0].words.map(w => w.de).filter(id => wordDef(id)).slice(0, 3);
    startReview(ids.map(id => ({ id, sh: cardShard(id), c: cardOf(id), kind: 'r', extra: true })), 'Smoke');
  });
  for (let i = 0; i < 3; i++) {
    await page.waitForFunction(i => PR && PR.done === i, i);
    await drawn(page);
    const input = page.locator('#view > .view:not(.leaving) .rv-card input');
    // the first card right, the other two wrong; every card then graded Good
    await input.fill(i === 0 ? await page.evaluate(() => wordDef(PR.queue[0].id).en[0]) : 'xylophone');
    await page.keyboard.press('Enter');
    await page.locator('.actionbar .btn', { hasText: 'Good' }).click();
  }
  await drawn(page);
  const sum = await page.evaluate(() => ({ title: document.querySelector('#view > .view:not(.leaving) .summary h1')?.textContent, ...REVIEW_SUMMARY }));
  if (sum.n !== 3 || sum.good !== 1) fail(`${label}: 1 of 3 cards answered right, but the summary counts ${sum.good} of ${sum.n} recalled`);
  if (sum.title === 'Alles sitzt.') fail(`${label}: two misses graded Good still read "Alles sitzt."`);
  await ctx.close();
}

// Grammar has no tab on a phone: opened from Practice, Profile or a lesson's Notice, that tab stays lit and
// Grammar's back button leads back there (into the lesson, at the same step).
async function grammarKeepsItsTab(browser) {
  const label = 'grammar back';
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', e => fail(`${label}: uncaught error: ${e.message}`));
  await page.goto(BASE);
  await page.waitForSelector('#view > *');
  await page.evaluate(() => { LESSONS[0].words.forEach(w => markLearned(w, 1)); S.progress.lessonsDone = [1]; S.settings.onboarded = true; document.querySelector('.sheet')?.remove(); });
  const cur = (sel, opts) => page.locator(`#view > .view:not(.leaving) ${sel}`, opts);
  const lit = () => page.evaluate(() => document.querySelector('#tabs .tab[aria-current="page"] span')?.textContent || 'none');
  const back = cur('.btn.ghost.sm', { hasText: '‹' }).first();
  // off-screen slabs skip layout until they come near (content-visibility), so scroll to the link and let it settle first
  const tap = async el => { await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(300); await el.click(); };
  for (const [from, tab, open] of [['practice', 'Practice', () => tap(cur('.mode', { hasText: 'Grammar' }))], ['profile', 'Profile', () => tap(cur('.listrow', { hasText: 'Grammar reference' }))]]) {
    await page.evaluate(r => go(r), from); await drawn(page); await page.waitForTimeout(300);
    await open(); await drawn(page); await page.waitForTimeout(300);
    if (await page.evaluate(() => route) !== 'grammar') { fail(`${label}: Grammar did not open from ${tab}`); continue; }
    if (await lit() !== tab) fail(`${label}: Grammar opened from ${tab} lights the ${await lit()} tab`);
    const say = (await back.textContent()).trim();
    if (say !== '‹ ' + tab) fail(`${label}: Grammar opened from ${tab} has the back button "${say}"`);
    await back.click(); await drawn(page); await page.waitForTimeout(300);
    if (await page.evaluate(() => route) !== from) fail(`${label}: Grammar's back button went to ${await page.evaluate(() => route)}, not ${from}`);
  }
  // from a lesson's Notice step: "Open in Grammar", then back into the lesson where it was
  const L = await page.evaluate(() => { const L = LESSONS.find(L => L.notice && L.notice.grammar && GRAMMAR.some(g => g.id === L.notice.grammar)); startLesson(L.n, true); S.progress.lessonState.step = 'notice'; render(); return L.n; });
  await drawn(page); await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelectorAll('#view > .view:not(.leaving) [hidden]').forEach(e => e.hidden = false));
  await cur('.btn', { hasText: 'Open in Grammar' }).click(); await page.waitForTimeout(300);
  if (await lit() !== 'Lessons') fail(`${label}: Grammar opened from lesson ${L} lights the ${await lit()} tab`);
  await cur('.btn', { hasText: '‹ Grammar' }).click(); await drawn(page); await page.waitForTimeout(300);
  const say = (await back.textContent()).trim();
  if (say !== '‹ Back to the lesson') fail(`${label}: Grammar opened from lesson ${L} has the back button "${say}"`);
  await back.click(); await drawn(page); await page.waitForTimeout(300);
  const at = await page.evaluate(() => ({ route, n: S.progress.lessonState?.n, step: S.progress.lessonState?.step, inLesson: document.body.classList.contains('in-lesson') }));
  if (at.route !== 'learn' || at.n !== L || at.step !== 'notice' || !at.inLesson) fail(`${label}: back from Grammar did not return to lesson ${L}'s Notice step (${JSON.stringify(at)})`);
  await ctx.close();
}

// a Grammar unit is a screen of its own: it opens at its top, title and back button in view, however far the list
// (or the lesson's Notice) was scrolled
async function grammarUnitOpensAtTop(browser) {
  const label = 'grammar unit';
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', e => fail(`${label}: uncaught error: ${e.message}`));
  await page.goto(BASE);
  await page.waitForSelector('#view > *');
  await page.evaluate(() => { LESSONS[0].words.forEach(w => markLearned(w, 1)); S.progress.lessonsDone = [1]; S.settings.onboarded = true; document.querySelector('.sheet')?.remove(); });
  const cur = (sel, opts) => page.locator(`#view > .view:not(.leaving) ${sel}`, opts);
  const atTop = async (title, how) => {
    await drawn(page); await page.waitForTimeout(400);
    const at = await page.evaluate(() => { const h1 = document.querySelector('#view > .view:not(.leaving) h1'); return { title: h1?.textContent, y: h1 ? Math.round(h1.getBoundingClientRect().top) : null, scroll: Math.round(PANE.scrollTop) }; });
    if (at.title !== title) fail(`${label}: ${how} showed "${at.title}", not the unit "${title}"`);
    else if (at.scroll > 0 || at.y < 0) fail(`${label}: ${how} opened the unit mid-page (scrolled ${at.scroll} px, its title at y ${at.y})`);
  };
  await page.evaluate(() => go('grammar')); await drawn(page); await page.waitForTimeout(300);
  const rows = cur('.listrow:not(.soon)');
  const row = rows.nth(await rows.count() - 1), title = (await row.locator('b').first().textContent()).trim();
  await row.scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
  if (await page.evaluate(() => PANE.scrollTop) < 200) fail(`${label}: the Grammar list did not scroll, so this check proves nothing`);
  await row.click();
  await atTop(title, 'the last unit in the scrolled list');
  // back to the list, then the same from a lesson's Notice step scrolled down
  await cur('.btn', { hasText: '‹ Grammar' }).click(); await drawn(page); await page.waitForTimeout(300);
  if (await page.evaluate(() => !!document.querySelector('#view > .view:not(.leaving) .listrow')) !== true) fail(`${label}: "‹ Grammar" did not lead back to the list`);
  const unit = await page.evaluate(() => { const L = LESSONS.find(L => L.notice && L.notice.grammar && GRAMMAR.some(g => g.id === L.notice.grammar)); startLesson(L.n, true); S.progress.lessonState.step = 'notice'; render(); return GRAMMAR.find(g => g.id === L.notice.grammar).title; });
  await drawn(page); await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelectorAll('#view > .view:not(.leaving) [hidden]').forEach(e => e.hidden = false));
  const btn = cur('.btn', { hasText: 'Open in Grammar' });
  await btn.scrollIntoViewIfNeeded(); await btn.click();
  await atTop(unit, '"Open in Grammar" from a lesson');
  await ctx.close();
}

// "Not a beginner?" on the first run: the placement test asks one item per lesson, stops after two misses on one
// lesson, and "Start at Lesson N" marks the lessons before it done and opens the map on Lesson N. Lesson 1's
// preview offers the test until then, and not after.
async function placementFirstRun(browser) {
  for (const [width, height] of [[390, 800], [1280, 800]]) {
    const label = `placement ${width}px`;
    const ctx = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type() === 'error') fail(`${label}: console error: ${m.text()}`); });
    page.on('pageerror', e => fail(`${label}: uncaught error: ${e.message}`));
    await page.goto(BASE);
    await page.waitForSelector('.sheet .btn');
    await page.locator('.sheet .btn', { hasText: 'Not a beginner?' }).click();
    await page.locator('.sheet .btn', { hasText: /^Start$/ }).click();
    await drawn(page);
    const box = page.locator('#view > .view:not(.leaving) #place-input');   // the item before is still sliding out
    const item = () => page.evaluate(() => PLACE && PLACE.item && { lesson: PLACE.item.lesson, a: PLACE.item.type === 'gap' ? PLACE.item.a[0] : PLACE.item.de });
    for (let i = 0, it; i < 12 && (it = await item()); i++) {
      await drawn(page);
      if (await box.count() !== 1) { fail(`${label}: lesson ${it.lesson}'s item has no answer box`); break; }
      await box.fill(it.lesson < 6 ? it.a : 'xyz');
      await page.locator('.actionbar .btn', { hasText: 'Check' }).click();
      if (it.lesson >= 6 && i === 5 && !await page.locator('.exam-item .fb.note', { hasText: 'It’s' }).count()) fail(`${label}: a miss did not show the right answer`);
      await page.waitForFunction(i => !PLACE || PLACE.done || PLACE.log.length > i && document.querySelector('#view > .view:not(.leaving) #place-input:not([disabled])'), i, { timeout: 3000 }).catch(() => fail(`${label}: the test did not move on after item ${i + 1}`));
    }
    await drawn(page);
    const btn = page.locator('.actionbar .btn', { hasText: 'Start at Lesson 6' });
    if (!await btn.count()) { fail(`${label}: the result does not offer "Start at Lesson 6" (${await page.locator('.actionbar').textContent().catch(() => 'no action bar')})`); await ctx.close(); continue; }
    if (await page.locator('.mistake').count() !== 2) fail(`${label}: the result lists ${await page.locator('.mistake').count()} misses, not 2`);
    await noSidewaysScroll(page, label + ' result');
    await btn.click(); await drawn(page);
    const st = await page.evaluate(() => ({ route, done: [...S.progress.lessonsDone].sort((a, b) => a - b).join(','), here: document.querySelector('#view > .view:not(.leaving) .kst.here')?.textContent || '', due: dueCards().length }));
    if (st.route !== 'learn' || st.done !== '1,2,3,4,5') fail(`${label}: after placing, route "${st.route}" and lessons done ${st.done}`);
    if (!/Lesson 6\b/.test(st.here)) fail(`${label}: the map's stop is "${st.here.slice(0, 60)}", not Lesson 6`);
    if (st.due) fail(`${label}: placing made ${st.due} reviews due today; they should start tomorrow`);
    // the map scrolls to the stop a frame or more after it is drawn (map.js, toStop): wait for it, at both widths
    await stopInView(page, label, width === 390 ? 128 : 0);
    await noSidewaysScroll(page, label + ' map');
    if (width === 390) {
      // the offer on lesson 1's preview is gone once placed, and there for a new learner
      await page.evaluate(() => openLessonPreview(1));
      if (await page.locator('.sheet .btn', { hasText: 'Find your lesson' }).count()) fail(`${label}: lesson 1 still offers the placement test after placing`);
      await page.evaluate(() => { S.progress = DEF_PROGRESS(); S.cards = {}; PLACE = null; render(); });
      await drawn(page);
      await page.evaluate(() => openLessonPreview(1));
      if (!await page.locator('.sheet .btn', { hasText: 'Find your lesson' }).count()) fail(`${label}: lesson 1's preview does not offer the placement test to a new learner`);
    }
    await ctx.close();
  }
}

try {
  await waitForServer();
  const browser = await chromium.launch();
  for (const [width, height] of [[390, 800], [1440, 900]]) {
    for (const scheme of ['light', 'dark']) {
      const label = `${width}px ${scheme}`;
      const { page, ctx } = await open(browser, label, { width, height }, scheme);
      await noSidewaysScroll(page, label);

      if (width === 390 && scheme === 'light') {
        await page.evaluate(() => startLesson(1, true));
        const step = () => page.evaluate(() => S.progress.lessonState.step);
        for (let i = 0; i < 20 && await step() !== 'check'; i++) {
          if (await step() === 'notice') await notesReadAsText(page, label);
          await page.locator('.actionbar .btn').last().click();
          await page.waitForTimeout(150);
        }
        if (await step() !== 'check') fail(`${label}: lesson 1 did not reach the word check (stuck on "${await step()}")`);
        else {
          await page.locator('.choices .choice').first().click();
          await page.waitForSelector('.actionbar .btn');
          await noSidewaysScroll(page, label + ' lesson');
        }
      }
      await ctx.close();
    }
  }
  await overnight(browser);
  await playEveryLesson(browser);
  await missAndRetry(browser);
  await sheetsOwnKeys(browser);
  await stepPassesOn(browser);
  await examPauseKeepsAnswer(browser);
  await reviewSummaryCountsMisses(browser);
  await grammarKeepsItsTab(browser);
  await grammarUnitOpensAtTop(browser);
  await placementFirstRun(browser);
  await browser.close();
} catch (e) {
  fail(String(e.stack || e));
} finally {
  server.kill();
}

if (failures.length) process.exit(1);
console.log('smoke test passed');
