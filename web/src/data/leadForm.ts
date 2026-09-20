/**
 * Configuration for the unified "Get in Touch" component — the CRM lead capture
 * (Step 1) and the cal.com scheduler (Step 2).
 *
 * Everything the two steps need that might change, or that is still pending a
 * real value, lives here in ONE place, the same way links.ts centralises
 * outbound URLs. Unresolved values carry a `TODO:` and are safe to ship: the
 * server route and the UI both degrade gracefully around them.
 *
 * The AgencyBloc web-to-lead endpoint is a plain form POST, not an API. The only
 * parts that are a hard contract are the endpoint URL and the field `name`
 * attributes below — the vendor markup and CSS were discarded and rebuilt in the
 * site's own design language.
 */

export const crm = {
  /**
   * AgencyBloc web-to-lead endpoint. The browser never posts here directly —
   * src/pages/api/lead.ts forwards to it server-side so the visitor never leaves
   * the site. Not echoed to the client.
   *
   * 2026-09-01: replaced the original token (MUBQTEWDSAPCQ9WF1ISY), which
   * AgencyBloc answered with response=OK but which was NOT connected to Lisa's
   * account — every submission was silently discarded. This token comes from
   * the "Website Lead" form in HER account (embed regenerated on the support
   * call). Leads land as Individuals → Prospect, Lead Source "Website".
   * reCAPTCHA: confirmed not required (no keys configured on the account).
   */
  endpoint: 'https://app.agencybloc.com/fp/webToLead/v1/HYLJSTW2DU4MI3Y999TE/',

  /**
   * Field `name` attributes. These ARE the contract with AgencyBloc — the values
   * on the left are what the endpoint reads. Do not rename the resolved ones.
   */
  fields: {
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email',
    phone: 'homePhone',

    /**
     * The honeypot. Vendor spam trap: hidden from humans, filled only by bots.
     * Must be present, hidden, and empty on a real submission. If it arrives
     * non-empty the submission is silently dropped. Do not rename or remove.
     */
    honeypot: '_Website',

    /**
     * "What can I help you with?" — the custom field on the "Website Lead"
     * form. The name is EXACTLY what AgencyBloc's regenerated embed uses,
     * spaces and question mark included; URL-encoding on the wire is handled
     * by URLSearchParams. Do not "clean this up" — renaming it breaks capture.
     */
    help: 'custom_What can I help you with?',

    /**
     * Consent audit trail. The version string of the consent wording the visitor
     * saw, and the submission timestamp. If AgencyBloc has no matching custom
     * fields yet these are harmlessly ignored on their end — the plumbing is here
     * so it works the moment the fields exist.
     *
     * TODO: replace with the real AgencyBloc field names once the consent custom
     * fields are created.
     */
    consentVersion: 'TODO_CONSENT_VERSION_FIELD',
    consentTimestamp: 'TODO_CONSENT_TIMESTAMP_FIELD',
  },

  /**
   * Version tag for the consent wording. Sent with every submission so a given
   * record can be tied to the exact language the visitor agreed to. Bump this
   * (date-stamp it) whenever the consent copy in GetInTouch.astro changes.
   *
   * v1 is the TCPA express-consent wording now shown in the form. If Lisa's
   * compliance contact revises that wording before or after launch, change the
   * copy AND bump this tag together so records stay tied to what was shown.
   */
  consentTextVersion: 'consent-v1-2026-09-19',

  /** Upstream request timeout, ms. */
  timeoutMs: 10_000,
} as const;

export const scheduler = {
  /** cal.com event: lisa-business-group / insurance-initial-consultation. */
  calLink: 'lisa-business-group/insurance-initial-consultation',
  namespace: 'insurance-initial-consultation',
  origin: 'https://app.cal.com',
  layout: 'month_view' as const,

  /**
   * Min-heights for the inline embed. The vendor default `height:100%;
   * overflow:scroll` collapses inside a card with no parent height and forces
   * permanent scrollbars — these give the frame real room instead. Tunable.
   */
  minHeightDesktop: '640px',
  minHeightMobile: '520px',
} as const;
