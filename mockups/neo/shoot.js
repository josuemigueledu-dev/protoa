// Shoots every Lumen frame, light and dark, to mockups/neo/shots/. Run: node mockups/neo/shoot.js
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
(async () => {
  fs.mkdirSync(path.join(__dirname, 'shots'), { recursive: true });
  const opts = process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {};
  const b = await chromium.launch(opts), p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const bad = [];
  p.on('pageerror', e => bad.push(e.message)); p.on('console', m => m.type() === 'error' && !/fonts|ERR_|Failed to load/.test(m.text()) && bad.push(m.text()));
  for (const t of ['dark', 'light']) for (let f = 1; f <= 6; f++) {
    await p.goto(`file://${__dirname}/lumen.html?theme=${t}&frame=${f}`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(__dirname, 'shots', `lumen-${f}-${t}.png`) });
  }
  await b.close(); console.log(bad.length ? bad.join('\n') : 'clean');
})();
