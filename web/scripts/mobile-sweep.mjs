/**
 * Responsive geometry regression. Build first; run against a local server.
 * Tests intermediate sizes, not just a list of popular device presets.
 * npm run audit:mobile:sweep
 * Optional: --routes=/,/contact
 */
import fs from 'node:fs';
import { chromium, webkit } from 'playwright';
import { builtRoutes, probeOverflow } from './mobile-audit.mjs';

const base = process.env.AUDIT_BASE_URL ?? 'http://localhost:4321';
const selection = process.argv.find((arg) => arg.startsWith('--routes='));
const routes = selection ? selection.slice('--routes='.length).split(',') : builtRoutes();
const widths = [...new Set([
  ...Array.from({ length: 23 }, (_, i) => 320 + i * 32),
  359, 360, 374, 375, 389, 390, 411, 412, 429, 430, 479, 480,
  519, 520, 521, 559, 560, 561, 599, 600, 639, 640, 641,
  719, 720, 721, 767, 768, 769, 819, 820, 821, 899, 900, 901, 1023,
])].sort((a, b) => a - b);
const viewports = [
  ...widths.map((width) => ({ width, height: width < 768 ? 844 : 1024, zoom: 1 })),
  ...[{ width: 568, height: 320 }, { width: 667, height: 375 }, { width: 844, height: 390 }, { width: 1024, height: 600 }]
    .map((viewport) => ({ ...viewport, zoom: 1 })),
  ...[320, 390, 768, 1023].map((width) => ({ width, height: 844, zoom: 2 })),
];
const out = new URL('../.mobile-audit/sweep/', import.meta.url);
fs.mkdirSync(out, { recursive: true });

const results = await Promise.all(Object.entries({ chromium, webkit }).map(async ([name, engine]) => {
  const browser = await engine.launch();
  const page = await browser.newPage({ isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const failures = [];
  let checked = 0;
  try {
    for (const route of routes) {
      const response = await page.goto(`${base}${route}`, { waitUntil: 'load' });
      if (response?.status() !== 200 && !(route === '/404' && response?.status() === 404)) {
        failures.push({ route, error: `HTTP ${response?.status()}` });
        continue;
      }
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });
      for (const { width, height, zoom } of viewports) {
        await page.setViewportSize({ width, height });
        await page.evaluate((size) => {
          document.documentElement.style.fontSize = `${16 * size}px`;
          window.scrollTo({ left: 0, top: 0, behavior: 'instant' });
        }, zoom);
        const overflow = await page.evaluate(probeOverflow);
        const clippedBrand = width < 1024 && await page.locator('.site-header .brand-name').evaluate(
          (element) => element.scrollWidth > element.clientWidth + 1
        );
        const brokenNumber = width < 1024 && zoom === 1 && await page.locator('.phone-number').evaluateAll(
          (elements) => elements.some((element) => element.checkVisibility() &&
            element.getBoundingClientRect().height > parseFloat(getComputedStyle(element).lineHeight) + 1)
        );
        const leaks = overflow.elements.filter((element) => !element.clippedBy);
        checked++;
        if (overflow.scrollWidth > width + 1 || overflow.innerWidth > width + 1 ||
            Math.abs(overflow.maxScrollX) > 1 || Math.abs(overflow.minScrollX) > 1 || leaks.length || clippedBrand || brokenNumber) {
          failures.push({ route, width, height, zoom, clippedBrand, brokenNumber, ...overflow, elements: leaks });
        }
      }
      console.log(`${name}: ${route} (${viewports.length} viewport/text combinations)`);
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(new URL(`${name}.json`, out), JSON.stringify({ checked, widths, failures }, null, 2));
  console.log(`${name}: ${checked} checks, ${failures.length} failures`);
  return failures.length;
}));
process.exitCode = results.some(Boolean) ? 1 : 0;
