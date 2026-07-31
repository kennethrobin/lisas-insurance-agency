# Mobile design notes

Companion to `docs/mobile-audit.md` (the Phase 0 recon that this responds to).
Branch `feat/mobile-layout`. Desktop (≥1024px) is unchanged: verified by
pixel-diffing all 14 routes at 1024 and 1440 against a pre-change baseline
built through the identical pipeline — **0 differing pixels**.

---

## How this is organised in the code

Everything lives in one clearly-marked layer at the end of
`web/src/styles/brand.css`, entirely inside `max-width` queries. That is not
tidiness for its own sake: the site is authored **mobile-first**, so the base
layer of every grid is already `1fr` and multi-column arrives additively at
`min-width` 640 / 900 / 1024. Editing the base layer to improve mobile would
necessarily change desktop; adding a `max-width` layer cannot.

Three bands:
- **≤767 — phone.** Its own type scale, spacing scale and block layouts.
- **768–1023 — tablet.** Shares the legibility floors, gets its own hero scale.
- **≤1023 — both.** The 13px floor, tap targets, focus ring, chrome, and the
  200%-zoom robustness rules.

All new components are written against the existing `--surface-*` variables
rather than literal colours, so they recolour themselves correctly on the navy
panels the way every other component does.

---

## Final type scale (≤767)

| Role | Size | Line-height | Tracking | Notes |
|---|---|---|---|---|
| Hero `.display-xl` | 44px | 1.04 | −0.02em | was **32px** |
| Interior `h1` | 38px | 1.06 | −0.02em | was 38.4px (unchanged in effect) |
| Section `h2` | 30px | 1.10 | −0.015em | was 30.4px @ −0.022em |
| Hero `.display-tail` | 19px | 1.35 | −0.005em | |
| Card / sub `h3` | 21px | 1.22 | −0.005em | was 19.2px |
| Lead / page intro / hero sub | 19px | 1.50 | 0 | was 18.4px |
| Body | **18px** | 1.60 | 0 | **not 17px — see divergences** |
| Card & step copy | 18px | 1.60 | 0 | was 16.3px |
| Eyebrow / all labels | **13px** | — | 0.12em, uppercase | was 10.88–12.8px |
| Micro / legal | 14px | 1.50 | 0 | already above the floor |

Tablet (768–1023) takes the same scale except the hero, which goes to **56px**
— it was still pinned to the 32px clamp floor at 768 while the interior `h1`
beside it rendered at 46px.

**Boldness is spent once.** The hero is the only genuinely oversized moment;
`h2` holds one size all the way down the page and never competes with it.

**Tracking loosens as size drops.** The display cut runs at −0.035em, which is
correct at 80px and looks broken at 30px. Tight tracking is a function of size,
not of brand.

**The 13px floor is the single biggest change here.** The audit found 440
instances of rendered text below it, every one a small-caps label — eyebrows and
field labels at 11.52px, carrier tags at 10.88px. `CLAUDE.md` already commits to
"Body 18px minimum — the audience skews senior, so legibility rules over
density"; the labels simply never got the same rule.

---

## Final spacing scale (≤767)

**Section padding**: 72px standard · 88px at major transitions · never below 56.
Applied as 88px on the first content section after the trust band and on the
closing CTA band; 72px everywhere else; the trust band itself carries 40px.

**Side gutter**: 8px panel gutter + 16px container padding = **24px to the text**
(was 28px). The panel geometry is why this isn't the flat 20/24 originally
proposed — see divergences.

**Inside a section** (every authored gap capped at 32px):
- eyebrow → heading: 16
- heading → lead: 16
- section head → content: 32
- body → CTA: 28
- card → card: 12
- list row → list row: 0, with a hairline rule

### The ratio rule, measured

> The gap between two sections must be at least 2.5× the largest gap inside one.

Measured at 390px on `/` with `npm run audit:rhythm`:

```
before   between: 62, 88, 124, 124, 124, 124, 124, 124, 124   inside max: 36   → 1.72x  FAIL
after    between: 82, 140, 156, 156, 156, 156, 156, 156, 172  inside max: 32   → 2.56x  PASS
```

The before state was not "bunched" so much as **uniform**: 124px at seven of
nine boundaries, with the two that should have been strongest (out of the hero,
out of the trust band) the two weakest. The after state has an actual hierarchy
— the hero's tail is tight, chapter breaks are wide, the close is widest.

---

## Per-block decisions

**Hero** — content budget is headline, one subordinate line, one review, one
sub-paragraph. The quick-start form moved out (below). `margin-block: auto` was
centring the headline, which reads as poise on a wide desktop hero and opened a
~150px hole on a 390px one; the text block now bottoms out and the slack
collects at the top over the photography. The three rotating reviews were
*already* a cross-fade of one visible quote at a time, so no change was needed
there. `100vh` is dropped rather than kept as a fallback: on browsers without
`svh` it is the *large* viewport, i.e. precisely the value that makes an iOS
hero overflow and the page jump on first scroll. Without it the hero is sized by
its content — never cropped, which is a better failure mode than the alternative.

