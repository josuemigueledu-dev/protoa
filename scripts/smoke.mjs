// Browser smoke test: the app loads at phone and desktop width, in light and
// dark, with no console errors and no sideways scrolling, and lesson 1 can be
// clicked from its scene to its first word check.
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
  await browser.close();
} catch (e) {
  fail(String(e.stack || e));
} finally {
  server.kill();
}

if (failures.length) process.exit(1);
console.log('smoke test passed');
