# Lisa's Insurance Agency — project notes

Rebuild of lisasinsuranceagency.com. Research + planning in `docs/`, the Astro site in `web/`.

## Rules of the road

- **`docs/information-architecture.md` is the plan of record.** Navigation, sitemap, 301 map, and SEO
  rules all live there. `web/src/data/site.ts` is the code version of the same structure — if you
  change one, change the other.
- **One canonical page per product.** A quote is an on-page action (CTA/form), never its own URL.
  Do not add `/x-insurance-quote`-style routes; that duplication is the exact problem this rebuild fixes.
- **Every old URL needs a 301.** The redirect map in the IA doc ships with launch and stays permanently.
- Node ≥ 22.12, pinned in `mise.toml`.

## Site status

Navigation scaffold only. `web/src/pages/[...slug].astro` generates a placeholder for every route in
`site.ts`. Build a page for real by adding it as its own file under `src/pages/` — real files take
precedence over the catch-all, so pages can land one at a time.
