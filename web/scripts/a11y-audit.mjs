/**
 * Accessibility audit — axe-core over every route, two widths.
 *
 * Runs WCAG 2.0/2.1 A + AA rules against each canonical route at desktop
 * (1280px) and phone (390px) size, and once more on the homepage with the
 * mobile menu open (the drawer is a modal, which has its own obligations).
 *
 * Usage (from web/, dev server or preview running):
 *   npm run audit:a11y
 *   AUDIT_BASE_URL=http://localhost:4322 npm run audit:a11y
 *
 * Exit code 1 when any violation is found, so it can gate CI later.
 * The cal.com iframe is excluded: third-party content we cannot restyle —
 * the fallback path (call instead) is the accessible alternative.
 */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const BASE = process.env.AUDIT_BASE_URL ?? 'http://localhost:4321';

const routes = [
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

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const browser = await chromium.launch();
let totalViolations = 0;

async function audit(page, label) {
  const results = await new AxeBuilder({ page })
    .withTags(TAGS)
    .exclude('iframe[src*="cal.com"]')
    .analyze();

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

for (const vp of widths) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  console.log(`\n=== ${vp.name} (${vp.width}px) ===`);

  for (const route of routes) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'load' });
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

  await context.close();
}

await browser.close();
console.log(
  totalViolations === 0
    ? '\nAll routes pass axe (WCAG 2.0/2.1 A+AA).'
    : `\n${totalViolations} violation(s) found.`,
);
process.exit(totalViolations === 0 ? 0 : 1);
