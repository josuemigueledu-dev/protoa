// Renders the app icons for the installable German course (apps/deutsch/icons/) from the
// brand's main app icon, shared/brand/app-icon-ink.svg, which is read only.
// The mark sits inside the maskable safe zone (the middle 80 %), so one PNG serves "any" and "maskable".
// Run: npm run icons (needs playwright), then commit the PNGs.
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ICONS = { 'icon-192.png': 192, 'icon-512.png': 512, 'apple-touch-icon.png': 180 };

const svg = readFileSync(path.join(ROOT, 'shared/brand/app-icon-ink.svg'), 'utf8');
const out = path.join(ROOT, 'apps/deutsch/icons');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const [file, size] of Object.entries(ICONS)) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: path.join(out, file), omitBackground: false });
  await page.close();
  console.log(`apps/deutsch/icons/${file} ${size}x${size}`);
}
await browser.close();
