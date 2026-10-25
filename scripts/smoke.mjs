// Browser smoke test: the app loads at phone and desktop width, in light and
// dark, with no console errors and no sideways scrolling, and lesson 1 can be
// clicked from its scene to its first word check. Left open overnight, it shows
// the new day without disturbing a lesson in progress. Every built-in lesson can be
// played to its end with its own model answers.
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

async function noSidewaysScroll(page, label) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth }));
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
  await page.evaluate(() => { document.querySelector('#view > *').dataset.night = '1'; });
  await sleep(true, '24:00:00'); await sleep(false); await page.clock.runFor(16000);
  if (!await page.locator('#view > [data-night]').count()) fail(`${label}: the new day redrew the lesson under the learner`);
  await ctx.close();
}

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
  const btn = name => page.locator('.actionbar .btn', { hasText: name });
  const reEsc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // what the current step asks for, and its model answer
  const state = () => page.evaluate(() => {
    const ls = S.progress.lessonState, L = lessonById(ls.n), out = { step: ls.step, crash: !!document.querySelector('.crash') };
    if (ls.step === 'check' && ls.checkQ?.length) out.answer = L.words.find(w => w.de === ls.checkQ[0]).en[0];
    const t = ls.step === 'build' ? L.build[ls.bi] : ls.step === 'conv' && ls.conv && ls.conv.pos < ls.conv.queue.length ? L.conv[ls.conv.queue[ls.conv.pos].i] : null;
    if (t) Object.assign(out, { type: ls.step === 'build' ? t.type : ls.conv.queue[ls.conv.pos].type, de: fill(t.de), gaps: t.gaps, at: ls.step === 'build' ? ls.bi : ls.conv.pos });
    return out;
  });
  // answer the way a learner sees it: tiles in order, each gap with the word in its place, or the whole line typed
  async function answer(s) {
    const toks = s.de.split(/\s+/);
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
  const hint = () => page.evaluate(() => [...document.querySelectorAll('.actionbar .msg, .ladder')].map(e => e.textContent.trim()).filter(Boolean).join(' / '));

  for (const n of ns) {
    label = `lesson ${n}`;
    await page.evaluate(n => startLesson(n, true), n);
    const learned = await page.evaluate(() => learnedCount());
    let s, guard = 0, stuck = '';
    while ((s = await state()).step !== 'done' && !s.crash && guard++ < 300) {
      if (s.step === 'check' && s.answer) {
        const choice = page.locator('.choices .choice').filter({ hasText: new RegExp(`\\d${reEsc(s.answer)}$`) });
        if (await choice.count() !== 1) { stuck = `check: "${s.answer}" is not one of the choices`; break; }
        await choice.click();
        if (!await page.locator('.actionbar.ok').count()) { stuck = `check: "${s.answer}" was marked wrong`; break; }
        await btn('Continue').click();
      } else if ((s.step === 'build' || s.step === 'conv') && s.type) {
        if ((stuck = await answer(s))) { stuck = `${s.step} ${s.at}: ${stuck}`; break; }
        await btn('Check').click();
        if (s.step === 'build') {
          if (!await page.locator('.actionbar.ok').count()) { stuck = `build ${s.at}: "${s.de}" was not accepted (${await hint()})`; break; }
          await btn('Next').click();
        } else {
          // a right line is logged and the next turn comes up; a missed one stays on this turn
          const ok = await page.waitForFunction(at => S.progress.lessonState.conv.pos > at && document.querySelector('.actionbar .btn'), s.at, { timeout: 3000 }).then(() => true, () => false);
          if (!ok) { stuck = `conversation turn ${s.at}: "${s.de}" was not accepted (${await hint()})`; break; }
        }
      } else await page.locator('.actionbar .btn').last().click(); // scene, notice, words, "Build it", "Finish the lesson"
      await noSidewaysScroll(page, `${label} ${s.step}`);
    }
    if (s.crash) stuck = `the ${s.step} step crashed`;
    if (stuck || s.step !== 'done') { fail(`${label}: could not be finished (${stuck || `stuck on "${s.step}"`})`); continue; }
    const after = await page.evaluate(n => ({ done: S.progress.lessonsDone.includes(n), learned: learnedCount() }), n);
    if (!after.done) fail(`${label}: finished but not counted as done`);
    if (after.learned <= learned) fail(`${label}: finished with no new words in the word bank`);
    await btn('Weiter').click();
  }
  console.log(`played lessons ${ns.join(', ')}`);
  await ctx.close();
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
  await browser.close();
} catch (e) {
  fail(String(e.stack || e));
} finally {
  server.kill();
}

if (failures.length) process.exit(1);
console.log('smoke test passed');
