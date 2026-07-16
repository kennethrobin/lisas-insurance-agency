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

Homepage is designed and built; every other route is still a placeholder.
`web/src/pages/[...slug].astro` generates a placeholder for each remaining route in `site.ts`. Build a
page for real by adding it as its own file under `src/pages/` — real files take precedence over the
catch-all, so pages can land one at a time.

## Design system

- `web/src/styles/brand.css` is the real visual design (tokens, type scale, components). Designed
  pages import it. `web/src/styles/global.css` is still the placeholder scaffold's styling — brand.css
  is intended to replace it once every page is designed.
- Designed pages pass `bare` to `Base.astro`: they ship their own chrome and full-bleed sections, so
  Base skips the scaffold Header/Footer and the `.wrap` + `main` padding. Scaffold routes are unchanged.
- Type: self-hosted Open Sans (variable, latin) at `web/public/fonts/`. Body 18px minimum — the
  audience skews senior, so legibility rules over density.
- Colour: navy `#20344F`, gold `#C68A3C` **on primary action buttons only**, green `#34704F` for
  reassurance marks only, ink `#22303D` for all body text. No grey body text.

## Compliance (non-negotiable on any Medicare-facing page)

- No superlatives ("best", "#1"), no premium/price figures, no plan-specific benefit promises, and
  never promise an instant quote.
- Every phone display carries: "Calling connects you with Lisa, a licensed insurance agent."
- The three footer disclaimers in `components/home/HomeFooter.astro` ship verbatim.
