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

  /** TODO: booking page (e.g. Calendly). While "#", every "Schedule a call"
   *  control falls back to the call/text path instead of a dead link. */
  booking: '#',

  /** TODO: Google review URL */
  reviewGoogle: '#',
  /** TODO: Facebook review URL */
  reviewFacebook: '#',
  /** TODO: X profile URL */
  reviewX: '#',

  /** TODO: email-service form action (Mailchimp/ConvertKit/etc.) */
  newsletterEndpoint: '#',

  /** TODO: where the "send me a note" form POSTs — Lisa's CMS/CRM form endpoint,
   *  or a form service that forwards to her inbox.
   *
   *  Until this is a real URL the contact form does NOT render. That is
   *  deliberate: it previously showed "Thank you — I got your note. I'll call
   *  you back within one business day" while posting nowhere and discarding the
   *  name and phone number, which is the worst of both worlds — Lisa never sees
   *  the enquiry and the visitor thinks she is ignoring them.
   *
   *  Whoever wires this up: the endpoint should redirect to /thank-you on
   *  success (most form services take a redirect field; the name differs per
   *  vendor, so it is not guessed here). Without a redirect the visitor lands
   *  on whatever the endpoint returns. */
  contactEndpoint: '#',

  /** TODO: deferred — client profile signup. No auth/CRM is built yet. */
  profileSignup: '#',

  /** Real. Lisa can refine this to the "ask a question" / help page. */
  medicareGov: 'https://www.medicare.gov',
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
