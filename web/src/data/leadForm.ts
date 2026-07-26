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
   */
  endpoint: 'https://app.agencybloc.com/fp/webToLead/v1/MUBQTEWDSAPCQ9WF1ISY/',

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
     * "What can I help you with" — a custom field the account owner is adding in
     * the AgencyBloc form builder. The real `name` is revealed when she
     * regenerates the embed.
     *
     * TODO: replace 'TODO_HELP_FIELD' with the real AgencyBloc field name before
     * launch. Until then this value is still collected from the visitor and sent,
     * but AgencyBloc will not recognise the field name and will DROP it — so the
     * "what do you need help with" text is lost until this is filled in.
     */
    help: 'TODO_HELP_FIELD',

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
   * whenever the consent copy changes.
   *
   * TODO: set once the real consent wording is approved (see §6 / the consent
   * block in GetInTouch.astro). While the wording is a placeholder this stays a
   * placeholder tag.
   */
  consentTextVersion: 'TODO-consent-v0-placeholder',

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
