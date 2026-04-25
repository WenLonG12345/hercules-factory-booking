import { z } from "zod";

export const landingPageContentInput = z.object({
  heroTitle: z.string().min(4),
  heroSubtitle: z.string().min(10),
  primaryCtaText: z.string().min(2),
  secondaryCtaText: z.string().min(2),
  aboutTitle: z.string().min(2),
  aboutBody: z.string().min(10),
  locationTitle: z.string().min(2),
  locationAddress: z.string().min(5),
  mapEmbedUrl: z.string().optional(),
});

export const galleryImageInput = z.object({
  imageUrl: z.string().min(4),
  alt: z.string().min(2),
  caption: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
});

export const coachInput = z.object({
  name: z.string().min(2),
  title: z.string().min(2),
  bio: z.string().min(10),
  imageUrl: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
});

export const testimonialInput = z.object({
  customerName: z.string().min(2),
  quote: z.string().min(10),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
});

export const socialLinkInput = z.object({
  platform: z.string().min(2),
  label: z.string().min(2),
  url: z.string().min(4),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
});
