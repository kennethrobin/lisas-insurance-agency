/**
 * Run after `npm run build`, with the local preview running.
 * npm run audit:mobile:interactions
 * All lead requests are intercepted; the scheduler is deliberately blocked.
 * Browser fixtures are synthetic and never written into site content.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium, webkit } from 'playwright';
import { probeOverflow, probeTapTargets, probeFontSizes } from './mobile-audit.mjs';

const base = process.env.AUDIT_BASE_URL ?? 'http://localhost:4321';
const out = new URL('../.mobile-audit/interactions/', import.meta.url);
fs.mkdirSync(out, { recursive: true });
let failures = 0;

async function widthSafe(page, label) {
  const result = await page.evaluate(probeOverflow);
  const leaks = result.elements.filter((element) => !element.clippedBy);
  assert.ok(result.scrollWidth <= result.clientWidth + 1, `${label}: root width ${JSON.stringify(result)}`);
  assert.ok(result.innerWidth <= result.clientWidth + 1, `${label}: expanded viewport`);
  assert.ok(Math.abs(result.maxScrollX) <= 1 && Math.abs(result.minScrollX) <= 1, `${label}: sideways pan`);
  assert.deepEqual(leaks, [], `${label}: unclipped elements`);
}

async function load(page, route = '/') {
  await page.goto(`${base}${route}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });
  await page.waitForTimeout(150);
}

// Mirrors the important structure of the live Google cards: absolutely
// positioned screen-reader ratings and attribution inside offscreen slides.
async function googleFixture(page) {
  await page.locator('#reviews .review-card').evaluateAll((cards) => {
    cards.forEach((card, i) => {
      card.innerHTML = `
        <p class="stars" aria-hidden="true">★★★★★</p>
        <p class="visually-hidden">Rated 5 out of 5.</p>
        <blockquote>Browser regression fixture ${i + 1}. A longer review checks
          wrapping and attribution without requiring Google credentials.</blockquote>
        <a class="review-more" href="https://example.com/review">
          Read on Google<span class="visually-hidden">, review by Test Reviewer ${i + 1}</span>
        </a>
        <footer class="review-author">
          <span class="review-byline"><a href="https://example.com/author">Test Reviewer ${i + 1}</a>
          <time class="review-when" datetime="2026-01-01">Several months ago</time></span>
        </footer>`;
    });
  });
}

for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  const context = await browser.newContext({ isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  let leadRequests = 0;
  await context.route('**/api/lead', (route) => {
    leadRequests++;
    return route.fulfill({ status: 200, json: { ok: true } });
  });
  await context.route('**/embed/embed.js', (route) => route.abort());
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const test = async (label, work) => {
    try {
      await work();
      assert.deepEqual(errors.splice(0), [], 'Unexpected browser errors');
      console.log(`PASS ${name}: ${label}`);
    } catch (error) {
      failures++;
      console.error(`FAIL ${name}: ${label}\n${error.stack}`);
      fs.writeFileSync(new URL(`${name}-${label.replace(/[^a-z0-9]+/gi, '-')}.txt`, out), String(error.stack));
    }
  };

  for (const width of [320, 390, 430]) {
    await test(`reviews, footer, navigation @${width}`, async () => {
      await page.setViewportSize({ width, height: 844 });
      await load(page);
      await googleFixture(page);
      const scale = await page.evaluate(() => {
        const style = (selector) => getComputedStyle(document.querySelector(selector));
        return {
          body: parseFloat(style('body').fontSize),
          hero: parseFloat(style('.hero .display-xl').fontSize),
          heading: parseFloat(style('.section h2').fontSize),
          gutter: parseFloat(style('body').paddingLeft),
          inset: parseFloat(style('.hero > .container').paddingLeft),
          section: parseFloat(style('.section').paddingTop),
          card: parseFloat(style('.cards--tiles .card').paddingLeft),
          input: parseFloat(style('.git-field input').fontSize),
        };
      });
      assert.equal(scale.body, 16, 'Phone body scale');
      assert.equal(scale.hero, 32, 'Phone hero scale');
      assert.equal(scale.heading, 24, 'Phone section scale');
      assert.equal(scale.gutter, 12, 'Phone panel gutter');
      assert.ok(scale.inset >= 20 && scale.inset <= 24, 'Phone panel padding');
      assert.ok(scale.card >= 20 && scale.card <= 24, 'Phone card padding');
      assert.equal(scale.section, 56, 'Phone section spacing');
      assert.ok(scale.input >= 16, 'Input text avoids automatic iOS zoom');
      await widthSafe(page, 'Google-shaped reviews');
      const taps = (await page.evaluate(probeTapTargets)).filter((target) => !target.inline);
      assert.deepEqual(taps, [], 'Mobile controls below 44px');
      assert.deepEqual(await page.evaluate(probeFontSizes), [], 'Text below 13px');
      // The fixture must fail without BOTH positioning fixes: protects against
      // a false-green test that no longer exercises the original bug.
      const undo = await page.addStyleTag({ content: '#reviews .cards, #reviews .review-card { position: static !important; }' });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth ||
        document.documentElement.scrollWidth > document.documentElement.clientWidth), 'Fixture did not reproduce old overflow');
      await undo.evaluate((element) => element.remove());
      await widthSafe(page, 'Restored positioning');
      await page.locator('.review-dots').scrollIntoViewIfNeeded();
      const y = await page.evaluate(() => scrollY);
      await page.locator('.review-dots button').last().click();
      await page.waitForTimeout(200);
      assert.ok(await page.locator('#reviews .cards').evaluate((element) => element.scrollLeft > 0));
      assert.ok(Math.abs((await page.evaluate(() => scrollY)) - y) < 2, 'Review button scrolled the page');
      await widthSafe(page, 'Last review');

      const group = page.locator('.footer-group').first();
      assert.equal(await group.evaluate((element) => element.open), false);
      await group.locator('summary').focus();
      await page.keyboard.press('Enter');
      assert.equal(await group.evaluate((element) => element.open), true);
      await page.setViewportSize({ width: 1024, height: 844 });
      await page.waitForTimeout(100);
      assert.ok(await page.locator('.footer-group').evaluateAll((groups) => groups.every((element) => element.open)));
      await page.setViewportSize({ width, height: 844 });
      await page.waitForTimeout(100);
      assert.equal(await group.evaluate((element) => element.open), true, 'Lost mobile disclosure choice');
      assert.equal(await page.locator('.footer-group').last().evaluate((element) => element.open), false);
      await page.locator('.footer-legal').scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      assert.equal(await page.locator('[data-callbar]').isVisible(), false, 'Call bar covers footer');
      await widthSafe(page, 'Expanded footer');

      await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'instant' }));
      await page.waitForTimeout(100);
      const before = await page.evaluate(() => scrollY);
      await page.locator('[data-nav-toggle]').click();
      assert.equal(await page.locator('main').evaluate((element) => element.inert), true);
      assert.equal(await page.locator('.site-header').getAttribute('aria-modal'), 'true');
      await page.locator('.drawer-summary').click();
      await widthSafe(page, 'Expanded menu');
      await page.locator('.drawer-foot a').focus();
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('[data-nav-toggle]').evaluate((element) => element === document.activeElement), true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('main').evaluate((element) => element.inert), false);
      assert.ok(Math.abs((await page.evaluate(() => scrollY)) - before) < 2, 'Menu lost scroll position');
    });
  }

  await test('200% text and landscape menu', async () => {
    for (const viewport of [{ width: 320, height: 740 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      await load(page);
      await googleFixture(page);
      await page.addStyleTag({ content: 'html { font-size: 32px !important; }' });
      await page.waitForTimeout(150);
      await widthSafe(page, '200% home');
      await page.locator('[data-nav-toggle]').click();
      await page.locator('.drawer-summary').click();
      await page.locator('.drawer-foot a').scrollIntoViewIfNeeded();
      const button = await page.locator('.drawer-foot a').boundingBox();
      assert.ok(button.y >= 0 && button.y + button.height <= viewport.height + 1, 'Menu action unreachable');
      await widthSafe(page, '200% menu');
      await page.keyboard.press('Escape');
    }
  });

  await test('comparison views, table and FAQ', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await load(page, '/medicare/supplement');
    for (const view of ['advantage', 'both', 'supplement']) {
      await page.locator(`.compare-switch button[data-view="${view}"]`).click();
      assert.equal(await page.locator('[data-compare]').getAttribute('data-view'), view);
      assert.equal(await page.locator('.compare-col:visible').count(), view === 'both' ? 2 : 1);
      await widthSafe(page, `Comparison ${view}`);
    }
    const chart = page.getByRole('region', { name: 'Medigap plan comparison chart' });
    await chart.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
    assert.ok(await chart.evaluate((element) => element.scrollLeft > 0));
    await widthSafe(page, 'Scrolled comparison chart');
    await load(page);
    const faq = page.locator('.faq-list details').first();
    await faq.locator('summary').click();
    assert.equal(await faq.evaluate((element) => element.open), true);
    await widthSafe(page, 'FAQ');
  });

  await test('form validation, mocked success and blocked-calendar fallback', async () => {
    await page.setViewportSize({ width: 320, height: 740 });
    await load(page, '/contact');
    const before = leadRequests;
    await page.locator('[data-git-submit]').click();
    assert.equal(leadRequests, before, 'Invalid form made a request');
    assert.equal(await page.locator('[aria-invalid="true"]').count(), 6);
    await widthSafe(page, 'Form errors');
    await page.getByLabel('First name', { exact: true }).fill('Browser');
    await page.getByLabel('Last name', { exact: true }).fill('Test');
    await page.getByLabel('Email', { exact: true }).fill('browser-test@example.com');
    await page.getByLabel('Phone', { exact: true }).fill('2025550100');
    await page.getByLabel('What can I help you with?', { exact: true }).fill('Automated browser fixture. No real request is sent.');
    await page.locator('[data-git-consent]').check();
    await page.locator('[data-git-submit]').click();
    await page.locator('[data-git-cal-fallback]').waitFor({ state: 'visible', timeout: 15000 });
    assert.equal(leadRequests, before + 1);
    await widthSafe(page, 'Calendar fallback');
    await page.locator('[data-git-dismiss]').click();
    assert.equal(await page.locator('[data-git-step="done"]').isVisible(), true);
    await widthSafe(page, 'Form confirmation');
  });

  await test('normal motion: no horizontal page pan', async () => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 390, height: 844 });
    await load(page);
    await googleFixture(page);
    await page.waitForTimeout(1000);
    await widthSafe(page, 'Animated home');
  });

  await test('no pause controls and device motion preference changes', async () => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await load(page);
    assert.equal(await page.locator('[data-motion-toggle], .motion-toggle').count(), 0);
    assert.equal(await page.getByRole('button', { name: /pause animations/i }).count(), 0);
    assert.equal(await page.locator('html').getAttribute('data-motion-paused'), null);
    assert.ok(await page.locator('.carrier-track').evaluateAll(
      (tracks) => tracks.every((track) => getComputedStyle(track).animationName === 'carrier-roll')
    ));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(100);
    assert.equal(await page.locator('.hero-video').evaluate((video) => video.paused), true);
    assert.ok(await page.locator('.carrier-track').evaluateAll(
      (tracks) => tracks.every((track) => getComputedStyle(track).animationName === 'none')
    ));
    await widthSafe(page, 'Reduced motion without controls');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForTimeout(100);
    assert.equal(await page.locator('html').getAttribute('data-motion-paused'), null);
    await load(page, '/dental-insurance');
    assert.equal(await page.locator('[data-motion-toggle], .motion-toggle').count(), 0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(100);
    assert.ok(await page.locator('.carrier-track').evaluateAll(
      (tracks) => tracks.every((track) => getComputedStyle(track).animationName === 'none')
    ));
  });

  await test('logo assets and keyboard skip link', async () => {
    await load(page);
    const brand = page.getByRole('link', { name: "Lisa's Insurance Agency — home", exact: true });
    assert.ok(await brand.first().isVisible());
    assert.equal(await page.locator('.site-header .brand-mark').getAttribute('aria-hidden'), 'true');
    for (const asset of ['/favicon.svg', '/favicon.ico', '/apple-touch-icon.png']) {
      const response = await page.request.get(`${base}${asset}`);
      assert.equal(response.status(), 200, `Missing logo asset ${asset}`);
      assert.ok((await response.body()).length > 100, `Empty logo asset ${asset}`);
    }
    assert.equal(await page.locator('link[rel="apple-touch-icon"]').getAttribute('href'), '/apple-touch-icon.png');
    // macOS WebKit follows Safari's default: Tab skips links, Option-Tab
    // visits every control. Do not confuse that preference with a broken link.
    const linkTab = name === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
    await page.keyboard.press(linkTab);
    assert.equal(await page.locator('.skip-link').evaluate((link) => link === document.activeElement), true);
    await page.keyboard.press('Enter');
    assert.equal(new URL(page.url()).hash, '#main');
    await page.keyboard.press(linkTab);
    assert.ok(await page.locator('main').evaluate((main) => main.contains(document.activeElement)));
  });

  await test('footer without JavaScript', async () => {
    const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const fallback = await nojs.newPage();
    await fallback.goto(base);
    const group = fallback.locator('.footer-group').first();
    assert.equal(await group.getAttribute('open'), null);
    await group.locator('summary').click();
    assert.notEqual(await group.getAttribute('open'), null);
    assert.ok(await fallback.locator('.carrier-track').evaluateAll(
      (tracks) => tracks.every((track) => getComputedStyle(track).animationName === 'none')
    ));
    await nojs.close();
  });
  await context.close();
  await browser.close();
}
console.log(`${failures} mobile interaction failures.`);
process.exitCode = failures ? 1 : 0;
