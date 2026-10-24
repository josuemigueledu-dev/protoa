// Screenshots every mockup frame in both themes to mockups/shots/. Run: node mockups/shoot.js
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const PAGES = { style: [1], scene: [1], words: [1, 2], notice: [1], sound: [1], conv: [1, 2], done: [1], today: [1], practice: [1] };
(async () => {
  const opts = process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {};
  const browser = await chromium.launch(opts);
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const problems = [];
  page.on('pageerror', e => problems.push('error: ' + e.message));
  for (const [id, frames] of Object.entries(PAGES)) for (const f of frames) for (const theme of ['light', 'dark']) {
    const url = 'file://' + path.join(__dirname, `${id}.html?theme=${theme}&frame=${f}`);
    await page.goto(url); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(400);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    if (sw > 390) problems.push(`${id} ${theme} ${f}: scrolls sideways (${sw}px)`);
    const name = `${id}${frames.length > 1 ? '-' + f : ''}-${theme}.png`;
    if (id === 'style' || id === 'done') { // long pages: grow the viewport so fixed bars land at the real bottom
      const h = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight + (document.querySelector('.actionbar')?.offsetHeight || 0)));
      await page.setViewportSize({ width: 390, height: h }); await page.waitForTimeout(200);
    }
    await page.screenshot({ path: path.join(__dirname, 'shots', name) });
    await page.setViewportSize({ width: 390, height: 844 });
  }
  await browser.close();
  console.log(problems.length ? problems.join('\n') : 'all frames clean');
})();
