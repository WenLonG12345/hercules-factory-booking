import { asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  classOfferings,
  faqItems,
  galleryImages,
  landingPageContent,
  pricingPlans,
  promotions,
  socialLinks,
  testimonials,
  whyItems,
} from "@/db/schema";
import { deleteImage } from "@/lib/r2";
import {
  adminProcedure,
  createTRPCRouter,
  publicDbProcedure,
} from "@/server/trpc";
import {
  classOfferingInput,
  faqItemInput,
  galleryImageInput,
  landingPageContentInput,
  pricingPlanInput,
  promotionInput,
  reorderInput,
  socialLinkInput,
  testimonialInput,
  whyItemInput,
} from "@/server/validators/cms";
import { idSchema } from "@/server/validators/common";

/** Alt text is never typed by hand — describe the photo from what we already
 * know about it: the visitor's caption, else its category, else the fallback. */
const galleryAlt = (image: {
  caption?: string | null;
  category?: string | null;
  submittedBy?: string | null;
}) =>
  image.caption?.trim() ||
  (image.category?.trim()
    ? `${image.category.trim()} at Hercules Factory`
    : image.submittedBy?.trim()
      ? `Training photo shared by ${image.submittedBy.trim()}`
      : "Muay Thai training at Hercules Factory");

/**
 * The landing page is ISR'd (`revalidate = 300` in `src/app/[locale]/page.tsx`),
 * so without this an edit here would sit behind a stale page for up to five
 * minutes. Every successful CMS mutation marks the public route — both locales,
 * hence the route pattern rather than a literal path — so the next visit
 * re-renders against the new rows.
 */
const cmsProcedure = adminProcedure.use(async ({ type, next }) => {
  const result = await next();
  if (type === "mutation" && result.ok) {
    revalidatePath("/[locale]", "page");
  }
  return result;
});

