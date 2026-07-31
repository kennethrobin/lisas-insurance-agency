/**
 * Every OUTBOUND link the site makes, in one place.
 *
 * Each entry that needs a real account, booking page, or branded enrolment URL
 * ships as "#" with a TODO above it. Fill the real URL in HERE and it updates
 * everywhere — no page hunts for a hard-coded href.
 *
 * A "#" value is not a dead button. Call `isPending()` on any link before you
 * render a control that points at it, and give the visitor the fallback path
 * instead (call/text for booking, a "coming soon" note for the newsletter).
 * Nothing on this site is allowed to look clickable and do nothing.
 */

export const links = {
  /** TODO: Lisa's branded HealthSherpa ACA marketplace link */
  healthSherpaAca: '#',

  /** TODO: Sunfire "Simply Enroll" — Medicare Advantage */
  sunfireMedicareAdvantage: '#',

  /** TODO: Sunfire "Simply Enroll" — Part D */
  sunfirePartD: '#',

  /**
   * Real. Lisa's public cal.com booking page for the initial consultation. The
   * two-step contact card uses the cal.com EMBED (see scheduler in
   * leadForm.ts); this is the plain external link for the standalone
   * "Schedule" buttons (homepage How-it-works, Contact page). isPending() is
   * false now, so those controls link straight here rather than falling back to
   * the call/text path.
   */
  booking: 'https://cal.com/lisa-business-group/insurance-initial-consultation',

  /** TODO: Google review URL */
  reviewGoogle: '#',
  /** TODO: Facebook review URL */
  reviewFacebook: '#',
  /** TODO: X profile URL */
  reviewX: '#',

  /** TODO: email-service form action (Mailchimp/ConvertKit/etc.) */
  newsletterEndpoint: '#',

  /** TODO: deferred — client profile signup. No auth/CRM is built yet. */
  profileSignup: '#',

  /**
   * PLACEHOLDER — awaiting confirmed direct line.
   *
   * Lisa's direct number for existing policyholders, as a full tel: href.
   * Deliberately NOT the (972) 639-7639 in site.ts: that number is under
   * review and may be an enrolment desk rather than her own line, so the two
   * must not be assumed to be the same until confirmed.
   */
  policyholderDirectLine: '#',

  /** Real. Lisa can refine this to the "ask a question" / help page. */
  medicareGov: 'https://www.medicare.gov',

  /** Real. Official Medigap plan-benefits comparison chart, supplied by Lisa. */
  medigapCompareChart:
    'https://www.medicare.gov/health-drug-plans/medigap/basics/compare-plan-benefits',
} as const;

export type LinkKey = keyof typeof links;

/**
 * True while a link is still the "#" placeholder — i.e. there is nowhere real
 * to send the visitor yet. Use it to pick the fallback, never to hide the
 * control silently.
 */
export function isPending(url: string): boolean {
  return !url || url === '#';
}

/**
 * Resolves a "Schedule a call" control.
 *
 * With a booking URL it is a normal external link. Without one it becomes the
 * tap-to-call action, which is the path Lisa actually wants people on anyway —
 * so the button always does something useful.
 */
export function scheduleCta(phoneHref: string) {
  const pending = isPending(links.booking);
  return {
    href: pending ? phoneHref : links.booking,
    external: !pending,
    label: pending ? 'Call to set up a time' : 'Schedule a call',
  };
}

/** Attributes for a link that leaves the site. Spread onto the anchor. */
export const externalAttrs = { target: '_blank', rel: 'noopener' } as const;
