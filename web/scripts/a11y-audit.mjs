/**
 * Accessibility audit — axe-core over every route, two widths.
 *
 * Runs WCAG 2.0/2.1/2.2 A + AA rules against each canonical route at desktop
 * (1280px) and phone (390px) size, and once more on the homepage with the
 * mobile menu open (the drawer is a modal, which has its own obligations).
 *
 * Usage (from web/, dev server or preview running):
 *   npm run audit:a11y
 *   npm run audit:a11y -- --all --browser=all
 *   AUDIT_BASE_URL=http://localhost:4322 npm run audit:a11y
 *
 * Exit code 1 when any violation is found, so it can gate CI later.
 * The cal.com iframe is excluded: third-party content we cannot restyle —
 * the fallback path (call instead) is the accessible alternative.
 */
import { chromium, webkit } from 'playwright';
import fs from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { builtRoutes } from './mobile-audit.mjs';

const BASE = process.env.AUDIT_BASE_URL ?? 'http://localhost:4321';

const routes = process.argv.includes('--all') ? builtRoutes() : [
  '/',
  '/medicare',
  '/medicare/advantage',
  '/medicare/supplement',
  '/medicare/prescription-drugs',
  '/medicare/education',
  '/medicare/education/turning-65-what-to-do-first',
  '/medicare/resources',
  '/health-insurance',
  '/dental-insurance',
  '/about',
  '/contact',
  '/policyholders',
  '/accessibility',
  '/privacy',
  '/thank-you',
  '/404',
];

const widths = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'phone', width: 390, height: 844 },
];

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const engineName = process.argv.find((arg) => arg.startsWith('--browser='))?.split('=')[1] ?? 'chromium';
const engines = { chromium, webkit };
if (engineName !== 'all' && !engines[engineName]) {
  throw new Error(`Unsupported browser: ${engineName}`);
}
let totalViolations = 0;
let states = 0;
let manualReviewItems = 0;
const reports = [];

async function audit(page, label) {
  const results = await new AxeBuilder({ page })
    .withTags(TAGS)
    .exclude('iframe[src*="cal.com"]')
    .analyze();
  states++;
  manualReviewItems += results.incomplete.length;
  reports.push({
    browser: page.context().browser().browserType().name(),
    viewport: page.viewportSize(),
    label,
    violations: results.violations,
    incomplete: results.incomplete,
  });

  if (results.violations.length === 0) {
    console.log(`  ok    ${label}`);
    return;
  }
  totalViolations += results.violations.length;
  for (const v of results.violations) {
    console.log(`  FAIL  ${label}: [${v.impact}] ${v.id} — ${v.help}`);
    for (const node of v.nodes.slice(0, 3)) {
      console.log(`        ${node.target.join(' ')}`);
    }
  }
}

for (const [name, engine] of Object.entries(engines)) {
  if (engineName !== 'all' && engineName !== name) continue;
  const browser = await engine.launch();
  try {
    for (const vp of widths) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      console.log(`\n=== ${name}: ${vp.name} (${vp.width}px) ===`);

      for (const route of routes) {
        const response = await page.goto(`${BASE}${route}`, { waitUntil: 'load' });
        if (response?.status() !== 200 && !(route === '/404' && response?.status() === 404)) {
          throw new Error(`${route}: unexpected HTTP ${response?.status()}`);
        }
        await page.evaluate(() => document.fonts?.ready);
        await page.waitForTimeout(250);
        await audit(page, route);
      }

      // The open mobile menu is a modal overlay with its own a11y obligations.
      if (vp.name === 'phone') {
        await page.goto(`${BASE}/`, { waitUntil: 'load' });
        await page.click('[data-nav-toggle]');
        await page.waitForTimeout(400);
        await audit(page, '/ (menu open)');
      }

      await page.goto(`${BASE}/`, { waitUntil: 'load' });
      await page.locator('.footer-group').evaluateAll((groups) => {
        groups.forEach((group) => { group.open = true; });
      });
      await page.locator('.footer-legal').scrollIntoViewIfNeeded();
      await audit(page, '/ (footer expanded)');
      await page.locator('.faq-list details').first().locator('summary').click();
      await audit(page, '/ (FAQ expanded)');

      await page.goto(`${BASE}/contact`, { waitUntil: 'load' });
      // Never submit a real lead, even if validation regresses.
      await page.route('**/api/lead', (route) => route.abort());
      await page.locator('[data-git-submit]').click();
      if (await page.locator('[aria-invalid="true"]').count() !== 6) {
        throw new Error('Expected six accessible form validation errors');
      }
      await audit(page, '/contact (validation errors)');
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

const output = new URL('../.mobile-audit/release-a11y.json', import.meta.url);
fs.mkdirSync(new URL('.', output), { recursive: true });
fs.writeFileSync(output, JSON.stringify({ base: BASE, reports }, null, 2));
console.log(
  totalViolations === 0
    ? `\nNo axe violations detected in ${states} tested route/state checks (WCAG 2.0/2.1/2.2 A+AA rules).`
    : `\n${totalViolations} violation(s) found.`,
);
console.log(`${manualReviewItems} incomplete rule results require manual review; automated checks do not certify WCAG conformance.`);
process.exit(totalViolations === 0 ? 0 : 1);
