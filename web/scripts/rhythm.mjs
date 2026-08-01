/**
 * Vertical-rhythm and contrast measurement.
 *
 * The rule being tested: the gap BETWEEN two sections must be at least 2.5x the
 * largest gap INSIDE a section. Shrinking desktop spacing uniformly preserves
 * neither, which is what makes a page read as "bunched up". This measures both
 * numbers in a real browser instead of trusting the stylesheet's arithmetic.
 *
 * Also prints WCAG contrast for the brand pairs, so "is the accent readable"
 * is answered with a number.
 *
 * Usage (from web/):  node scripts/rhythm.mjs --route=/ --width=390
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.AUDIT_BASE_URL ?? 'http://localhost:4321';

const opts = {};
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  if (m) opts[m[1]] = m[2] ?? true;
}
const route = opts.route ?? '/';
const width = Number(opts.width ?? 390);
const height = Number(opts.height ?? 844);

/* ---------- contrast ---------- */
const srgb = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const lum = (hex) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const PAIRS = [
  ['gold-ink on gold (primary button)', '#3A2708', '#C68A3C'],
  ['white on gold (rejected alt)', '#FFFFFF', '#C68A3C'],
  ['green on paper (reassurance mark)', '#34704F', '#FBF6EC'],
  ['green on white panel', '#34704F', '#FFFFFF'],
  ['green on surface-card', '#34704F', '#F7F3EA'],
  ['steel label on white panel', '#3F5C7A', '#FFFFFF'],
  ['steel label on paper card', '#3F5C7A', '#FBF6EC'],
  ['ink body on white panel', '#22303D', '#FFFFFF'],
  ['ink body on paper card', '#22303D', '#FBF6EC'],
  ['on-navy-body on navy', '#E4ECF4', '#20344F'],
  ['on-navy-soft label on navy', '#C9D6E2', '#20344F'],
  ['green-on-navy mark', '#8FD0A8', '#20344F'],
  ['white heading on navy', '#FFFFFF', '#20344F'],
];

console.log(`\n=== CONTRAST (WCAG AA needs 4.5 body / 3.0 large) ===`);
for (const [label, fg, bg] of PAIRS) {
  const r = ratio(fg, bg);
  const verdict = r >= 4.5 ? 'PASS body' : r >= 3 ? 'large-only' : 'FAIL';
  console.log(`  ${r.toFixed(2).padStart(5)}:1  ${verdict.padEnd(10)} ${label}`);
}

/* ---------- rhythm ---------- */
const browser = await chromium.launch();
const context = await browser.newContext({ reducedMotion: 'reduce' });
const page = await context.newPage();
await page.setViewportSize({ width, height });
await page.goto(`${BASE_URL}${route}`, { waitUntil: 'load' });
await page.evaluate(() => document.fonts?.ready);
await page.waitForTimeout(400);

const result = await page.evaluate(() => {
  const main = document.querySelector('main');
  if (!main) return null;

  // Astro injects <script> into <main>; those are not sections. Keep only
  // elements that actually render a box.
  const sections = [...main.children].filter((el) => {
    if (['SCRIPT', 'STYLE', 'TEMPLATE', 'LINK'].includes(el.tagName)) return false;
    return el.getBoundingClientRect().height > 0;
  });
  const between = [];
  for (let i = 0; i < sections.length - 1; i++) {
    const a = sections[i].getBoundingClientRect();
    const b = sections[i + 1].getBoundingClientRect();
    // Visual separation = panel gap + the two facing paddings.
    const padA = parseFloat(getComputedStyle(sections[i]).paddingBottom) || 0;
    const padB = parseFloat(getComputedStyle(sections[i + 1]).paddingTop) || 0;
    between.push({
      pair: `${sections[i].className || sections[i].tagName} -> ${sections[i + 1].className || sections[i + 1].tagName}`,
      gap: Math.round(b.top - a.bottom + padA + padB),
    });
  }

  // Largest vertical gap between adjacent siblings inside any one section.
  let worst = { gap: 0, where: '' };
  for (const s of sections) {
    const container = s.querySelector('.container') ?? s;
    const kids = [...container.children].filter((k) => {
      if (['SCRIPT', 'STYLE', 'TEMPLATE', 'LINK'].includes(k.tagName)) return false;
      const r = k.getBoundingClientRect();
      if (r.height <= 0) return false;
      // The hero centres its headline with `margin-block: auto`, so the space
      // above and below it is leftover viewport, not an authored gap. Measuring
      // it as one would make every page fail the ratio for the wrong reason.
      return !(s.classList.contains('hero') && k.tagName === 'H1');
    });
    for (let i = 0; i < kids.length - 1; i++) {
      const a = kids[i].getBoundingClientRect();
      const b = kids[i + 1].getBoundingClientRect();
      const gap = Math.round(b.top - a.bottom);
      if (gap > worst.gap) {
        worst = {
          gap,
          where: `${s.className || s.tagName}: ${kids[i].className || kids[i].tagName} -> ${kids[i + 1].className || kids[i + 1].tagName}`,
        };
      }
    }
  }

  return { between, worst };
});

console.log(`\n=== VERTICAL RHYTHM @${width}px  ${route} ===`);
console.log('between-section gaps:');
for (const b of result.between) console.log(`  ${String(b.gap).padStart(4)}px  ${b.pair}`);
const minBetween = Math.min(...result.between.map((b) => b.gap));
console.log(`\nsmallest between-section gap: ${minBetween}px`);
console.log(`largest inside-section gap:   ${result.worst.gap}px  (${result.worst.where})`);
const r = result.worst.gap ? minBetween / result.worst.gap : Infinity;
console.log(`ratio: ${r.toFixed(2)}x  ${r >= 2.5 ? 'PASS (>= 2.5x)' : 'FAIL (< 2.5x)'}`);

await browser.close();
