# Lisa's Insurance Agency — Information Architecture & Sitemap

Planning doc for the Astro rebuild. Replaces the current Weebly/InsuranceSplash site.
Baseline audit: PFD Overall 59/100. This doc addresses the L0 (navigation load) and SEO
findings. Source data: live `sitemap.xml` = **61 URLs** (audited 2026-07-10).

---

## 1. The core problem: one product = many competing URLs

The current site splits almost every product into a separate **info** page and **quote** page
(sometimes 3–4 variants). Two failures at once:

- **Usability (PFD L0 — Cowan 2010, Hick 1952):** the nav exposes the whole product set *twice*
  (a "Quotes" tree and a near-identical "Insurance" tree), each nested 3 levels deep — ~40 menu
  targets, most adding no new destination.
- **SEO (keyword cannibalization):** `dental-insurance` + `dental-plans` + `b-dental-insurance-quote`
  all target the same intent, so Google splits link equity across them and ranks none of them well.

**Fix:** ONE canonical page per product. The quote is an *action on that page* (on-page CTA / form),
never a separate URL. Result: **61 URLs → ~30 canonical pages**; every product goes from 2–4 URLs to 1.

---

## 2. New primary navigation

Header has two rows: a slim utility bar (existing clients) and the main prospect nav.

```
┌ utility bar (small, right-aligned) ─────────────────────────────────────────┐
│                         Current client? → Policyholder Service  ·  Agent Login │
├ main nav ────────────────────────────────────────────────────────────────────┤
│  [LOGO]   Insurance ▾   Medicare ▾   About ▾   Reviews    [ Get a Free Quote ] │
│                                                    ☎ (972) 639-7639            │
└────────────────────────────────────────────────────────────────────────────────┘
```

- 4 nav dropdowns + 1 link + 1 primary CTA + always-visible phone. Logo = Home (convention; saves a slot).
- Phone stays visible on every page — the Medicare audience skews older and call-preferring (PFD L4).
- Policyholder self-service is pulled OUT of the prospect path into the utility bar, so it doesn't
  dilute the conversion path (PFD L4 — one dominant action).

### Dropdown contents (each links to ONE page that has its own quote CTA)

**Insurance ▾** — grouped for scannability (Gestalt/proximity, Wertheimer 1923)
- *Health & Medical:* Health Insurance (Under-65) · Short-Term Medical · Long-Term Care
- *Supplemental:* Dental Insurance · Vision Insurance · Critical Illness · Accident
- *Life:* Life & Final Expense

**Medicare ▾** — its own top-level cluster (highest-volume, distinct-intent category)
- *Start here:* Medicare Overview
- *Plans:* Medicare Advantage · Medicare Supplement (Medigap) · Part D (Prescription Drugs)
- *Learn:* Medicare Education · Medicare Resources

**About ▾**
- Meet Lisa / Our Agency · Our Carriers · Refer a Friend · Contact

**Reviews** — top-level link (highest-value trust page; deserves prominence, PFD L3)

### Footer (doubles as HTML sitemap for crawlers + humans)
- **Plans:** every product page
- **Medicare:** every Medicare page
- **Agency:** About · Reviews · Our Carriers · Refer a Friend · Contact · Get a Quote
- **Policyholder Service:** Proof of Insurance · Policy Changes · Update Info · Documents · Contact My Carrier
- **Contact / legal:** phone · branded email · Mansfield TX address · hours · social · Accessibility · Privacy · Agent Login

---

## 3. Sitemap tree

```
/                                   Home
├── /get-a-quote                    Single quote hub (plan-type selector) — was quotes + other-quotes
│
├── Insurance
│   ├── /health-insurance           incl. Under-65 medical
│   ├── /short-term-medical
│   ├── /long-term-care
│   ├── /dental-insurance
│   ├── /vision-insurance
│   ├── /critical-illness           pillar
│   │   ├── /cancer-insurance
│   │   └── /heart-attack-stroke-insurance
│   ├── /accident-insurance         (currently orphaned — surface it)
│   └── /life-insurance             incl. final expense
│
├── Medicare
│   ├── /medicare                   pillar / overview
│   ├── /medicare/advantage
│   ├── /medicare/supplement
│   ├── /medicare/part-d
│   ├── /medicare/education         guides (SEO topical authority)
│   └── /medicare/resources         curated links
│
├── About
│   ├── /about                      Meet Lisa (merges staff-directory + photo gallery)
│   ├── /carriers                   carrier logos = authority proof (PFD L3)
│   ├── /refer-a-friend
│   └── /contact
│
├── /reviews                        was client-testimonials
├── /blog                           was news/ — content hub for SEO
│
├── Policyholder Service (utility bar + footer, not main nav)
│   ├── /policyholders              hub
│   ├── /policyholders/proof-of-insurance
│   ├── /policyholders/policy-changes
│   ├── /policyholders/policy-review
│   ├── /policyholders/update-info
│   ├── /policyholders/documents
│   └── /policyholders/contact-carrier
│
└── Utility / legal
    ├── /accessibility              keep (legal)
    ├── /thank-you                  form confirmation (noindex)
    ├── /privacy                    ADD (trust + compliance; currently missing)
    └── 404                         from invalid.html
```

---

## 4. URL consolidation & 301 redirect map

**Every** old URL below must 301-redirect to its new canonical page — this transfers ranking
signal and ends the cannibalization. Old `…-quote.html` pages fold into the product page's on-page form.

