/**
 * Mobile audit + desktop regression harness.
 *
 * Three jobs, one script:
 *   1. Screenshot every route at every width (full page).
 *   2. Report the three failure classes that make a page unusable on a phone:
 *      horizontal overflow, sub-44px tap targets, sub-13px text.
 *   3. Pixel-diff the desktop widths against a saved baseline, so a mobile
 *      change that leaks into >=1024px is caught instead of argued about.
 *
 * Usage (from web/):
 *   npm run build && npx astro preview --port 4322
 *   AUDIT_BASE_URL=http://localhost:4322 node scripts/mobile-audit.mjs --label=baseline
 *   AUDIT_BASE_URL=http://localhost:4322 node scripts/mobile-audit.mjs --label=after
 *   node scripts/mobile-audit.mjs --diff=baseline:after
 *
 * RUN THE DIFF AGAINST THE BUILT OUTPUT, NOT THE DEV SERVER.
 * `astro dev` injects the dev toolbar, which renders a floating pill over the
 * page and puts a notification badge on it whose state varies between runs.
 * That alone produced a 4px "regression" on every route and a 3,666px one on
 * /medicare/supplement — none of it real. Against `astro preview` the same
 * comparison is a clean zero.
 *
 * WHY THE OVERFLOW CHECK MEASURES ELEMENTS, NOT scrollWidth
 * brand.css sets `body { overflow-x: clip }`. That silently swallows horizontal
 * overflow, so documentElement.scrollWidth can read clean while content is in
 * fact hanging off the side. We therefore walk every element and compare its
 * right edge to documentElement.clientWidth, and separately record whether an
 * ancestor legitimately clips it (.table-scroll, the carrier marquee) so a
 * deliberate scroller isn't confused with a genuine leak.
 */

import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_ROOT = path.join(ROOT, '.mobile-audit');

const BASE_URL = process.env.AUDIT_BASE_URL ?? 'http://localhost:4321';

/** Every route worth auditing: the designed pages, one blog post, one stub. */
const ROUTES = [
  '/',
  '/health-insurance',
  '/medicare',
  '/medicare/advantage',
  '/medicare/supplement',
  '/medicare/prescription-drugs',
  '/medicare/education',
  '/medicare/education/turning-65-what-to-do-first',
  '/medicare/resources',
  '/dental-insurance',
  '/about',
  '/contact',
  '/privacy',
  '/404',
];

/** Realistic device heights — the hero is sized off viewport height (svh). */
const WIDTHS = [
  { w: 360, h: 740 },
  { w: 390, h: 844 },
  { w: 430, h: 932 },
  { w: 768, h: 1024 },
  { w: 1024, h: 768 },
  { w: 1440, h: 900 },
];

/** Widths that must never change: desktop is frozen. */
const DESKTOP_WIDTHS = [1024, 1440];

const MIN_TAP = 44;
const MIN_FONT = 13;

const slug = (route) => (route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '-'));

function args() {
  const out = {};
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) out[m[1]] = m[2] ?? true;
  }
  return out;
}

/* ==========================================================================
   In-page probes
   ========================================================================== */

/**
 * Elements whose right edge passes the viewport's right edge.
 * Returns the real offenders plus, for each, the ancestor that clips it (if
 * any) so intentional scrollers can be triaged out of the failure list.
 */
const probeOverflow = () => {
  const limit = document.documentElement.clientWidth;
  const describe = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const cls =
      typeof el.className === 'string' && el.className.trim()
        ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
        : '';
    return `${el.tagName.toLowerCase()}${id}${cls}`;
  };

  const hits = [];
  for (const el of document.querySelectorAll('*')) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    if (rect.right <= limit + 1) continue;

    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') continue;
    // Off-canvas by design (closed overlays parked to the side).
    if (style.position === 'fixed' && rect.left >= limit) continue;

    // Nearest ancestor that actually clips horizontally.
    //
    // <body> and <html> are deliberately NOT accepted as legitimate clippers.
    // brand.css puts `overflow-x: clip` on body, which would otherwise mark
    // every genuine leak as "handled" — that blanket clip is precisely what
    // hides real bugs (it was masking a 65px header overflow at 430px). Only a
    // purpose-built scroller like .table-scroll counts as intentional.
    let clippedBy = null;
    for (let p = el.parentElement; p; p = p.parentElement) {
      if (p === document.body || p === document.documentElement) break;
      const ox = getComputedStyle(p).overflowX;
      if (ox && ox !== 'visible') {
        const pr = p.getBoundingClientRect();
        if (pr.right <= limit + 1) clippedBy = describe(p);
        break;
      }
    }

    hits.push({
      el: describe(el),
      right: Math.round(rect.right),
      width: Math.round(rect.width),
      over: Math.round(rect.right - limit),
      clippedBy,
    });
  }

  // Deepest-first is noisy; keep the worst offenders per unique description.
  const seen = new Map();
  for (const h of hits) {
    const prev = seen.get(h.el);
    if (!prev || h.over > prev.over) seen.set(h.el, h);
  }

  return {
    clientWidth: limit,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    elements: [...seen.values()].sort((a, b) => b.over - a.over),
  };
};

