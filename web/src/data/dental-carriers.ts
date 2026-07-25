/**
 * The dental & vision carrier comparison, rendered by the table on
 * /dental-insurance. Data lives here rather than in seven rows of markup so the
 * enrollment destinations can be swapped in one place when Lisa's tracked links
 * arrive.
 *
 * PLACEHOLDER URLS: every `Apply Online Now` destination below is the carrier's
 * public homepage, NOT Lisa's attributed producer link. Enrolling through these
 * would not credit her. They are marked individually and must all be replaced
 * before this page goes live.
 *
 * The "Call to Enroll" rows use the agency phone from site.ts. That number is
 * itself under review — see the note on `callToEnrollHref` below.
 */
import { site } from './site';

/**
 * Destination for the "Call to Enroll" rows.
 *
 * PLACEHOLDER — the revision notes flag the 972 number as possibly an
 * enrollment desk rather than Lisa's direct line. Confirm before launch; if it
 * turns out to be a separate desk, this constant changes and the seven rows
 * below do not.
 */
export const callToEnrollHref = site.phoneHref;

export type CarrierAction = 'apply' | 'call';

export type DentalCarrier = {
  /** Row key, and the table's row header. */
  carrier: string;
  /** Plan type and deductible rules, exactly as supplied by the client. */
  planType: string;
  /** Network and core strengths, exactly as supplied by the client. */
  network: string;
  action: CarrierAction;
  /** Only set for `apply` rows; `call` rows use callToEnrollHref. */
  href?: string;
};

export const dentalCarriers: DentalCarrier[] = [
  {
    carrier: 'Ameritas',
    planType: 'Dental Plan (+ Vision Add-on): $0 Preventive Deductible.',
    network:
      'Top Network & Lifetime Implants: Premier PPO network. Continuous lifetime implant coverage. Waives waiting periods for recent coverage loss (30–60 days).',
    action: 'apply',
    // PLACEHOLDER — awaiting Lisa's tracked producer enrollment URL.
    href: 'https://www.ameritas.com',
  },
  {
    carrier: 'Allstate',
    planType: 'Dental Plan (+ Vision Add-on): $0 Preventive Deductible.',
    network:
      'Pre-existing Missing Teeth: Massive national network. Continuous lifetime implant coverage. Covers pre-existing missing teeth after 2 years.',
    action: 'apply',
    // PLACEHOLDER — awaiting Lisa's tracked producer enrollment URL.
    href: 'https://www.natgenhealth.com',
  },
  {
    carrier: 'ManhattanLife Select',
    planType: 'Advanced DVH Plan / Options: $0 Deductible Option available.',
    network:
      'All-in-One with Implants: Premium tier. Includes vital implant benefits capped at a maximum lifetime benefit amount.',
    action: 'apply',
    // PLACEHOLDER — awaiting Lisa's tracked producer enrollment URL.
    href: 'https://www.manhattanlife.com',
  },
  {
    carrier: 'ManhattanLife',
    planType: 'Standard DVH Plan: Fixed $100 deductible per person.',
    network:
      'Budget-Conscious All-in-One: Combined Dental, Vision, and Hearing policy with competitive monthly rates. No Implant Coverage.',
    action: 'apply',
    // PLACEHOLDER — awaiting Lisa's tracked producer enrollment URL.
    href: 'https://www.manhattanlife.com',
  },
  {
    carrier: 'Mutual of Omaha',
    planType: 'Dental Plan (+ Vision Add-on): $0 Preventive Deductible.',
    network:
      'Trusted Brand Name Network: Renowned national network with immediate day-one options. Implants are covered up to a maximum lifetime benefit amount. (Basic vision option).',
    action: 'call',
  },
  {
    carrier: 'Aetna',
    planType: 'DVH Plan: $0 Deductible Options available on select plans.',
    network:
      'Household PPO Network: Industry-leading PPO network for Dental, Vision, and Hearing. Aetna Select plans include implant coverage up to a maximum lifetime benefit amount (where available in certain states). Other Aetna DVH plans have No Implant Coverage.',
    action: 'call',
  },
  {
    carrier: 'HealthSpring',
    planType: 'DVH Plan: $0 Deductible Option available.',
    network:
      'No Waiting via Waiver: Complete Dental, Vision, and Hearing package. No Implant Coverage. Waives waiting periods if transitioning from recent coverage loss (30–60 days).',
    action: 'call',
  },
];
