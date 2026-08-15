import { db } from "@/db";
import type { Locale } from "@/i18n/routing";
import { demoLanding } from "@/lib/demo-data";

type Translatable = { zh?: Record<string, string> | null };

/**
 * Overlays the row's Chinese translations onto its English columns. Any field
 * the admin has not translated keeps its English value, so a half-filled
 * translation degrades field by field instead of blanking the page.
 */
function localize<T extends Translatable>(row: T, locale: Locale): T {
  if (locale === "en" || !row.zh) return row;
  return { ...row, ...row.zh };
}

const localizeAll = <T extends Translatable>(rows: T[], locale: Locale) =>
  rows.map((row) => localize(row, locale));

/**
 * The landing page is a Server Component and reads the DB directly — no tRPC
 * round-trip. Without a database it falls back to demo content so the public
 * site still renders.
 */
export async function getLandingData(locale: Locale = "en") {
  if (!db) return localizeLanding(demoLanding, locale);

  const [content, why, classes, faq, gallery, reviews, social] =
    await Promise.all([
      db.query.landingPageContent.findFirst(),
      db.query.whyItems.findMany({
        where: (item, { eq }) => eq(item.isActive, true),
        orderBy: (item, { asc }) => asc(item.sortOrder),
      }),
      db.query.classOfferings.findMany({
        where: (item, { eq }) => eq(item.isActive, true),
        orderBy: (item, { asc }) => asc(item.sortOrder),
      }),
      db.query.faqItems.findMany({
        where: (item, { eq }) => eq(item.isActive, true),
        orderBy: (item, { asc }) => asc(item.sortOrder),
      }),
      db.query.galleryImages.findMany({
        where: (image, { eq }) => eq(image.isActive, true),
        orderBy: (image, { asc }) => asc(image.sortOrder),
      }),
      db.query.testimonials.findMany({
        where: (review, { eq }) => eq(review.isActive, true),
        orderBy: (review, { asc }) => asc(review.sortOrder),
      }),
      db.query.socialLinks.findMany({
        where: (link, { eq }) => eq(link.isActive, true),
        orderBy: (link, { asc }) => asc(link.sortOrder),
      }),
    ]);

  if (!content) return localizeLanding(demoLanding, locale);

  // Reviews, gallery captions and social labels stay as written — they are
  // real quotes and proper nouns, not copy the admin authors.
  return localizeLanding(
    { content, why, classes, faq, gallery, reviews, social },
    locale,
  );
}

function localizeLanding<
  T extends {
    content: Translatable;
    why: Translatable[];
    classes: Translatable[];
    faq: Translatable[];
  },
>(data: T, locale: Locale): T {
  if (locale === "en") return data;
  return {
    ...data,
    content: localize(data.content, locale),
    why: localizeAll(data.why, locale),
    classes: localizeAll(data.classes, locale),
    faq: localizeAll(data.faq, locale),
  };
}

export type LandingData = Awaited<ReturnType<typeof getLandingData>>;
