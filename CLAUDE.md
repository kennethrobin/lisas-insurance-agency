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

Every prospect-facing page is designed and built (homepage + the pages in the nav tree). What
remains as an IA placeholder is only the existing-client tail (`/policyholders/*`, `/agent-login`)
and the legal pages (`/accessibility`, `/privacy`, `/thank-you`) — `web/src/pages/[...slug].astro`
renders those on the brand shell too, so an unbuilt route still looks like the rest of the site.
Build one for real by adding its own file under `src/pages/`; real files win over the catch-all.

## Architecture

- **One layout for interior pages: `layouts/Page.astro`** (Shell + brand.css + `SiteHeader` +
  `SiteFooter` + the standard `PageHero`). The homepage uses Shell directly because it ships a
  bespoke hero. Nothing uses a scaffold layout — `Base.astro` and `global.css` were **deleted**:
  they defined the same class names as brand.css, so any page that reached for them silently lost
  its styling. Don't reintroduce them.
- **`data/site.ts`** is the IA source of truth (nav tree, footer, routes). Header and footer both
  render from it. **`data/links.ts`** centralises every outbound URL; unset ones are `"#"` and each
  control checks `isPending()` for a graceful fallback rather than rendering dead.
- **Reusable in-brand components:** `Faq`, `CompareMaMedigap`, `CarrierStrip`, `MedigapChart`,
  `CtaBand`, `MediaSlot`, `Subscribe`, `PageHero`. Build new pieces in the same visual language.
- **Blog** is an Astro content collection (`content.config.ts`, posts in `content/blog/`).

## Design system

- `web/src/styles/brand.css` is the whole visual design (tokens, type scale, components) — the
  "clean" direction. It is the only stylesheet; import it, never anything else.
- Type: self-hosted Open Sans (variable, latin) at `web/public/fonts/`. Body 18px minimum — the
  audience skews senior, so legibility rules over density.
- Colour: navy `#20344F`, gold `#C68A3C` **on primary action buttons only**, green `#34704F` for
  reassurance marks only, ink `#22303D` for all body text. No grey body text.

## Compliance (non-negotiable on any Medicare-facing page)

- No superlatives ("best", "#1"), no premium/price figures, no plan-specific benefit promises, and
  never promise an instant quote.
- Every phone display carries: "Calling connects you with Lisa, a licensed insurance agent."
- The generic (no-numbers) TPMO footer disclaimers in `components/SiteFooter.astro` ship verbatim
  sitewide.
