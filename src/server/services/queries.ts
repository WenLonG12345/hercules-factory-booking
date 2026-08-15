import { db } from "@/db";
import { demoLanding } from "@/lib/demo-data";

/**
 * The landing page is a Server Component and reads the DB directly — no tRPC
 * round-trip. Without a database it falls back to demo content so the public
 * site still renders.
 */
export async function getLandingData() {
  if (!db) return demoLanding;

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

  if (!content) return demoLanding;

  return { content, why, classes, faq, gallery, reviews, social };
}

export type LandingData = Awaited<ReturnType<typeof getLandingData>>;
