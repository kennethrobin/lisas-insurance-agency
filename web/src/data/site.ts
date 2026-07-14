/**
 * Single source of truth for the site's information architecture.
 * Mirrors docs/information-architecture.md — update both together.
 *
 * Rule from the IA: ONE canonical page per product. A quote is an action
 * on that page (on-page CTA/form), never a separate URL.
 */

export const site = {
  name: "Lisa's Insurance Agency",
  phone: '(972) 639-7639',
  phoneHref: 'tel:+19726397639',
  cta: { label: 'Get a Free Quote', href: '/get-a-quote' },
};

export type NavLink = {
  label: string;
  href: string;
  /** Short description shown on the placeholder page. */
  blurb?: string;
};

export type NavGroup = {
  /** Group heading inside a dropdown, e.g. "Health & Medical". */
  heading: string;
  links: NavLink[];
};

export type NavItem =
  | { label: string; href: string; groups?: never }
  | { label: string; href?: never; groups: NavGroup[] };

/** Slim utility bar — existing clients, pulled out of the prospect path. */
export const utilityNav: NavLink[] = [
  { label: 'Policyholder Service', href: '/policyholders' },
  { label: 'Agent Login', href: '/agent-login' },
];

/** Main prospect nav: 4 dropdowns + 1 link + CTA + always-visible phone. */
export const mainNav: NavItem[] = [
  {
    label: 'Insurance',
    groups: [
      {
        heading: 'Health & Medical',
        links: [
          { label: 'Health Insurance (Under-65)', href: '/health-insurance' },
          { label: 'Short-Term Medical', href: '/short-term-medical' },
          { label: 'Long-Term Care', href: '/long-term-care' },
        ],
      },
      {
        heading: 'Supplemental',
        links: [
          { label: 'Dental Insurance', href: '/dental-insurance' },
          { label: 'Vision Insurance', href: '/vision-insurance' },
          { label: 'Critical Illness', href: '/critical-illness' },
          { label: 'Accident', href: '/accident-insurance' },
        ],
      },
      {
        heading: 'Life',
        links: [{ label: 'Life & Final Expense', href: '/life-insurance' }],
      },
    ],
  },
  {
    label: 'Medicare',
    groups: [
      {
        heading: 'Start here',
        links: [{ label: 'Medicare Overview', href: '/medicare' }],
      },
      {
        heading: 'Plans',
        links: [
          { label: 'Medicare Advantage', href: '/medicare/advantage' },
          { label: 'Medicare Supplement (Medigap)', href: '/medicare/supplement' },
          { label: 'Part D (Prescription Drugs)', href: '/medicare/part-d' },
        ],
      },
      {
        heading: 'Learn',
        links: [
          { label: 'Medicare Education', href: '/medicare/education' },
          { label: 'Medicare Resources', href: '/medicare/resources' },
        ],
      },
    ],
  },
  {
    label: 'About',
    groups: [
      {
        heading: 'Our Agency',
        links: [
          { label: 'Meet Lisa', href: '/about' },
          { label: 'Our Carriers', href: '/carriers' },
          { label: 'Refer a Friend', href: '/refer-a-friend' },
          { label: 'Contact', href: '/contact' },
        ],
      },
    ],
  },
  { label: 'Reviews', href: '/reviews' },
];

/** Footer doubles as an HTML sitemap for crawlers + humans. */
export const footerNav: NavGroup[] = [
  {
    heading: 'Plans',
    links: [
      { label: 'Health Insurance', href: '/health-insurance' },
      { label: 'Short-Term Medical', href: '/short-term-medical' },
      { label: 'Long-Term Care', href: '/long-term-care' },
      { label: 'Dental Insurance', href: '/dental-insurance' },
      { label: 'Vision Insurance', href: '/vision-insurance' },
      { label: 'Critical Illness', href: '/critical-illness' },
      { label: 'Cancer Insurance', href: '/cancer-insurance' },
      { label: 'Heart Attack & Stroke', href: '/heart-attack-stroke-insurance' },
      { label: 'Accident Insurance', href: '/accident-insurance' },
      { label: 'Life & Final Expense', href: '/life-insurance' },
    ],
  },
  {
    heading: 'Medicare',
    links: [
      { label: 'Medicare Overview', href: '/medicare' },
      { label: 'Medicare Advantage', href: '/medicare/advantage' },
      { label: 'Medicare Supplement', href: '/medicare/supplement' },
      { label: 'Part D', href: '/medicare/part-d' },
      { label: 'Medicare Education', href: '/medicare/education' },
      { label: 'Medicare Resources', href: '/medicare/resources' },
    ],
  },
  {
    heading: 'Agency',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Reviews', href: '/reviews' },
      { label: 'Our Carriers', href: '/carriers' },
      { label: 'Refer a Friend', href: '/refer-a-friend' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
      { label: 'Get a Quote', href: '/get-a-quote' },
    ],
  },
  {
    heading: 'Policyholder Service',
    links: [
      { label: 'Service Hub', href: '/policyholders' },
      { label: 'Proof of Insurance', href: '/policyholders/proof-of-insurance' },
      { label: 'Policy Changes', href: '/policyholders/policy-changes' },
      { label: 'Policy Review', href: '/policyholders/policy-review' },
      { label: 'Update Info', href: '/policyholders/update-info' },
      { label: 'Documents', href: '/policyholders/documents' },
      { label: 'Contact My Carrier', href: '/policyholders/contact-carrier' },
    ],
  },
];

