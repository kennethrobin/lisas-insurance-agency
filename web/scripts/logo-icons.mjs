/**
 * Generate browser and iOS icons from the supplied white brand mark.
 * Run from web/: node scripts/logo-icons.mjs
 */
import fs from 'node:fs';
import { chromium } from 'playwright';

const publicDir = new URL('../public/', import.meta.url);
const svg = fs.readFileSync(new URL('media/logo-white.svg', publicDir), 'utf8')
  .replace(/<\?xml[^>]*\?>/, '');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const images = [];
  for (const size of [16, 32, 48, 180]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<!doctype html><html><head><style>
      html, body { margin: 0; width: 100%; height: 100%; background: #20344F; }
      svg { display: block; width: 100%; height: 100%; }
    </style></head><body>${svg}</body></html>`);
    const png = await page.screenshot({ type: 'png' });
    if (size === 180) {
      fs.writeFileSync(new URL('apple-touch-icon.png', publicDir), png);
    } else {
      images.push({ size, png });
    }
  }

  // ICO directory with PNG-encoded 16, 32, and 48px images.
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, index) => {
    const entry = 6 + index * 16;
    header[entry] = size;
    header[entry + 1] = size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  fs.writeFileSync(new URL('favicon.ico', publicDir),
    Buffer.concat([header, ...images.map(({ png }) => png)]));
  console.log('Generated branded favicon.ico and apple-touch-icon.png.');
} finally {
  await browser.close();
}
