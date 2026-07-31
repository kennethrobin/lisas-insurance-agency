/**
 * Design-review helper (not a gate — see mobile-audit.mjs for the gates).
 *
 * A full-page phone screenshot is ~30 screens tall, which is useless to look
 * at. This slices a route into viewport-sized frames, or grabs one element, so
 * the mobile layout can actually be critiqued by eye.
 *
 * Usage (from web/):
 *   node scripts/shots.mjs --route=/ --width=390 --out=review
 *   node scripts/shots.mjs --route=/ --width=390 --sel=".hero" --out=hero
 *   node scripts/shots.mjs --route=/ --width=390 --menu --out=menu
 */

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BASE_URL = process.env.AUDIT_BASE_URL ?? 'http://localhost:4321';

const opts = {};
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  if (m) opts[m[1]] = m[2] ?? true;
}

const route = opts.route ?? '/';
const width = Number(opts.width ?? 390);
const height = Number(opts.height ?? (width <= 480 ? 844 : 900));
const outDir = path.join(ROOT, '.mobile-audit', String(opts.out ?? 'review'));
const motion = opts.motion ? 'no-preference' : 'reduce';

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  reducedMotion: motion,
  deviceScaleFactor: 1,
});
const page = await context.newPage();
await page.setViewportSize({ width, height });
await page.goto(`${BASE_URL}${route}`, { waitUntil: 'load' });
await page.evaluate(() => document.fonts?.ready);
await page.waitForTimeout(400);

const tag = (route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '-')) + `-${width}`;

/* --scroll=N scrolls before capturing. Needed to reproduce the state where the
   header has picked up `.is-solid` (and with it a backdrop-filter), which is a
   different containing block for anything positioned `fixed` inside it. */
if (opts.scroll) {
  await page.evaluate((y) => window.scrollTo(0, y), Number(opts.scroll));
  await page.waitForTimeout(300);
}

if (opts.menu) {
  await page.click('[data-nav-toggle]');
  await page.waitForTimeout(400);
  const suffix = opts.scroll ? `-menu-scrolled` : '-menu';
  await page.screenshot({ path: path.join(outDir, `${tag}${suffix}.png`) });
  console.log(`menu -> ${tag}${suffix}.png`);
} else if (opts.sel) {
  const el = page.locator(String(opts.sel)).first();
  await el.screenshot({ path: path.join(outDir, `${tag}-el.png`) });
  console.log(`element -> ${tag}-el.png`);
} else {
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const frames = Math.ceil(total / height);
  for (let i = 0; i < frames; i++) {
    const y = i * height;
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(180);
    await page.screenshot({
      path: path.join(outDir, `${tag}-${String(i).padStart(2, '0')}.png`),
      clip: { x: 0, y, width, height: Math.min(height, total - y) },
      fullPage: true,
    });
  }
  console.log(`${frames} slices (page ${total}px tall) -> ${outDir}`);
}

await browser.close();