export const legalNav: NavLink[] = [
  { label: 'Accessibility', href: '/accessibility' },
  { label: 'Privacy', href: '/privacy' },
];

/**
 * Every canonical route, used to generate placeholder pages so the whole
 * navigation is clickable. `title` becomes the <h1>; `note` explains what
 * the page is for and which legacy URLs 301 into it.
 */
export type PageStub = { path: string; title: string; note: string };

export const pageStubs: PageStub[] = [
  { path: '/get-a-quote', title: 'Get a Free Quote', note: 'Single quote hub with a plan-type selector. Replaces quotes, other-quotes, and free-consultation.' },

  { path: '/health-insurance', title: 'Health Insurance', note: 'Includes under-65 medical. Absorbs 4 legacy URLs including the separate quote pages.' },
  { path: '/short-term-medical', title: 'Short-Term Medical', note: 'Absorbs short-term-medical + its separate quote page.' },
  { path: '/long-term-care', title: 'Long-Term Care', note: 'Absorbs long-term-care + its separate quote page.' },
  { path: '/dental-insurance', title: 'Dental Insurance', note: 'Own page with unique depth — distinct search intent from vision. Absorbs dental-plans + b-dental-insurance-quote.' },
  { path: '/vision-insurance', title: 'Vision Insurance', note: 'Own page with unique depth — distinct search intent from dental. Absorbs vision-only-plan + b-vision-insurance-quote.' },
  { path: '/critical-illness', title: 'Critical Illness Insurance', note: 'Pillar page. Links down to cancer and heart-attack/stroke.' },
  { path: '/cancer-insurance', title: 'Cancer Insurance', note: 'Spoke under critical illness.' },
  { path: '/heart-attack-stroke-insurance', title: 'Heart Attack & Stroke Insurance', note: 'Spoke under critical illness.' },
  { path: '/accident-insurance', title: 'Accident Insurance', note: 'Currently orphaned on the live site — this surfaces it in the nav.' },
  { path: '/life-insurance', title: 'Life & Final Expense Insurance', note: 'Consolidates 4 legacy final-expense/life URLs into one canonical page.' },

  { path: '/medicare', title: 'Medicare', note: 'Pillar/overview. Hub-and-spoke: links down to every Medicare page, each links back up.' },
  { path: '/medicare/advantage', title: 'Medicare Advantage', note: 'Spoke. Needs a BreadcrumbList schema.' },
  { path: '/medicare/supplement', title: 'Medicare Supplement (Medigap)', note: 'Spoke. Needs a BreadcrumbList schema.' },
  { path: '/medicare/part-d', title: 'Medicare Part D', note: 'Prescription drug plans. Spoke.' },
  { path: '/medicare/education', title: 'Medicare Education', note: 'Guides. Build out aggressively — this is the topical-authority engine for national organic traffic.' },
  { path: '/medicare/resources', title: 'Medicare Resources', note: 'Curated links.' },

  { path: '/about', title: 'Meet Lisa', note: 'Merges about, staff-directory, and the photo gallery.' },
  { path: '/carriers', title: 'Our Carriers', note: 'Carrier logos as authority proof.' },
  { path: '/refer-a-friend', title: 'Refer a Friend', note: '' },
  { path: '/contact', title: 'Contact', note: 'Also the 301 target for the retired financial-planning page.' },
  { path: '/reviews', title: 'Reviews', note: 'Highest-value trust page — promoted to top-level nav. Needs Review/AggregateRating schema.' },
  { path: '/blog', title: 'Blog', note: 'Content hub for SEO. Was news/.' },

  { path: '/policyholders', title: 'Policyholder Service', note: 'Existing-client hub. Lives in the utility bar and footer, out of the prospect conversion path.' },
  { path: '/policyholders/proof-of-insurance', title: 'Proof of Insurance', note: '' },
  { path: '/policyholders/policy-changes', title: 'Policy Changes', note: '' },
  { path: '/policyholders/policy-review', title: 'Policy Review', note: '' },
  { path: '/policyholders/update-info', title: 'Update My Info', note: '' },
  { path: '/policyholders/documents', title: 'Online Documents', note: '' },
  { path: '/policyholders/contact-carrier', title: 'Contact My Carrier', note: '' },
  { path: '/agent-login', title: 'Agent Login', note: 'Utility-bar link. Likely an external carrier/agency portal rather than a real page.' },

  { path: '/accessibility', title: 'Accessibility Statement', note: 'Keep — legal.' },
  { path: '/privacy', title: 'Privacy Policy', note: 'New page. Missing on the current site; needed for trust + compliance.' },
  { path: '/thank-you', title: 'Thank You', note: 'Form confirmation. Must be noindex.' },
];
