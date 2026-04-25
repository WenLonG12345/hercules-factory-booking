import { asc, eq } from "drizzle-orm";
import {
  coaches,
  galleryImages,
  landingPageContent,
  socialLinks,
  testimonials,
} from "@/db/schema";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/trpc";
import {
  coachInput,
  galleryImageInput,
  landingPageContentInput,
  socialLinkInput,
  testimonialInput,
} from "@/server/validators/cms";
import { idSchema } from "@/server/validators/common";

export const cmsRouter = createTRPCRouter({
  publicContent: publicProcedure.query(async ({ ctx }) => ({
    content: await ctx.db.query.landingPageContent.findFirst(),
    gallery: await ctx.db
      .select()
      .from(galleryImages)
      .where(eq(galleryImages.isActive, true))
      .orderBy(asc(galleryImages.sortOrder)),
    coaches: await ctx.db
      .select()
      .from(coaches)
      .where(eq(coaches.isActive, true))
      .orderBy(asc(coaches.sortOrder)),
    testimonials: await ctx.db
      .select()
      .from(testimonials)
      .where(eq(testimonials.isActive, true))
      .orderBy(asc(testimonials.sortOrder)),
    socialLinks: await ctx.db
      .select()
      .from(socialLinks)
      .where(eq(socialLinks.isActive, true))
      .orderBy(asc(socialLinks.sortOrder)),
  })),
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
  createGalleryImage: adminProcedure
    .input(galleryImageInput)
    .mutation(({ ctx, input }) =>
      ctx.db.insert(galleryImages).values(input).returning(),
    ),
  createCoach: adminProcedure
    .input(coachInput)
    .mutation(({ ctx, input }) =>
      ctx.db.insert(coaches).values(input).returning(),
    ),
  createTestimonial: adminProcedure
    .input(testimonialInput)
    .mutation(({ ctx, input }) =>
      ctx.db.insert(testimonials).values(input).returning(),
    ),
  createSocialLink: adminProcedure
    .input(socialLinkInput)
    .mutation(({ ctx, input }) =>
      ctx.db.insert(socialLinks).values(input).returning(),
    ),
  deleteGalleryImage: adminProcedure
    .input(idSchema)
    .mutation(({ ctx, input }) =>
      ctx.db
        .delete(galleryImages)
        .where(eq(galleryImages.id, input.id))
        .returning(),
    ),
});