/** Interactive controls smaller than 44px in either dimension. */
const probeTapTargets = () => {
  const MIN = 44;
  const sel = 'a, button, input, select, textarea, summary, [role="button"]';
  const describe = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const cls =
      typeof el.className === 'string' && el.className.trim()
        ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
        : '';
    return `${el.tagName.toLowerCase()}${id}${cls}`;
  };

  const out = [];
  for (const el of document.querySelectorAll(sel)) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    if (el.closest('[hidden]')) continue;
    if (el.type === 'hidden') continue;
    // Not clickable is not a tap target. The footer's <summary> elements are
    // inert above 768px, where the groups are permanently open.
    if (style.pointerEvents === 'none') continue;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.width >= MIN && rect.height >= MIN) continue;

    // A radio or checkbox wrapped in a label is targeted by the whole label,
    // which is the standard pattern; measuring the 22px dot inside a 56px row
    // reports a problem that does not exist for anyone actually tapping it.
    // The same logic applies to a sibling <label for="..."> — clicking it
    // activates the control, so WCAG 2.5.8 counts the pair as one target.
    let label = el.closest('label');
    if (!label && el.id) label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (label && label !== el) {
      const lr = label.getBoundingClientRect();
      if (lr.width >= MIN && lr.height >= MIN) continue;
    }

    // WCAG 2.5.8 exempts links flowing inline inside a sentence; flag them
    // separately rather than pretending they're the same problem as a button.
    const inline =
      el.tagName === 'A' &&
      style.display.startsWith('inline') &&
      !!el.closest('p, li, figcaption, blockquote');

    out.push({
      el: describe(el),
      text: (el.textContent || '').trim().slice(0, 40),
      w: Math.round(rect.width),
      h: Math.round(rect.height),
      inline,
    });
  }
  return out;
};

/** Rendered text with a computed font-size under 13px. */
const probeFontSizes = () => {
  const MIN = 13;
  const describe = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const cls =
      typeof el.className === 'string' && el.className.trim()
        ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
        : '';
    return `${el.tagName.toLowerCase()}${id}${cls}`;
  };

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const found = new Map();

  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.nodeValue?.trim();
    if (!text) continue;

    const el = n.parentElement;
    if (!el) continue;
    if (el.closest('[hidden], script, style, noscript')) continue;

    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') continue;

    const size = parseFloat(style.fontSize);
    if (!(size < MIN)) continue;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    const key = `${describe(el)}@${size}`;
    if (!found.has(key)) {
      found.set(key, { el: describe(el), size: +size.toFixed(2), text: text.slice(0, 40) });
    }
  }
  return [...found.values()].sort((a, b) => a.size - b.size);
};

/* ==========================================================================
   Capture
   ========================================================================== */

/**
 * Optional text-zoom multiplier (`--zoom=2`).
 *
 * WCAG 1.4.4 asks that text scale to 200% without loss of content. Doubling
 * the root font-size is the honest way to test it on a rem-based stylesheet:
 * page zoom would just shrink the viewport, which the responsive layout
 * already handles, whereas this leaves the viewport alone and makes every
 * rem-sized box grow inside it — which is where things actually break.
 */
async function applyZoom(page, zoom) {
  if (!zoom || zoom === 1) return;
  await page.addStyleTag({
    content: `html { font-size: ${16 * zoom}px !important; }`,
  });
  await page.waitForTimeout(200);
}

async function capture(label, zoom = 1) {
  const outDir = path.join(OUT_ROOT, label);
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  // Reduced motion pins the page down: the hero video never loads, the carrier
  // marquee stops, the review chip stops rotating. Without it no two
  // screenshots are ever the same and the regression diff is meaningless.
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
  });

  const report = [];

  for (const route of ROUTES) {
    for (const { w, h } of WIDTHS) {
      const page = await context.newPage();
      await page.setViewportSize({ width: w, height: h });

      const url = `${BASE_URL}${route}`;
      let status = 0;
      try {
        const res = await page.goto(url, { waitUntil: 'load', timeout: 45000 });
        status = res?.status() ?? 0;
      } catch (err) {
        report.push({ route, width: w, error: String(err) });
        await page.close();
        continue;
      }

      await page.evaluate(() => document.fonts?.ready);
      await applyZoom(page, zoom);
      // Let the header measure itself and any layout settle.
      await page.waitForTimeout(350);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(150);

      const overflow = await page.evaluate(probeOverflow);
      const taps = await page.evaluate(probeTapTargets);
      const fonts = await page.evaluate(probeFontSizes);

      // Pin the capture to the viewport width. A page containing a wide
      // element inside its own scroller (the Medigap table) inflates
      // documentElement.scrollWidth, and an unclipped fullPage shot then comes
      // out wider than the viewport — which would make the regression diff
      // compare two differently sized images and fail for the wrong reason.
      const fullHeight = await page.evaluate(
        () => document.documentElement.scrollHeight
      );
      const file = path.join(outDir, `${slug(route)}-${w}.png`);
      await page.screenshot({
        path: file,
        fullPage: true,
        clip: { x: 0, y: 0, width: w, height: fullHeight },
      });

      report.push({ route, width: w, status, overflow, taps, fonts, file });
      await page.close();
    }
    process.stdout.write(`  captured ${route}\n`);
  }

  await browser.close();
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  return report;
}

