import type { APIRoute } from 'astro';

/**
 * robots.txt, built from `site` in astro.config.mjs so the sitemap URL always
 * matches the real domain. Crawling is open; the lead API is excluded because
 * it only accepts form posts. Pages that shouldn't be indexed (thank-you, 404,
 * policyholder placeholders) carry their own `noindex` meta tag instead, which
 * is the reliable way to keep a page out of search results.
 */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site);
  const body = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${sitemap.href}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
