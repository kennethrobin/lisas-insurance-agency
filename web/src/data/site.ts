/**
 * Single source of truth for the site's information architecture.
 * Mirrors docs/information-architecture.md — update both together.
 *
 * Rule from the IA: ONE canonical page per product. A quote is an action
 * on that page (on-page CTA/form), never a separate URL.
 *
 * The tree below is the built-out site: two audiences (under-65 health, and
 * Medicare), dental & vision alongside them, and everything else retired.
 * Header and footer both render from these arrays — nothing hard-codes a link.
 */

export const site = {
  name: "Lisa's Insurance Agency",
  phone: '(972) 639-7639',
  phoneHref: 'tel:+19726397639',
  smsHref: 'sms:+19726397639',
  email: 'lisa@lisasinsuranceagency.com',
};

export type NavLink = {
  label: string;
  href: string;
  /** Short description shown on the placeholder page. */
  blurb?: string;
};

export type NavItem =
  | { label: string; href: string; children?: never }
  | { label: string; href: string; children: NavLink[] };

/** Slim utility links — existing clients, kept out of the prospect path. */
export const utilityNav: NavLink[] = [
  { label: 'Policyholder Service', href: '/policyholders' },
  { label: 'Agent Login', href: '/agent-login' },
];

/**
 * Main nav. Medicare is the only group, and it is FLAT — five sibling pages,
 * no "Plans" hub in between. Contact is both a menu item and the header's
 * standing action, matching how the phone pill already behaves.
 */
export const mainNav: NavItem[] = [
  {
    label: 'Medicare',
    href: '/medicare',
    children: [
      { label: 'Overview', href: '/medicare' },
      { label: 'Medicare Advantage', href: '/medicare/advantage' },
      { label: 'Medicare Supplement', href: '/medicare/supplement' },
      { label: 'Prescription Drugs', href: '/medicare/prescription-drugs' },
      { label: 'Education', href: '/medicare/education' },
    ],
  },
  { label: 'Health Insurance', href: '/health-insurance' },
  { label: 'Dental & Vision', href: '/dental-insurance' },
  {
    label: 'About',
    href: '/about',
    children: [
      { label: 'Meet Lisa', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  { label: 'Contact', href: '/contact' },
];

/** Footer quick links — the prospect-facing pages, flattened. */
export const footerNav: NavLink[] = [
  { label: 'Health Insurance', href: '/health-insurance' },
  { label: 'Medicare', href: '/medicare' },
  { label: 'Medicare Advantage', href: '/medicare/advantage' },
  { label: 'Medicare Supplement', href: '/medicare/supplement' },
  { label: 'Prescription Drugs', href: '/medicare/prescription-drugs' },
  { label: 'Dental & Vision', href: '/dental-insurance' },
  { label: 'Meet Lisa', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export const legalNav: NavLink[] = [
  { label: 'Accessibility', href: '/accessibility' },
  { label: 'Privacy', href: '/privacy' },
];

/**
 * Routes that still render as IA placeholders. Every prospect-facing page is a
 * real file under src/pages/ now; what is left here is the existing-client and
 * legal tail, which has no designed content yet. `[...slug].astro` builds each
 * one on the brand shell so they still look like the rest of the site.
 */
export type PageStub = { path: string; title: string; note: string };

export const pageStubs: PageStub[] = [
  { path: '/policyholders', title: 'Policyholder Service', note: 'Existing-client hub. Lives in the footer, out of the prospect conversion path.' },
  { path: '/policyholders/proof-of-insurance', title: 'Proof of Insurance', note: '' },
  { path: '/policyholders/policy-changes', title: 'Policy Changes', note: '' },
  { path: '/policyholders/policy-review', title: 'Policy Review', note: '' },
  { path: '/policyholders/update-info', title: 'Update My Info', note: '' },
  { path: '/policyholders/documents', title: 'Online Documents', note: '' },
  { path: '/policyholders/contact-carrier', title: 'Contact My Carrier', note: '' },
  { path: '/agent-login', title: 'Agent Login', note: 'Footer link. Likely an external carrier/agency portal rather than a real page.' },

  { path: '/accessibility', title: 'Accessibility Statement', note: 'Keep — legal.' },
  { path: '/privacy', title: 'Privacy Policy', note: 'New page. Missing on the current site; needed for trust + compliance.' },
  { path: '/thank-you', title: 'Thank You', note: 'Form confirmation. Must be noindex.' },
];

/** Flat list of every real route, used to check nav links resolve. */
export const canonicalRoutes: string[] = [
  '/',
  '/health-insurance',
  '/medicare',
  '/medicare/advantage',
  '/medicare/supplement',
  '/medicare/prescription-drugs',
  '/medicare/education',
  '/medicare/resources',
  '/dental-insurance',
  '/about',
  '/contact',
  ...pageStubs.map((stub) => stub.path),
];

/**
 * Human label for a route, for the back control. Built from the IA above so a
 * renamed nav item renames the back link with it. Top-level nav wins over a
 * child of the same href: /medicare is "Medicare" in the menu and "Overview"
 * inside its own dropdown, and the back link wants the former.
 */
const routeLabels = new Map<string, string>([['/', 'Home']]);
for (const stub of pageStubs) routeLabels.set(stub.path, stub.title);
for (const link of footerNav) routeLabels.set(link.href, link.label);
for (const item of mainNav) {
  if (item.children) {
    for (const child of item.children) routeLabels.set(child.href, child.label);
  }
}
for (const item of mainNav) routeLabels.set(item.href, item.label);

export type ParentPage = { href: string; label: string };

/**
 * The logical parent of a route: one path segment up, bottoming out at Home.
 * Every page has a real ancestor this way, so the back control is always a
 * plain anchor and never has to fall back to session history.
 */
export function parentOf(path: string): ParentPage {
  const segments = path.replace(/\/+$/, '').split('/').filter(Boolean);
  const href = segments.length > 1 ? '/' + segments.slice(0, -1).join('/') : '/';
  return { href, label: routeLabels.get(href) ?? 'Home' };
}
