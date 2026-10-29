/**
 * Permanent (301) redirects from the old Weebly/InsuranceSplash site.
 *
 * Every URL in the old site's sitemap.xml (61 URLs, re-checked 2026-10-12) maps
 * to the closest page on the new site, so old Google results, bookmarks and
 * links keep working and their search ranking carries over. Keep these
 * permanently; never delete a line once it is live.
 *
 * Products Lisa no longer sells (short-term medical lives on inside the Health
 * Insurance page; long-term care, cancer, critical illness, heart attack &
 * stroke, accident and final expense are retired) go to the homepage, which
 * routes visitors to every current product and to Lisa. Quote and consultation
 * pages go to Contact. `invalid.html` is deliberately absent: the new site's
 * real 404 page replaces it.
 *
 * Source plan: docs/information-architecture.md §4, updated for the routes in
 * src/data/site.ts.
 */

/** @type {Record<string, string>} old path -> new path */
const map = {
  // Home
  '/index.html': '/',
  '/insurance.html': '/',

  // Quotes and consultations: one conversation, on the Contact page
  '/quotes.html': '/contact',
  '/other-quotes.html': '/contact',
  '/free-consultation.html': '/contact',
  '/financial-planning.html': '/contact',

  // Under-65 health (short-term medical is a section of the same page)
  '/health-insurance.html': '/health-insurance',
  '/health-insurance-quote.html': '/health-insurance',
  '/under-65-medical-insurance.html': '/health-insurance',
  '/under-65-medical-plan-quote.html': '/health-insurance',
  '/short-term-medical.html': '/health-insurance',
  '/short-term-medical-plan-quote.html': '/health-insurance',

  // Dental and vision (one page covers both)
  '/dental-insurance.html': '/dental-insurance',
  '/dental-plans.html': '/dental-insurance',
  '/b-dental-insurance-quote.html': '/dental-insurance',
  '/vision-insurance.html': '/dental-insurance',
  '/vision-only-plan.html': '/dental-insurance',
  '/b-vision-insurance-quote.html': '/dental-insurance',

  // Retired products -> homepage
  '/long-term-care.html': '/',
  '/long-term-care-plan-quote.html': '/',
  '/critical-illness-insurance.html': '/',
  '/critical-illness-insurance-quote.html': '/',
  '/cancer-insurance.html': '/',
  '/cancer-plan-quote.html': '/',
  '/heart-attack-or-stroke-insurance.html': '/',
  '/heart-attack-or-stroke-plan-quote.html': '/',
  '/accident-insurance.html': '/',
  '/accident-insurance-quote.html': '/',
  '/final-expense-insurance.html': '/',
  '/final-expenselife-insurance.html': '/',
  // Still gets Google traffic; Lisa asked for it to land on Contact (2026-10-29).
  '/final-expense-life-insurance-quote.html': '/contact',
  '/final-expense-insurance-quote.html': '/',

  // Medicare
  '/medicare-options.html': '/medicare',
  '/medicare-options1.html': '/medicare',
  '/medicare-advantage-plans.html': '/medicare/advantage',
  '/medicare-advantage-plan-quote.html': '/medicare/advantage',
  '/medicare-supplement-coverage.html': '/medicare/supplement',
  '/medicare-supplement-coverage-quote.html': '/medicare/supplement',
  '/medicare-prescription-drug-plan.html': '/medicare/prescription-drugs',
  '/medicare-prescription-drug-plan-quote.html': '/medicare/prescription-drugs',
  '/medicare-education.html': '/medicare/education',
  '/medicare-resource-links.html': '/medicare/resources',

  // About, reviews, carriers, referrals
  '/about.html': '/about',
  '/staff-directory.html': '/about',
  '/agency-photo-gallery.html': '/about',
  '/insurance-carriers.html': '/about',
  '/client-testimonials.html': '/',
  '/refer-a-friend.html': '/contact',
  '/contact.html': '/contact',

  // Old news/blog -> Medicare education articles
  '/news.html': '/medicare/education',
  '/news/lisas-insurance-agency-news-and-updates': '/medicare/education',

  // Existing clients
  '/service.html': '/policyholders',
  '/proof-of-insurance.html': '/policyholders/proof-of-insurance',
  '/policy-changes.html': '/policyholders/policy-changes',
  '/policy-review.html': '/policyholders/policy-review',
  '/update-contact-info.html': '/policyholders/update-info',
  '/online-documents.html': '/policyholders/documents',
  '/contact-my-carrier.html': '/policyholders/contact-carrier',

  // Legal and utility
  '/accessibility-statement.html': '/accessibility',
  '/thank-you.html': '/thank-you',
};

/** Astro `redirects` config: every entry is a permanent 301. */
export const legacyRedirects = Object.fromEntries(
  Object.entries(map).map(([from, to]) => [from, { status: 301, destination: to }]),
);

export const legacyRedirectMap = map;
