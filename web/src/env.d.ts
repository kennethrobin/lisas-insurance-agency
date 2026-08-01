/**
 * Types for the build-time environment variables this site reads.
 *
 * Both are optional on purpose: the build has to succeed on a machine that has
 * never seen them (a fresh clone, a preview deploy), and googleReviews.ts
 * treats "missing" as a normal state rather than an error.
 */
interface ImportMetaEnv {
  /** Google Cloud key with Places API (New) enabled. See .env.example. */
  readonly GOOGLE_PLACES_API_KEY?: string;
  /** Place ID for Lisa's Google Business listing. See .env.example. */
  readonly GOOGLE_PLACE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
