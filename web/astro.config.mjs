// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import { copyFile } from 'node:fs/promises';
import { legacyRedirects } from './redirects.mjs';

/* Pages that carry `noindex`; they stay out of the sitemap too. */
const unlisted = [/\/thank-you\/?$/, /\/404\/?$/, /\/policyholders(\/|$)/];

// https://astro.build/config
export default defineConfig({
  // Used for canonical URLs, the sitemap, and robots.txt.
  site: 'https://www.lisasinsuranceagency.com',

  // Permanent 301s from every old Weebly URL. The Vercel adapter writes these
  // as real server redirects, not meta-refresh pages. See redirects.mjs.
  redirects: legacyRedirects,

  integrations: [
    sitemap({
      filter: (page) => !unlisted.some((pattern) => pattern.test(new URL(page).pathname)),
    }),
    // Search Console and most crawlers look for /sitemap.xml. Publish the full
    // page list there (a copy of the generated sitemap-0.xml, rebuilt on every
    // deploy so new pages appear automatically). sitemap-index.xml still works.
    {
      name: 'sitemap-xml-alias',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          await copyFile(new URL('sitemap-0.xml', dir), new URL('sitemap.xml', dir));
        },
      },
    },
  ],

  // The whole site stays statically rendered (the default). The Vercel adapter
  // is here only so ONE route — src/pages/api/lead.ts, which opts in with
  // `export const prerender = false` — can run on demand and forward the
  // contact form to the CRM server-side. Nothing else becomes SSR.
  adapter: vercel(),
});