/* ==========================================================================
   Reporting
   ========================================================================== */

function summarise(report) {
  let hardOverflow = 0;
  let tapFails = 0;
  let fontFails = 0;

  const lines = [];

  for (const entry of report) {
    if (entry.error) {
      lines.push(`FAIL ${entry.route} @${entry.width}: ${entry.error}`);
      continue;
    }
    // Only unclipped overflow is a real failure.
    const real = entry.overflow.elements.filter((e) => !e.clippedBy);
    const taps = entry.taps.filter((t) => !t.inline);
    const fonts = entry.fonts;

    if (real.length || taps.length || fonts.length) {
      lines.push(`\n${entry.route} @${entry.width}px`);
      if (real.length) {
        hardOverflow += real.length;
        lines.push(`  OVERFLOW (${real.length}) viewport=${entry.overflow.clientWidth} scrollWidth=${entry.overflow.scrollWidth}`);
        for (const e of real.slice(0, 8)) lines.push(`    +${e.over}px  ${e.el}  (w=${e.width})`);
      }
      if (taps.length) {
        tapFails += taps.length;
        lines.push(`  TAP < ${MIN_TAP}px (${taps.length})`);
        for (const t of taps.slice(0, 8)) lines.push(`    ${t.w}x${t.h}  ${t.el}  "${t.text}"`);
      }
      if (fonts.length) {
        fontFails += fonts.length;
        lines.push(`  FONT < ${MIN_FONT}px (${fonts.length})`);
        for (const f of fonts.slice(0, 10)) lines.push(`    ${f.size}px  ${f.el}  "${f.text}"`);
      }
    }
  }

  lines.push(
    `\n=== TOTALS ===\noverflow elements: ${hardOverflow}\ntap targets < ${MIN_TAP}px: ${tapFails}\ntext < ${MIN_FONT}px: ${fontFails}`
  );
  return { text: lines.join('\n'), hardOverflow, tapFails, fontFails };
}

/* ==========================================================================
   Desktop regression diff
   ========================================================================== */

function diff(fromLabel, toLabel) {
  const a = path.join(OUT_ROOT, fromLabel);
  const b = path.join(OUT_ROOT, toLabel);
  const outDir = path.join(OUT_ROOT, `diff-${fromLabel}-${toLabel}`);
  fs.mkdirSync(outDir, { recursive: true });

  let worst = 0;
  const lines = [];

  for (const route of ROUTES) {
    for (const w of DESKTOP_WIDTHS) {
      const name = `${slug(route)}-${w}.png`;
      const fa = path.join(a, name);
      const fb = path.join(b, name);
      if (!fs.existsSync(fa) || !fs.existsSync(fb)) {
        lines.push(`SKIP ${name} (missing)`);
        continue;
      }

      const ia = PNG.sync.read(fs.readFileSync(fa));
      const ib = PNG.sync.read(fs.readFileSync(fb));

      if (ia.width !== ib.width || ia.height !== ib.height) {
        lines.push(
          `DIFF ${name}: size changed ${ia.width}x${ia.height} -> ${ib.width}x${ib.height}`
        );
        worst = Math.max(worst, 1);
        continue;
      }

      const out = new PNG({ width: ia.width, height: ia.height });
      const n = pixelmatch(ia.data, ib.data, out.data, ia.width, ia.height, {
        threshold: 0.1,
      });
      if (n > 0) {
        fs.writeFileSync(path.join(outDir, name), PNG.sync.write(out));
        lines.push(`DIFF ${name}: ${n} px`);
        worst = Math.max(worst, n);
      }
    }
  }

  lines.push(worst === 0 ? '\nDESKTOP REGRESSION: clean (0 differing pixels)' : `\nDESKTOP REGRESSION: ${worst} px worst-case — see ${outDir}`);
  return { text: lines.join('\n'), worst };
}

/* ========================================================================== */

const opts = args();

if (opts.diff) {
  const [from, to] = String(opts.diff).split(':');
  const r = diff(from, to);
  console.log(r.text);
  process.exit(r.worst === 0 ? 0 : 1);
} else {
  const label = String(opts.label ?? 'after');
  const zoom = Number(opts.zoom ?? 1);
  console.log(
    `Capturing "${label}" from ${BASE_URL}${zoom !== 1 ? ` at ${zoom * 100}% text zoom` : ''} ...`
  );
  const report = await capture(label, zoom);
  const s = summarise(report);
  console.log(s.text);
  fs.writeFileSync(path.join(OUT_ROOT, label, 'summary.txt'), s.text);
  const clean = s.hardOverflow === 0 && s.tapFails === 0 && s.fontFails === 0;
  console.log(clean ? '\nALL CHECKS CLEAN' : '\nCHECKS FAILING (see above)');
}
