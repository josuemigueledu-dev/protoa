// iPhone scroll test: the app inside an iframe (as in the owner's claude.ai copy) at iPhone 13
// size in WebKit, Safari's engine. It opens lesson 2's scene step, scrolls it down and back up
// with the wheel, and records every frame: the lesson header (title, progress, orb) must stay
// pinned to the top, the action bar to the bottom, the docked orb in its header slot, and no
// frame may take longer than FRAME_MS. Prints the numbers so a fix can be compared before and after.
// Run: npm run smoke:ios (needs playwright with WebKit: `npm i --no-save playwright && npx playwright install --with-deps webkit`)
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { webkit, devices } = require('playwright');

const FRAME_MS = 50;   // a frame slower than this is a visible stutter
const DRIFT_PX = 2;    // the header and the action bar may not move more than this
const ORB_PX = 6;      // the docked orb's centre may not leave its slot's centre by more than this
// IOS_FRAMES=report: slow frames are printed as a warning instead of failing (CI, until the
// app scrolls inside the frame budget); the header, action bar and orb checks always fail
const REPORT_FRAMES = process.env.IOS_FRAMES === 'report';

const PORT = 8890 + Math.floor(Math.random() * 100);
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

// the host page: one iframe filling the screen, like an artifact in the claude.ai app
const HOST = `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;height:100%;overflow:hidden;background:#000}iframe{display:block;border:0;width:100%;height:100%}</style>
<iframe src="${BASE}" allow="autoplay"></iframe>`;

// Inside the app: sample the layout once per frame until stop() is called.
function record() {
  const top = () => document.querySelector('#view .lesson-top'), bar = () => document.querySelector('.actionbar');
  const orb = () => document.querySelector('.orb.companion'), slot = () => document.querySelector('#view .lesson-top .tslot');
  const R = window.__scroll = { frames: [], top: [], bar: [], orb: [], scrollMax: 0, run: true };
  let last = performance.now();
  const tick = now => {
    if (!R.run) return;
    R.frames.push(now - last); last = now;
    const t = top(), b = bar(), o = orb(), s = slot();
    if (t) R.top.push(t.getBoundingClientRect().top);
    if (b) R.bar.push(innerHeight - b.getBoundingClientRect().bottom);
    if (o && s && s.getBoundingClientRect().width) {
      const a = o.getBoundingClientRect(), c = s.getBoundingClientRect();
      R.orb.push(Math.hypot(a.left + a.width / 2 - c.left - c.width / 2, a.top + a.height / 2 - c.top - c.height / 2));
    }
    R.scrollMax = Math.max(R.scrollMax, scrollY, document.scrollingElement.scrollTop, ...[...document.querySelectorAll('#app, main, #view, .wrap')].map(e => e.scrollTop));
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const pct = (xs, p) => xs.length ? [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(xs.length * p))] : 0;
const extent = xs => xs.length ? Math.max(...xs.map(Math.abs)) : 0;
const ms = x => x.toFixed(0) + ' ms';

// Playwright's mobile WebKit has no wheel and no touch drag, so the page is scrolled with the
// wheel at the iPhone's screen size, scale, touch and user agent, with only isMobile off
async function phone(browser, label, scheme, host) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], isMobile: false, colorScheme: scheme, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') fail(`${label}: console error: ${m.text()}`); });
  page.on('pageerror', e => fail(`${label}: uncaught error: ${e.message}`));
  await page.setContent(host);
  return { ctx, page, frame: await (await page.waitForSelector('iframe')).contentFrame() };
}

// scroll down and back up with the wheel over the iframe, recording each frame inside it
async function scroll(page, frame) {
  await frame.evaluate(record);
  const box = await (await page.$('iframe')).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (const dir of [1, -1]) {
    for (let i = 0; i < 24; i++) { await page.mouse.wheel(0, dir * 60); await page.waitForTimeout(16); }
    await page.waitForTimeout(400);
  }
  const R = await frame.evaluate(() => { window.__scroll.run = false; return window.__scroll; });
  R.frames = R.frames.slice(2); // the first frames time the recorder's own start
  return R;
}

// The same scroll over a plain tall page: how fast this machine's WebKit draws when the page costs
// nothing, so the app's frame times can be read against it (CI runners draw without a GPU).
async function baseline(browser) {
  const plain = '<!doctype html><meta name=viewport content=width=device-width><body style=margin:0><div style=height:3000px;background:linear-gradient(#123,#c84)></div>';
  const { ctx, page, frame } = await phone(browser, 'plain page', 'dark', HOST.replace(`src="${BASE}"`, `srcdoc="${plain}"`));
  const R = await scroll(page, frame);
  await ctx.close();
  console.log(`plain page on this machine: median frame ${ms(pct(R.frames, .5))}, p95 ${ms(pct(R.frames, .95))}`);
}

async function scrollLesson(browser, scheme) {
  const label = `iPhone iframe ${scheme}`;
  const { ctx, page, frame } = await phone(browser, label, scheme, HOST);
  await frame.waitForSelector('#view > *');
  await frame.evaluate(() => { S.settings.onboarded = true; save('settings'); document.querySelector('.sheet')?.remove(); startLesson(2, true); });
  await frame.waitForSelector('#view .lesson-top');
  await page.waitForTimeout(1200); // the step's entrance and the orb's flight into its slot settle

  const step = await frame.evaluate(() => S.progress.lessonState.step);
  if (step !== 'scene') fail(`${label}: lesson 2 opened on "${step}", not its scene`);
  const R = await scroll(page, frame);
  await ctx.close();

  const frames = R.frames, slow = frames.filter(f => f > FRAME_MS), max = Math.max(...frames);
  const header = extent(R.top), bar = extent(R.bar), orb = extent(R.orb);
  console.log(`${label}: ${frames.length} frames, median ${ms(pct(frames, .5))}, p95 ${ms(pct(frames, .95))}, slowest ${ms(max)}, ${slow.length} over ${FRAME_MS} ms; scrolled ${Math.round(R.scrollMax)}px; header moved ${header.toFixed(1)}px, action bar ${bar.toFixed(1)}px, orb off its slot ${orb.toFixed(1)}px`);

  if (R.scrollMax < 100) fail(`${label}: the wheel did not scroll the lesson (${Math.round(R.scrollMax)}px)`);
  if (header > DRIFT_PX) fail(`${label}: the lesson header moved ${header.toFixed(1)}px off the top while scrolling`);
  if (bar > DRIFT_PX) fail(`${label}: the action bar moved ${bar.toFixed(1)}px off the bottom while scrolling`);
  if (R.orb.length && orb > ORB_PX) fail(`${label}: the docked orb left its header slot by ${orb.toFixed(1)}px while scrolling`);
  if (slow.length) {
    const msg = `${label}: ${slow.length} of ${frames.length} frames took over ${FRAME_MS} ms while scrolling (slowest ${ms(max)})`;
    if (REPORT_FRAMES) console.warn('WARN ' + msg); else fail(msg);
  }
}

try {
  await waitForServer();
  const browser = await webkit.launch();
  await baseline(browser);
  for (const scheme of ['dark', 'light']) await scrollLesson(browser, scheme);
  await browser.close();
} catch (e) {
  fail(String(e.stack || e));
} finally {
  server.kill();
}

if (failures.length) process.exit(1);
console.log('iPhone scroll test passed');
