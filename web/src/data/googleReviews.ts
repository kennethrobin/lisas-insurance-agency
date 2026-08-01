/**
 * Google reviews, pulled from the Places API (New) at BUILD TIME.
 *
 * The site is statically rendered, so this runs once per deploy on the build
 * machine and the result is baked into the HTML. Nothing here reaches the
 * browser: no API key is shipped, no client-side fetch, no third-party script.
 * To refresh the reviews you redeploy — see REFRESHING below.
 *
 * WHAT GOOGLE GIVES US
 * The Places API returns at most FIVE reviews and picks them itself ("most
 * relevant"). There is no paging, no sort-by-newest, and no way to ask for all
 * of them. That is a hard ceiling of the API, not a setting we can raise. All
 * reviews needs the Business Profile API, which requires owner OAuth plus a
 * quota application to Google.
 *
 * DISPLAY TERMS
 * Google requires that reviews render unmodified, unfiltered and unreordered,
 * with the author's name, their photo linked to their profile, and a visible
 * "Powered by Google". Reviews.astro does all of that. Do not add a filter that
 * drops low ratings, and do not re-sort the array — both break the terms.
 *
 * REFRESHING
 * Google's terms also cap how long Places content may be cached (30 days; the
 * Place ID itself is exempt and may be stored indefinitely). A static build is
 * a cache, so the site must rebuild at least monthly. A Vercel Deploy Hook on a
 * weekly cron is the simplest way — otherwise the baked reviews go stale and
 * out of terms at the same time.
 *
 * SETUP  (both values are read from the environment, never committed)
 *   GOOGLE_PLACES_API_KEY  Google Cloud console -> APIs & Services ->
 *                          Credentials. Enable "Places API (New)" on the
 *                          project. Restrict the key to that one API.
 *   GOOGLE_PLACE_ID        The Place ID for Lisa's listing. Find it with the
 *                          Place ID Finder:
 *                          https://developers.google.com/maps/documentation/places/web-service/place-id
 *
 * Put both in web/.env for local builds, and in the Vercel project's
 * environment variables for deploys. WITHOUT THEM THE BUILD STILL SUCCEEDS —
 * fetchGoogleReviews() returns null and Reviews.astro keeps its written
 * fallback, matching how links.ts treats a pending link.
 */

/** One review, flattened to what the card actually renders. */
export interface GoogleReview {
  /** 1-5. Rendered as filled/empty stars, never rounded or rewritten. */
  rating: number;
  /** The review body, VERBATIM. Never trim, summarise or clean this up. */
  text: string;
  authorName: string;
  /** Profile photo. Null when the reviewer has none. */
  authorPhoto: string | null;
  /** The author's Google Maps profile. Their name links here when present. */
  authorUri: string | null;
  /** Google's own wording, e.g. "3 months ago" — already localised. */
  relativeTime: string;
  /** ISO timestamp, for <time datetime>. */
  publishTime: string;
  /** This review on Google Maps. */
  reviewUri: string | null;
}

export interface GooglePlaceReviews {
  /** In the order Google returned them. Do not re-sort. */
  reviews: GoogleReview[];
  /** Average across ALL reviews, not just the five above. */
  rating: number | null;
  /** Total review count on the listing. */
  total: number | null;
  /** Deep link that opens the "write a review" dialog. */
  writeReviewUri: string | null;
  /** The listing on Google Maps. */
  placeUri: string | null;
}

/** Shape of the slice of the Places response we ask for. */
interface PlacesResponse {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  googleMapsLinks?: { writeAReviewUri?: string; reviewsUri?: string };
  reviews?: Array<{
    rating?: number;
    text?: { text?: string };
    originalText?: { text?: string };
    relativePublishTimeDescription?: string;
    publishTime?: string;
    googleMapsUri?: string;
    authorAttribution?: { displayName?: string; photoUri?: string; uri?: string };
  }>;
}

const ENDPOINT = 'https://places.googleapis.com/v1/places';

/**
 * Exactly the fields we render — the field mask is required, and asking for
 * less costs less. `googleMapsLinks` is newer than the rest; if a given API
 * version omits it we fall back to googleMapsUri below rather than failing.
 */
const FIELD_MASK = [
  'rating',
  'userRatingCount',
  'googleMapsUri',
  'googleMapsLinks',
  'reviews',
].join(',');

/** A slow Google must not hang the build. */
const TIMEOUT_MS = 8000;

/**
 * Fetches the listing's reviews. Returns null when the integration is not
 * configured or when anything at all goes wrong.
 *
 * This NEVER throws and never fails the build. A deploy that happens while
 * Google is down should ship the site with its written fallback, not break.
 */
export async function fetchGoogleReviews(): Promise<GooglePlaceReviews | null> {
  const key = import.meta.env.GOOGLE_PLACES_API_KEY;
  const placeId = import.meta.env.GOOGLE_PLACE_ID;

  // Not configured yet. Silent by design — this is the expected state until
  // the key and Place ID are filled in, exactly like a "#" link in links.ts.
  if (!key || !placeId) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${ENDPOINT}/${encodeURIComponent(placeId)}`, {
      headers: {
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      // Loud, because a misconfigured key silently degrades the homepage.
      console.warn(
        `[googleReviews] Places API returned ${res.status}. ` +
          `Falling back to the written reviews. ${await res.text().catch(() => '')}`,
      );
      return null;
    }

    const data = (await res.json()) as PlacesResponse;

    // Map into our shape, in Google's order, with nothing dropped for content.
    // The only rejection is a review with no text at all — a blank card would
    // render as an empty quote, and a star-only rating has nothing to quote.
    const reviews: GoogleReview[] = (data.reviews ?? [])
      .map((r) => {
        const attribution = r.authorAttribution ?? {};
        return {
          rating: typeof r.rating === 'number' ? r.rating : 5,
          text: (r.text?.text ?? r.originalText?.text ?? '').trim(),
          authorName: attribution.displayName ?? 'Google reviewer',
          authorPhoto: attribution.photoUri ?? null,
          authorUri: attribution.uri ?? null,
          relativeTime: r.relativePublishTimeDescription ?? '',
          publishTime: r.publishTime ?? '',
          reviewUri: r.googleMapsUri ?? data.googleMapsUri ?? null,
        };
      })
      .filter((r) => r.text !== '');

    if (reviews.length === 0) {
      console.warn('[googleReviews] No reviews with text came back. Using the fallback.');
      return null;
    }

    return {
      reviews,
      rating: typeof data.rating === 'number' ? data.rating : null,
      total: typeof data.userRatingCount === 'number' ? data.userRatingCount : null,
      writeReviewUri: data.googleMapsLinks?.writeAReviewUri ?? null,
      placeUri: data.googleMapsLinks?.reviewsUri ?? data.googleMapsUri ?? null,
    };
  } catch (err) {
    console.warn(
      `[googleReviews] Could not reach the Places API (${String(err)}). ` +
        'Falling back to the written reviews.',
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Five filled/empty stars for a rating, as text.
 *
 * The card shows this to sighted users with aria-hidden and pairs it with a
 * written "N out of 5" for screen readers — a row of ★ characters is read out
 * as "black star black star black star" otherwise.
 */
export function starsFor(rating: number): string {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}
