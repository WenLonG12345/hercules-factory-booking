import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  classOfferings,
  faqItems,
  galleryImages,
  landingPageContent,
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
  reorderInput,
  socialLinkInput,
  testimonialInput,
  whyItemInput,
} from "@/server/validators/cms";
import { idSchema } from "@/server/validators/common";

export const cmsRouter = createTRPCRouter({
  publicContent: publicDbProcedure.query(async ({ ctx }) => {
    const [content, why, classes, faq, gallery, reviews, social] =
      await Promise.all([
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
          .from(testimonials)
          .where(eq(testimonials.isActive, true))
          .orderBy(asc(testimonials.sortOrder)),
        ctx.db
          .select()
          .from(socialLinks)
          .where(eq(socialLinks.isActive, true))
          .orderBy(asc(socialLinks.sortOrder)),
      ]);

    return { content, why, classes, faq, gallery, reviews, social };
  }),

  /** Admin view — inactive rows included. */
  allContent: adminProcedure.query(async ({ ctx }) => {
    const [content, why, classes, faq, gallery, reviews, social] =
      await Promise.all([
        ctx.db.query.landingPageContent.findFirst(),
        ctx.db.select().from(whyItems).orderBy(asc(whyItems.sortOrder)),
        ctx.db
          .select()
          .from(classOfferings)
          .orderBy(asc(classOfferings.sortOrder)),
        ctx.db.select().from(faqItems).orderBy(asc(faqItems.sortOrder)),
        ctx.db
          .select()
          .from(galleryImages)
          .orderBy(asc(galleryImages.sortOrder)),
        ctx.db.select().from(testimonials).orderBy(asc(testimonials.sortOrder)),
        ctx.db.select().from(socialLinks).orderBy(asc(socialLinks.sortOrder)),
      ]);

    return { content, why, classes, faq, gallery, reviews, social };
  }),

  updateLandingContent: adminProcedure
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
    create: adminProcedure
      .input(whyItemInput)
      .mutation(({ ctx, input }) =>
        ctx.db.insert(whyItems).values(input).returning(),
      ),
    update: adminProcedure
      .input(whyItemInput.extend({ id: z.uuid() }))
      .mutation(({ ctx, input: { id, ...values } }) =>
        ctx.db
          .update(whyItems)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(whyItems.id, id))
          .returning(),
      ),
    delete: adminProcedure
      .input(idSchema)
      .mutation(({ ctx, input }) =>
        ctx.db.delete(whyItems).where(eq(whyItems.id, input.id)).returning(),
      ),
    reorder: adminProcedure
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
    create: adminProcedure
      .input(classOfferingInput)
      .mutation(({ ctx, input }) =>
        ctx.db.insert(classOfferings).values(input).returning(),
      ),
    update: adminProcedure
      .input(classOfferingInput.extend({ id: z.uuid() }))
      .mutation(({ ctx, input: { id, ...values } }) =>
        ctx.db
          .update(classOfferings)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(classOfferings.id, id))
          .returning(),
      ),
    delete: adminProcedure
      .input(idSchema)
      .mutation(({ ctx, input }) =>
        ctx.db
          .delete(classOfferings)
          .where(eq(classOfferings.id, input.id))
          .returning(),
      ),
    reorder: adminProcedure
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

  faq: createTRPCRouter({
    create: adminProcedure
      .input(faqItemInput)
      .mutation(({ ctx, input }) =>
        ctx.db.insert(faqItems).values(input).returning(),
      ),
    update: adminProcedure
      .input(faqItemInput.extend({ id: z.uuid() }))
      .mutation(({ ctx, input: { id, ...values } }) =>
        ctx.db
          .update(faqItems)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(faqItems.id, id))
          .returning(),
      ),
    delete: adminProcedure
      .input(idSchema)
      .mutation(({ ctx, input }) =>
        ctx.db.delete(faqItems).where(eq(faqItems.id, input.id)).returning(),
      ),
    reorder: adminProcedure
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
    create: adminProcedure
      .input(testimonialInput)
      .mutation(({ ctx, input }) =>
        ctx.db.insert(testimonials).values(input).returning(),
      ),
    update: adminProcedure
      .input(testimonialInput.extend({ id: z.uuid() }))
      .mutation(({ ctx, input: { id, ...values } }) =>
        ctx.db
          .update(testimonials)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(testimonials.id, id))
          .returning(),
      ),
    delete: adminProcedure
      .input(idSchema)
      .mutation(({ ctx, input }) =>
        ctx.db
          .delete(testimonials)
          .where(eq(testimonials.id, input.id))
          .returning(),
      ),
    reorder: adminProcedure
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
    create: adminProcedure
      .input(socialLinkInput)
      .mutation(({ ctx, input }) =>
        ctx.db.insert(socialLinks).values(input).returning(),
      ),
    update: adminProcedure
      .input(socialLinkInput.extend({ id: z.uuid() }))
      .mutation(({ ctx, input: { id, ...values } }) =>
        ctx.db
          .update(socialLinks)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(socialLinks.id, id))
          .returning(),
      ),
    delete: adminProcedure
      .input(idSchema)
      .mutation(({ ctx, input }) =>
        ctx.db
          .delete(socialLinks)
          .where(eq(socialLinks.id, input.id))
          .returning(),
      ),
  }),

  gallery: createTRPCRouter({
    create: adminProcedure
      .input(galleryImageInput)
      .mutation(({ ctx, input }) =>
        ctx.db.insert(galleryImages).values(input).returning(),
      ),
    update: adminProcedure
      .input(galleryImageInput.extend({ id: z.uuid() }))
      .mutation(({ ctx, input: { id, ...values } }) =>
        ctx.db
          .update(galleryImages)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(galleryImages.id, id))
          .returning(),
      ),
    /** Publishes a visitor submission. Rejecting one is just `delete`. */
    approve: adminProcedure
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
    delete: adminProcedure.input(idSchema).mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .delete(galleryImages)
        .where(eq(galleryImages.id, input.id))
        .returning();
      if (row?.imageUrl) await deleteImage(row.imageUrl).catch(() => {});
      return row;
    }),
    reorder: adminProcedure
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
