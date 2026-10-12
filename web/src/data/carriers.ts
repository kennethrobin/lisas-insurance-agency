/**
 * Carrier logos, in their original colours, for the rolling carrier strips
 * (CarrierStrip.astro). They sit on white capsules, so no mark is recoloured.
 *
 * One place, so the homepage and the dental page can't drift apart. Files are
 * in /public/logos/carriers; provenance is in docs/carrier-logos.md.
 * Spread an entry into a Carrier: `{ name, ...carrierLogos.aetna }`.
 */
export const carrierLogos = {
  /* Stacked two-line wordmark, so it needs more height to read. */
  unitedHealthcare: { logo: '/logos/carriers/unitedhealthcare.svg', logoScale: 1.35 },
  /* Cropped from Aflac's brand guidelines with a little built-in margin. */
  aflac: { logo: '/logos/carriers/aflac.png', logoScale: 1.2 },
  humana: { logo: '/logos/carriers/humana.svg', logoScale: 0.85 },
  ameritas: { logo: '/logos/carriers/ameritas.png' },
  /* Tall statue beside a small wordmark, so it needs more height. */
  manhattanLife: { logo: '/logos/carriers/manhattanlife.png', logoScale: 1.6 },
  allstate: { logo: '/logos/carriers/allstate.svg', logoScale: 0.85 },
  healthspring: { logo: '/logos/carriers/healthspring.svg' },
  aetna: { logo: '/logos/carriers/aetna.svg', logoScale: 0.9 },
  mutualOfOmaha: { logo: '/logos/carriers/mutual-of-omaha.svg', logoScale: 1.1 },
  /* Devoted's own file includes a built-in pill margin, so it runs larger. */
  devotedHealth: { logo: '/logos/carriers/devoted-health.svg', logoScale: 1.45 },
} as const;
