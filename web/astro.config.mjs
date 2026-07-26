// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Used for canonical URLs and (later) the generated sitemap.xml.
  site: 'https://www.lisasinsuranceagency.com',

  // The whole site stays statically rendered (the default). The Vercel adapter
  // is here only so ONE route — src/pages/api/lead.ts, which opts in with
  // `export const prerender = false` — can run on demand and forward the
  // contact form to the CRM server-side. Nothing else becomes SSR.
  adapter: vercel(),
});
