# Carrier logos

Each carrier's official mark in its **original colours**, used in the rolling
carrier strips: medical carriers in the dark-blue band under the homepage hero
(Lisa's order: UnitedHealthcare, Aetna, Healthspring, Mutual of Omaha, Aflac,
Humana, Devoted), and dental carriers on the Dental & Vision page. Both strips
sit on navy panels, so each logo goes on a white capsule; no logo is recoloured
or redrawn (owner's decision, 2026-10). Mapped in `web/src/data/carriers.ts`;
files in `web/public/logos/carriers/`.

Downloaded 2026-10-04. The only changes are housekeeping: XML comments,
titles and fixed width/height attributes were removed so the SVGs scale with
CSS. Paths and colours are unchanged.

- `aetna.svg`: aetna.com, `/content/dam/aetna/images/logos/Aetna_Logo_ss_Violet_RGB_Coated.svg`
- `allstate.svg`: Wikimedia Commons, `File:Allstate_wordmark.svg` (Allstate blue `#0033A0`)
- `healthspring.svg`: healthspring.com, `/static/svgs/logos/healthspring-logo.svg`
- `mutual-of-omaha.svg`: mutualofomaha.com header logo SVG. That site colours it with CSS (`#003a70`, `--color-blue-dark`), and the same fill is set on the file here. The unused white-icon variant inside it was removed.
- `devoted-health.svg`: devoted.com header logo, taken verbatim from the inline SVG in their site CSS (`logo-module--logo`).
- `ameritas.png`: ameritas.com header logo, `logo_header_@2x.png` (392×80). This is raster only, because Ameritas publishes no public SVG.
- `unitedhealthcare.svg`: Wikimedia Commons, `File:UnitedHealthcare_(logo).svg` (UHC blue `#293682`). uhc.com blocks automated downloads.
- `humana.svg`: the Humana wordmark from Wikimedia Commons, `File:Humana_logo.svg`, set to Humana Green `#78BE20`. That green appears in Humana's official verified email logo (BIMI, `default._bimi.humana.com`) and in Humana's published brand palette; the Commons file used an older shade.
- `aflac.png`: cropped from the cover of Aflac's official brand guidelines PDF (aflac.com `/_global-assets/dagger/brandcenter/pdfs/Aflac_BrandGuidelines.pdf`), rendered at 8x. It's raster on a white background, which is fine on the white capsule. Aflac's site only exposes a 154x65 sprite.
- `manhattanlife.png`: manhattanlife.com horizontal logo from their brand page, `/files/Images/ML_Logo_H_P326.png` (1600×676). This is raster only. ManhattanLife's guidelines ask agents to get logo files from Media@ManhattanLife.com or the Agent Resource Center (Agent Tools > Media Gallery).

Replace any file with a carrier-supplied version when it's available, keeping
the same filename.