| New canonical page | Old URLs to 301 → new |
|---|---|
| `/` | `index.html` |
| `/get-a-quote` | `quotes.html`, `other-quotes.html`, `free-consultation.html` |
| `/health-insurance` | `health-insurance.html`, `health-insurance-quote.html`, `under-65-medical-insurance.html`, `under-65-medical-plan-quote.html` |
| `/short-term-medical` | `short-term-medical.html`, `short-term-medical-plan-quote.html` |
| `/long-term-care` | `long-term-care.html`, `long-term-care-plan-quote.html` |
| `/dental-insurance` | `dental-insurance.html`, `dental-plans.html`, `b-dental-insurance-quote.html` |
| `/vision-insurance` | `vision-insurance.html`, `vision-only-plan.html`, `b-vision-insurance-quote.html` |
| `/critical-illness` | `critical-illness-insurance.html`, `critical-illness-insurance-quote.html` |
| `/cancer-insurance` | `cancer-insurance.html`, `cancer-plan-quote.html` |
| `/heart-attack-stroke-insurance` | `heart-attack-or-stroke-insurance.html`, `heart-attack-or-stroke-plan-quote.html` |
| `/accident-insurance` | `accident-insurance.html`, `accident-insurance-quote.html` |
| `/life-insurance` | `final-expense-insurance.html`, `final-expenselife-insurance.html`, `final-expense-life-insurance-quote.html`, `final-expense-insurance-quote.html` |
| `/medicare` | `medicare-options.html`, `medicare-options1.html` |
| `/medicare/advantage` | `medicare-advantage-plans.html`, `medicare-advantage-plan-quote.html` |
| `/medicare/supplement` | `medicare-supplement-coverage.html`, `medicare-supplement-coverage-quote.html` |
| `/medicare/part-d` | `medicare-prescription-drug-plan.html`, `medicare-prescription-drug-plan-quote.html` |
| `/medicare/education` | `medicare-education.html` |
| `/medicare/resources` | `medicare-resource-links.html` |
| `/about` | `about.html`, `staff-directory.html`, `agency-photo-gallery.html` |
| `/carriers` | `insurance-carriers.html` |
| `/reviews` | `client-testimonials.html` |
| `/contact` | `contact.html` |
| `/refer-a-friend` | `refer-a-friend.html` |
| `/blog` | `news.html`, `news/lisas-insurance-agency-news-and-updates` |
| `/policyholders` | `service.html` |
| `/policyholders/proof-of-insurance` | `proof-of-insurance.html` |
| `/policyholders/policy-changes` | `policy-changes.html` |
| `/policyholders/policy-review` | `policy-review.html` |
| `/policyholders/update-info` | `update-contact-info.html` |
| `/policyholders/documents` | `online-documents.html` |
| `/policyholders/contact-carrier` | `contact-my-carrier.html` |
| `/accessibility` | `accessibility-statement.html` |
| `/thank-you` | `thank-you.html` |
| `/contact` (retire) | `financial-planning.html` → 301 to `/contact` (not offered) |

`invalid.html` → replace with a real 404 page.

---

## 5. SEO notes to bake into the Astro build

**Strategy: nationwide → compete on product/topic keywords, not geography.** Lisa sells nationwide,
so the SEO engine is topical depth per product line, not local doorway pages.

1. **One page per intent.** Canonical URL per product kills cannibalization; consolidated pages rank
   stronger than 3 thin ones. Set `<link rel="canonical">` on every page.
2. **Dental & Vision = two separate pages** (`/dental-insurance`, `/vision-insurance`). Distinct search
   intents/keywords. Each needs its own unique, non-overlapping content depth to avoid reading as thin —
   different coverage details, use cases, carriers, and FAQs on each.
3. **Medicare topical cluster:** the `/medicare` pillar links down to Advantage/Supplement/Part-D/
   Education spokes, and each spoke links back up. This hub-and-spoke is the strongest SEO structure
   here — Medicare is the highest-intent, highest-volume line. Build out `/medicare/education` guides
   aggressively; educational Medicare content wins national organic traffic.
4. **Nationwide, not local:** de-emphasize "Mansfield, TX" in titles/H1s — target product keywords
   instead. Keep ONE Google Business Profile for the physical office (still a trust + branded-search
   asset) but don't build per-city pages. **Compliance/trust:** show a "Licensed in [N] states" signal
   and, if useful later, a states-served page — real content, never thin state doorway pages.
5. **Titles/H1:** current homepage title is redundant ("…by Lisa's Insurance Agency" twice) and pages
   have no `<h1>`. Every page gets one `<h1>` and a unique product-keyword `<title>`, e.g.
   `Dental Insurance Plans & Quotes | Lisa's Insurance Agency`,
   `Medicare Supplement (Medigap) Plans Explained | Lisa's Insurance Agency`.
6. **Schema:** `InsuranceAgency` with `areaServed` = US (list licensed states), `BreadcrumbList` (on the
   nested Medicare + critical-illness pages), `FAQPage` on product pages, `Review`/`AggregateRating`
   on `/reviews`.
7. **Technical:** generate a clean `sitemap.xml` (Astro integration) with only canonical URLs;
   `robots.txt`; fix the malformed viewport meta; branded email (replace `lisa.picou@hotmail.com`).
8. **Migration safety:** ship all 301s at launch and keep them permanently. Re-submit the new
   sitemap in Google Search Console. Expect a short ranking dip, then recovery as equity consolidates.
```
