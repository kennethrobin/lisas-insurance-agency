/**
 * Renders public/og-image.png — the 1200x630 social share card.
 *
 * Same visual language as the site: the hero's navy gradient, the white brand
 * mark (public/media/logo-white.svg), the wordmark in Open Sans (the site's
 * self-hosted variable font), and the hero's own tagline. No copy is invented
 * here — every string already ships on the homepage.
 *
 * Usage (from web/):  node scripts/og-render.mjs
 * Re-run whenever the logo, palette, or tagline changes.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const out = path.join(ROOT, 'public', 'og-image.png');
// The font is read and inlined as base64: a setContent() page has no file://
// origin, so file:// subresources (fonts, images) are refused. Same reason the
// logo SVG below is inlined as markup rather than an <img src="file://...">.
const fontB64 = fs
  .readFileSync(path.join(ROOT, 'public', 'fonts', 'OpenSans-var-latin.woff2'))
  .toString('base64');
const logoSvg = fs
  .readFileSync(path.join(ROOT, 'public', 'media', 'logo-white.svg'), 'utf8')
  // Strip the XML prolog and give the root element the layout class.
  .replace(/<\?xml[^>]*\?>/, '')
  .replace('<svg ', '<svg class="mark" ');

const html = `<!doctype html>
<html><head><style>
  @font-face {
    font-family: 'Open Sans';
    font-weight: 300 800;
    src: url('data:font/woff2;base64,${fontB64}') format('woff2');
  }
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px;
    display: flex; align-items: center;
    font-family: 'Open Sans', sans-serif;
    /* The hero's gradient — --grad-hero plus its corner glow, from brand.css. */
    background:
      radial-gradient(80% 60% at 78% 8%, rgba(122, 158, 190, 0.30), transparent 62%),
      linear-gradient(168deg, #2C4666 0%, #20344F 46%, #16273D 100%);
    color: #fff;
  }
  .wrap { padding: 0 96px; display: flex; align-items: center; gap: 56px; }
  .mark { width: 220px; height: 220px; flex: 0 0 auto; }
  .name {
    font-size: 30px; font-weight: 600; letter-spacing: 0.02em;
  }
  .tagline {
    margin-top: 18px;
    font-size: 84px; font-weight: 300; line-height: 1.02; letter-spacing: -0.03em;
  }
  .sub {
    margin-top: 26px; font-size: 26px; font-weight: 400; color: #C9D6E2;
  }
</style></head>
<body>
  <div class="wrap">
    ${logoSvg}
    <div>
      <div class="name">Lisa&rsquo;s Insurance Agency</div>
      <div class="tagline">Medicare<br>made simple</div>
      <div class="sub">Medicare, health, dental &amp; vision help &mdash; free.</div>
    </div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts?.ready);
await page.waitForTimeout(300);
await page.screenshot({ path: out });
await browser.close();
console.log(`wrote ${out}`);