**Needs selector** — four full-width 56px radio rows, 8px apart, with the
existing "Get free help" button beneath. This is a second copy of the hero's
`.quickstart`, not a move: CSS cannot relocate a node between `<section>`s and
desktop is frozen. Exactly one of the two is ever rendered (`display: none`
removes the other from the accessibility tree too), and the ids are namespaced.

**Trust bar** — 2×2 with hairline dividers, 13px uppercase. Four full-width rows
gave a reassurance strip the weight of a content section.

**Medicare Supplement vs Advantage** — two full-bleed stacked cards with the same
internal rhythm, so they still read as a comparison rather than two unrelated
adjacent cards.

**Why Lisa (and About's "How I work")** — **the biggest win.** Four generous
cards ran ~1,200px for four one-line claims: a screen and a half of scrolling
that reads like a form. Now a divided list — hairline rule, 21px label, body
copy — at roughly 40% of the height, scannable in one pass. The decorative
`aria-hidden` icon tiles were the single largest contributor to the height and
are dropped on mobile.

**Coverage tiles** — `min-height: 320px` plus a floor-anchored button opened a
visible void between copy and action on every tile whose copy was short. On a
phone the tile is already full width, so nothing needs equalising.

**How it works** — a vertical timeline: oversized accent numeral to the left, a
connecting rule running down through the sequence, content to the right. Three
steps in a fixed order is a genuine sequence, so the numbering earns its place.

**Reviews** — horizontal snap carousel with ~32px peek of the next card plus
dots. Homogeneous, optional, read-one-and-move-on content is the one place on
this page where a carousel is the right answer. The dots are built in JS as a
progressive enhancement and labelled from each review's own attribution, so no
new copy is introduced.

**FAQ / accordions** — all collapsed by default (already true — the component
ships `<details>` with no `open`), 56px minimum rows, `+`/`−` affordance clear
of the text.

**Carrier marquee** — kept, slowed from 38s to 64s. A phone-width window turns
the same strip over roughly three times as fast as a desktop one, because the
distance is fixed and the window is a third as wide. Wrapper is `100%`-safe,
never `100vw`. Stops dead under `prefers-reduced-motion` (pre-existing).

**Contact form** — single column, 52px fields, visible labels above every input
(never placeholder-only), full-width 56px submit. Inputs stay at 16.8px, which
is already above the 16px threshold that triggers iOS zoom-on-focus.

**Dental comparison table** — below 768 it stops being a table and becomes one
card per comparison, with each cell labelled by its column from a `data-label`
attribute. Same data, same order, no copy changed, no horizontal scroll. The
attributes render nothing above 768, so the desktop table is untouched.

**Header** — the compact treatment (icon-only phone pill, icon-only menu) now
applies to 520px rather than 400px, because the full row measurably needs ~495px.

**Menu** — full-screen overlay below 1024: `position: fixed; inset: 0`, 28px nav
rows, the call action pinned above `env(safe-area-inset-bottom)`, body scroll
lock that preserves and restores scroll position, focus trap, Escape to close,
`aria-expanded` + `aria-controls` (pre-existing), closes on navigation.

**Sticky call bar** — appears once the hero leaves the viewport
(IntersectionObserver on the hero, not a scroll-position number), hides again
while the contact section is in view so it can never cover the form's submit
button, and reserves its own height at the foot of the page plus
`scroll-padding-bottom` so anchor jumps don't land behind it.

**Footer** — the two link groups collapse to `<details>` accordions below 768.
The contact block (phone, email, hours) is above them and never collapses.

---

## Where this diverges from the brief, and why

1. **Body stays 18px, not 17px.** `CLAUDE.md` makes 18px a non-negotiable floor
   for this audience. A round number in a type scale does not outrank a
   standing project rule about legibility for 65-year-olds.

2. **The hero type went UP, not down.** The brief predicted display type was
   "still oversized relative to the gutters" at 390px. Measured, the hero was
   rendering at **32px** — not an oversized grotesque, a large paragraph. The
   brand's one big moment was *missing* on mobile, not overblown. It is now 44px,
   which is the brief's own target.

3. **Side gutter is 24px, not 20/24.** This is a panel system — every section is
   a rounded card floating on the page with a gutter *outside* it and container
   padding *inside* it. 20px total would mean ~12px of inner padding against a
   22px corner radius. 24px total (8 + 16) is the closest honest equivalent.

4. **No mobile-only alternating ground was added** — it already exists. The page
   alternates white and navy panels via `.section--navy` at every width, so the
   proposed device is in place and duplicating it would do nothing. Section
   *labels* were already pinned at each block's top edge as eyebrows.

5. **No contrast changes.** There is no lime or spring-green accent in this
   repo. The accent is gold `#C68A3C`, used only on primary pills, and it
   already carries dark ink text (`#3A2708`, 4.82:1) rather than white (which
   would fail at 2.96:1) — exactly the remedy the brief prescribes. Every brand
   pair clears AA; the numbers are in the audit doc.

6. **No cal.com theming.** There is no cal.com embed. `links.booking` is an
   unfilled `'#'` TODO and every "Schedule a call" control already falls back to
   tap-to-call via `scheduleCta()`. Left as-is per the no-TODO-filling rule.

7. **No consent checkbox was added.** The brief refers to a
   `[TODO: consent wording pending compliance review]` placeholder in the
   contact form. It does not exist — the form is name / phone / topic / submit.
   Adding a checkbox would mean authoring consent copy, which is both a copy
   change and a compliance decision, and is out of scope on both counts.

8. **The dental chart is 6×3, not 7 carriers × 4 columns**, and it compares two
   *enrolment paths* rather than carriers — deliberately, because inventing a
   grid of annual maximums and waiting periods is exactly the made-up benefit
   detail that must not ship. The per-card transform still applies; it yields
   one card per comparison row, which keeps the two paths legible side by side.

9. **The Medigap chart keeps its horizontal scroller.** This is the real 10×11
   table, and it reproduces the federal standardised benefit grid verbatim.
   Transposing it to one card per plan would be 100 label:value rows — worse
   than a scroller with a pinned benefit column, and it would restructure
   published compliance data. Flagged as a follow-up instead.

10. **One overflow bug, not a hunt.** The brief anticipated a list of offenders.
    There was exactly one, and it was significant: the header overflowed by up
    to 85px between 401px and 495px — the iPhone Plus / Pro Max band — hidden
    entirely by `body { overflow-x: clip }`.

---

## Deliberately left alone

- **`body { overflow-x: clip }`** stays. It is a legitimate safety net; the
  problem was never the rule, it was that nothing ever looked behind it. The
  audit now measures element rects and explicitly refuses to treat `<body>` as
  a legitimate clipper, so the net can no longer hide anything.
- **Sub-13px labels and the 42px wordmark at ≥1024** remain, because desktop is
  frozen. They are pre-existing and identical to baseline. Lifting the 13px
  floor to desktop is the first thing worth doing next.
- **All TODO placeholders** in `links.ts`, the `[CONFIRM]` cells, `[X.X] Google
  rating` and the `ASSET PENDING` frames.
- **Every compliance string**: the TPMO disclaimers, the state-availability
  lines, and the "Calling connects you with Lisa, a licensed insurance agent."
  microline, which now simply wraps rather than being `nowrap` at some widths.
- **The desktop drawer.** brand.css records a deliberate decision against body
  scroll lock, because locking removed the page scrollbar and shifted the layout
  ~15px. That reasoning holds at desktop widths and the lock is scoped to the
  widths where the overlay actually exists.
- **Zero copy changes.** The needs selector and the drawer's call action reuse
  strings already on the page character-for-character.

---

## Verification

`web/scripts/mobile-audit.mjs` — every route × [360, 390, 430, 768, 1024, 1440]:
horizontal overflow (with the offending elements listed), sub-44px tap targets,
sub-13px text, full-page screenshot, plus a pixelmatch desktop regression diff.
`--zoom=2` re-runs the whole thing at 200% text zoom.

**Run it against the built output, not the dev server.** `astro dev` injects the
dev toolbar, whose notification badge varies between runs; that alone produced a
phantom 4px "regression" on every route and a 3,666px one on
`/medicare/supplement`. Against `astro preview` the same comparison is a clean
zero.

```
                      <=1023                        >=1024 (frozen)
baseline   overflow 42  tap 66  font 284     overflow 0  tap 20  font 156
after      overflow  0  tap  0  font   0     overflow 0  tap 20  font 156
after @2x  overflow  0  tap  0  font   0     overflow 14 tap  0  font   0

desktop regression: 0 differing pixels (14 routes x 1024 and 1440)
```

The `>=1024` column is identical before and after by design. The 14 overflow
elements at ≥1024 under 200% zoom are pre-existing and cannot be fixed without
touching frozen CSS.

---

## Addendum — the contact form (after the layout pass)

The "0 differing pixels" result above describes the **layout pass only**. A
separate fix afterwards deliberately changes desktop, so that number no longer
holds for the current branch and this note records why.

The contact form in `CtaBand.astro` had no `action` and no `method`. Its submit
handler called `preventDefault()`, hid the form, and displayed *"Thank you — I
got your note. I'll call you back within one business day. — Lisa"*. No request
was ever made, and the site is a static build with no adapter, no API route and
no backend dependency, so there was nothing for it to post to. Every submission
was discarded behind a false confirmation.

It now follows the rule `links.ts` already states — *"Nothing on this site is
allowed to look clickable and do nothing"* — and the pattern `Subscribe.astro`
already implements: while `links.contactEndpoint` is `'#'` the card renders an
honest note plus the call and text actions, and the form does not render at all.
Filling in one value in `links.ts` turns it back into a real form that POSTs
natively (and therefore works without JS).

Measured consequence, versus the frozen baseline:

```
15 desktop screenshots differ, on the 8 routes that render CtaBand.
Each diff is a single rectangle — the contact card in the CTA grid's right
column: ~412x407px at 1024, ~522x417px at 1440. Nothing outside it changed.
Pages are marginally shorter (e.g. /privacy 2234px -> 2203px).
Sub-13px text at >=1024 drops 156 -> 134: the form's 11.52px field labels
are gone with it.
```

Mobile gates are unaffected and still clean at 360/390/430/768.
