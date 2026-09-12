import type { Locale } from "@/i18n/routing";

/**
 * Live Google Business Profile rating + the five newest reviews, straight from
 * Places API (New). Google caps the reviews field at five; the full list is
 * behind GOOGLE_REVIEWS_URL.
 *
 * Needs GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID. Without them (or on any
 * failure) this returns null and the landing page falls back to the CMS
 * testimonials rows, so a missing key never blanks the section.
 *
 * ponytail: cached a day per locale via the fetch data cache — two calls/day,
 * well inside the free tier. Move to a DB sync if that ever changes.
 */
export async function getGoogleReviews(locale: Locale) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) return null;

  const url = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
  url.searchParams.set("reviewsSort", "NEWEST");
  url.searchParams.set("languageCode", locale);

  try {
    const res = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "rating,reviews",
      },
      next: { revalidate: 86_400 },
    });
    if (!res.ok) return null;
    const place = (await res.json()) as {
      rating?: number;
      reviews?: Array<{
        name: string;
        rating: number;
        relativePublishTimeDescription?: string;
        text?: { text: string };
        authorAttribution?: { displayName: string; uri?: string };
      }>;
    };

    return {
      rating: place.rating ?? 0,
      // Same shape as a `testimonials` row so the page and the /[slug] pages
      // render either source without a branch. Star-only reviews are skipped.
      reviews: (place.reviews ?? [])
        .filter((review) => review.text?.text)
        .map((review) => ({
          id: review.name,
          author: review.authorAttribution?.displayName ?? "Google user",
          authorUrl: review.authorAttribution?.uri ?? null,
          rating: review.rating,
          quote: review.text?.text ?? "",
          source: "Google",
          reviewedAt: review.relativePublishTimeDescription ?? null,
        })),
    };
  } catch {
    return null;
  }
}

export type GoogleReviews = NonNullable<
  Awaited<ReturnType<typeof getGoogleReviews>>
>;