export const cmsRouter = createTRPCRouter({
  publicContent: publicDbProcedure.query(async ({ ctx }) => {
    const [
      content,
      why,
      classes,
      pricing,
      faq,
      gallery,
      promos,
      reviews,
      social,
    ] = await Promise.all([
      ctx.db.query.landingPageContent.findFirst(),
      ctx.db
        .select()
        .from(whyItems)
        .where(eq(whyItems.isActive, true))
        .orderBy(asc(whyItems.sortOrder)),
      ctx.db
        .select()
        .from(classOfferings)
        .where(eq(classOfferings.isActive, true))
        .orderBy(asc(classOfferings.sortOrder)),
      ctx.db
        .select()
        .from(pricingPlans)
        .where(eq(pricingPlans.isActive, true))
        .orderBy(asc(pricingPlans.sortOrder)),
      ctx.db
        .select()
        .from(faqItems)
        .where(eq(faqItems.isActive, true))
        .orderBy(asc(faqItems.sortOrder)),
      ctx.db
        .select()
        .from(galleryImages)
        .where(eq(galleryImages.isActive, true))
        .orderBy(asc(galleryImages.sortOrder)),
      ctx.db
        .select()
        .from(promotions)
        .where(eq(promotions.isActive, true))
        .orderBy(desc(promotions.createdAt)),
      ctx.db
        .select()
        .from(testimonials)
        .where(eq(testimonials.isActive, true))
        .orderBy(asc(testimonials.sortOrder)),
      ctx.db
        .select()
        .from(socialLinks)
        .where(eq(socialLinks.isActive, true))
        .orderBy(asc(socialLinks.sortOrder)),
    ]);

    return {
      content,
      why,
      classes,
      pricing,
      faq,
      gallery,
      promos,
      reviews,
      social,
    };
  }),

  /** Admin view — inactive rows included. */
  allContent: cmsProcedure.query(async ({ ctx }) => {
    const [
      content,
      why,
      classes,
      pricing,
      faq,
      gallery,
      promos,
      reviews,
      social,
    ] = await Promise.all([
      ctx.db.query.landingPageContent.findFirst(),
      ctx.db.select().from(whyItems).orderBy(asc(whyItems.sortOrder)),
      ctx.db
        .select()
        .from(classOfferings)
        .orderBy(asc(classOfferings.sortOrder)),
      ctx.db.select().from(pricingPlans).orderBy(asc(pricingPlans.sortOrder)),
      ctx.db.select().from(faqItems).orderBy(asc(faqItems.sortOrder)),
      ctx.db.select().from(galleryImages).orderBy(asc(galleryImages.sortOrder)),
      // Newest first — the landing page runs the newest active one, so the
      // top row of this list is the one currently live.
      ctx.db
        .select()
        .from(promotions)
        .orderBy(desc(promotions.createdAt)),
      ctx.db.select().from(testimonials).orderBy(asc(testimonials.sortOrder)),
      ctx.db.select().from(socialLinks).orderBy(asc(socialLinks.sortOrder)),
    ]);

    return {
      content,
      why,
      classes,
      pricing,
      faq,
      gallery,
      promos,
      reviews,
      social,
    };
  }),

  updateLandingContent: cmsProcedure
    .input(landingPageContentInput)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.landingPageContent.findFirst();
      if (!existing) {
        return ctx.db.insert(landingPageContent).values(input).returning();
      }
      return ctx.db
        .update(landingPageContent)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(landingPageContent.id, existing.id))
        .returning();
    }),

  why: createTRPCRouter({
    create: cmsProcedure
      .input(whyItemInput)
      .mutation(({ ctx, input }) =>
        ctx.db.insert(whyItems).values(input).returning(),
      ),
    update: cmsProcedure
      .input(whyItemInput.extend({ id: z.uuid() }))
      .mutation(({ ctx, input: { id, ...values } }) =>
        ctx.db
          .update(whyItems)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(whyItems.id, id))
          .returning(),
      ),
    delete: cmsProcedure
      .input(idSchema)
      .mutation(({ ctx, input }) =>
        ctx.db.delete(whyItems).where(eq(whyItems.id, input.id)).returning(),
      ),
    reorder: cmsProcedure
      .input(reorderInput)
      .mutation(async ({ ctx, input }) => {
        await Promise.all(
          input.ids.map((id, index) =>
            ctx.db
              .update(whyItems)
              .set({ sortOrder: index, updatedAt: new Date() })
              .where(eq(whyItems.id, id)),
          ),
        );
        return { ok: true };
      }),
  }),

  classes: createTRPCRouter({
    create: cmsProcedure
      .input(classOfferingInput)
      .mutation(({ ctx, input }) =>
        ctx.db.insert(classOfferings).values(input).returning(),
      ),
    update: cmsProcedure
      .input(classOfferingInput.extend({ id: z.uuid() }))
      .mutation(({ ctx, input: { id, ...values } }) =>
        ctx.db
          .update(classOfferings)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(classOfferings.id, id))
          .returning(),
      ),
    delete: cmsProcedure
      .input(idSchema)
      .mutation(({ ctx, input }) =>
        ctx.db
          .delete(classOfferings)
          .where(eq(classOfferings.id, input.id))
          .returning(),
      ),
    reorder: cmsProcedure
      .input(reorderInput)
      .mutation(async ({ ctx, input }) => {
        await Promise.all(
          input.ids.map((id, index) =>
            ctx.db
              .update(classOfferings)
              .set({ sortOrder: index, updatedAt: new Date() })
              .where(eq(classOfferings.id, id)),
          ),
        );
        return { ok: true };
      }),
  }),

  pricing: createTRPCRouter({
    create: cmsProcedure
      .input(pricingPlanInput)
      .mutation(({ ctx, input }) =>
        ctx.db.insert(pricingPlans).values(input).returning(),
      ),
    update: cmsProcedure
      .input(pricingPlanInput.extend({ id: z.uuid() }))
      .mutation(({ ctx, input: { id, ...values } }) =>
        ctx.db
          .update(pricingPlans)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(pricingPlans.id, id))
          .returning(),
      ),
    delete: cmsProcedure
      .input(idSchema)
      .mutation(({ ctx, input }) =>
        ctx.db
          .delete(pricingPlans)
          .where(eq(pricingPlans.id, input.id))
          .returning(),
      ),
    reorder: cmsProcedure
      .input(reorderInput)
      .mutation(async ({ ctx, input }) => {
        await Promise.all(
          input.ids.map((id, index) =>
            ctx.db
              .update(pricingPlans)
              .set({ sortOrder: index, updatedAt: new Date() })
              .where(eq(pricingPlans.id, id)),
          ),
        );
        return { ok: true };
      }),
  }),

  faq: createTRPCRouter({
    create: cmsProcedure
      .input(faqItemInput)
      .mutation(({ ctx, input }) =>
        ctx.db.insert(faqItems).values(input).returning(),
      ),
    update: cmsProcedure
      .input(faqItemInput.extend({ id: z.uuid() }))
      .mutation(({ ctx, input: { id, ...values } }) =>
        ctx.db
          .update(faqItems)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(faqItems.id, id))
          .returning(),
      ),
    delete: cmsProcedure
      .input(idSchema)
      .mutation(({ ctx, input }) =>
        ctx.db.delete(faqItems).where(eq(faqItems.id, input.id)).returning(),
      ),
    reorder: cmsProcedure
      .input(reorderInput)
      .mutation(async ({ ctx, input }) => {
        await Promise.all(
          input.ids.map((id, index) =>
            ctx.db
              .update(faqItems)
              .set({ sortOrder: index, updatedAt: new Date() })
              .where(eq(faqItems.id, id)),
          ),
        );
        return { ok: true };
      }),
  }),

  reviews: createTRPCRouter({
    create: cmsProcedure
      .input(testimonialInput)
      .mutation(({ ctx, input }) =>
        ctx.db.insert(testimonials).values(input).returning(),
      ),
    update: cmsProcedure
      .input(testimonialInput.extend({ id: z.uuid() }))
      .mutation(({ ctx, input: { id, ...values } }) =>
        ctx.db
          .update(testimonials)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(testimonials.id, id))
          .returning(),
      ),
    delete: cmsProcedure
      .input(idSchema)
      .mutation(({ ctx, input }) =>
        ctx.db
          .delete(testimonials)
          .where(eq(testimonials.id, input.id))
          .returning(),
      ),
    reorder: cmsProcedure
      .input(reorderInput)
      .mutation(async ({ ctx, input }) => {
        await Promise.all(
          input.ids.map((id, index) =>
            ctx.db
              .update(testimonials)
              .set({ sortOrder: index, updatedAt: new Date() })
              .where(eq(testimonials.id, id)),
          ),
        );
        return { ok: true };
      }),
  }),

  social: createTRPCRouter({
    create: cmsProcedure
      .input(socialLinkInput)
      .mutation(({ ctx, input }) =>
        ctx.db.insert(socialLinks).values(input).returning(),
      ),
    update: cmsProcedure
      .input(socialLinkInput.extend({ id: z.uuid() }))
      .mutation(({ ctx, input: { id, ...values } }) =>
        ctx.db
          .update(socialLinks)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(socialLinks.id, id))
          .returning(),
      ),
    delete: cmsProcedure
      .input(idSchema)
      .mutation(({ ctx, input }) =>
        ctx.db
          .delete(socialLinks)
          .where(eq(socialLinks.id, input.id))
          .returning(),
      ),
  }),

  promos: createTRPCRouter({
    create: cmsProcedure
      .input(promotionInput)
      .mutation(({ ctx, input }) =>
        ctx.db.insert(promotions).values(input).returning(),
      ),
    update: cmsProcedure
      .input(promotionInput.extend({ id: z.uuid() }))
      .mutation(({ ctx, input: { id, ...values } }) =>
        ctx.db
          .update(promotions)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(promotions.id, id))
          .returning(),
      ),
    delete: cmsProcedure.input(idSchema).mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .delete(promotions)
        .where(eq(promotions.id, input.id))
        .returning();
      if (row?.imageUrl) await deleteImage(row.imageUrl).catch(() => {});
      return row;
    }),
  }),

  gallery: createTRPCRouter({
    create: cmsProcedure.input(galleryImageInput).mutation(({ ctx, input }) =>
      ctx.db
        .insert(galleryImages)
        .values({ ...input, alt: galleryAlt(input) })
        .returning(),
    ),
    update: cmsProcedure
      .input(galleryImageInput.extend({ id: z.uuid() }))
      .mutation(({ ctx, input: { id, ...values } }) =>
        ctx.db
          .update(galleryImages)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(galleryImages.id, id))
          .returning(),
      ),
    /** Publishes a visitor submission. Rejecting one is just `delete`. */
    approve: cmsProcedure
      .input(idSchema)
      .mutation(({ ctx, input }) =>
        ctx.db
          .update(galleryImages)
          .set({ isActive: true, updatedAt: new Date() })
          .where(eq(galleryImages.id, input.id))
          .returning(),
      ),
    // Deleting the row deletes the R2 object — the Supabase version left
    // orphans behind.
    delete: cmsProcedure.input(idSchema).mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .delete(galleryImages)
        .where(eq(galleryImages.id, input.id))
        .returning();
      if (row?.imageUrl) await deleteImage(row.imageUrl).catch(() => {});
      return row;
    }),
    reorder: cmsProcedure
      .input(reorderInput)
      .mutation(async ({ ctx, input }) => {
        await Promise.all(
          input.ids.map((id, index) =>
            ctx.db
              .update(galleryImages)
              .set({ sortOrder: index, updatedAt: new Date() })
              .where(eq(galleryImages.id, id)),
          ),
        );
        return { ok: true };
      }),
  }),
});
