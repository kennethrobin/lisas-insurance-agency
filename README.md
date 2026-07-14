# Lisa's Insurance Agency

Working repo for the rebuild of [lisasinsuranceagency.com](https://www.lisasinsuranceagency.com) —
research, planning, and the new website. Private.

The current site is on Weebly/InsuranceSplash. We're replacing it with an Astro site built on a
consolidated information architecture (61 URLs → 36 canonical pages).

## Layout

| Path | What's in it |
|---|---|
| `docs/` | Research and planning. The information architecture / sitemap lives here. |
| `web/` | The new website. Astro, static output. |
| `sitemap-site/` | Standalone static page that renders the sitemap visually. Deployed to Vercel for sharing. |

Non-web work (research, audits, notes) goes in `docs/` so it's readable without running anything.

## Key documents

- **[docs/information-architecture.md](docs/information-architecture.md)** — the plan of record. New
  navigation, full sitemap tree, the 301 redirect map from every old URL, and the SEO rules to bake
  into the build. `web/src/data/site.ts` is the code version of this doc; **keep them in sync.**
- **docs/sitemap-visual.html** — the same sitemap, visual. Open it in a browser.

The core decision behind everything: **one canonical page per product.** The old site split each
product across an info page *and* a quote page (sometimes four URLs for one product), which buried
the nav and split its Google ranking across duplicate pages. Now a quote is an action *on* the
product page, never a separate URL.

## Running the website

Requires Node ≥ 22.12 ([mise](https://mise.jdx.dev) will pick the pinned version up from
`mise.toml` automatically; otherwise install it yourself).

```bash
cd web
npm install
npm run dev     # http://localhost:4321
npm run build   # static output to web/dist/
```

### Where things are

```
web/src/
├── data/site.ts          # ← the IA as data: nav, footer, every route. Edit this to change the nav.
├── components/Header.astro   # utility bar + main nav + dropdowns
├── components/Footer.astro   # footer, doubles as an HTML sitemap
├── layouts/Base.astro        # <head>, canonical URL, skip link
└── pages/
    ├── index.astro
    ├── 404.astro
    └── [...slug].astro   # generates a placeholder for every route in site.ts
```

**Current state: navigation only.** Every page except the homepage is a placeholder generated from
`site.ts`, so the whole nav is clickable and reviewable, but no real content or visual design exists
yet. To build a page for real, add it as its own file under `src/pages/` — a real file takes
precedence over the `[...slug]` catch-all, so pages can be built one at a time without breaking the
rest of the nav.

## Perception-First Design

`perception-first-design/` is a **clone of a third-party framework** we use to evaluate design work,
not our code — so it's gitignored rather than committed here. To get it:

```bash
git clone https://github.com/skovalik/perception-first-design.git
```

It's what produced the baseline audit of the current site (Overall 59/100) that the IA doc responds to.
