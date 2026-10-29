import type { APIRoute } from 'astro';

/**
 * /sitemap.xml, the address submitted in Google Search Console.
 *
 * The page list itself is generated automatically by @astrojs/sitemap at build
 * time (sitemap-0.xml, filtered in astro.config.mjs), so new pages and
 * education articles are included without anyone editing this file. This is a
 * standard sitemap index pointing at that list; Google reads it the same as
 * /sitemap-index.xml, which also still works.
 */
export const GET: APIRoute = ({ site }) => {
  const list = new URL('sitemap-0.xml', site);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${list.href}</loc></sitemap>
</sitemapindex>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
