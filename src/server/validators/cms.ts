import { z } from "zod";

/**
 * Chinese overrides, keyed by the row's own English field names. Blank values
 * are dropped so a half-filled translation falls back to English per field.
 */
const zhInput = z
  .record(z.string(), z.string())
  .transform((value) =>
    Object.fromEntries(Object.entries(value).filter(([, text]) => text.trim())),
  )
  .optional();

/** The fields the landing page actually renders in Chinese. */
export const TRANSLATABLE = {
  content: [
    "heroKicker",
    "heroHeadline",
    "heroSubtitle",
    "primaryCtaText",
    "whatsappMessage",
    "whyTitle",
    "classesTitle",
    "galleryTitle",
    "pricingTitle",
    "promotionsTitle",
    "testimonialsTitle",
    "faqTitle",
    "locationTitle",
    "locationAddress",
  ],
  why: ["title", "description"],
  classes: ["name", "description", "whatsappMessage"],
  // `unit` translates too — "month" has to read 月 on /zh.
  pricing: ["name", "unit", "features", "whatsappMessage"],
  faq: ["question", "answer"],
} as const;

export const landingPageContentInput = z.object({
  heroKicker: z.string().min(2),
  heroHeadline: z.string().min(4),
  heroSubtitle: z.string().min(4),
  heroImageUrl: z.string().optional(),
  primaryCtaText: z.string().min(2),
  whatsappPhone: z.string().min(8),
  whatsappMessage: z.string().min(4),
  whyTitle: z.string().min(2),
  classesTitle: z.string().min(2),
  galleryTitle: z.string().min(2),
  pricingTitle: z.string().min(2),
  promotionsTitle: z.string().min(2),
  testimonialsTitle: z.string().min(2),
  faqTitle: z.string().min(2),
  locationTitle: z.string().min(2),
  locationAddress: z.string().min(5),
  mapEmbedUrl: z.string().optional(),
  zh: zhInput,
});

export const whyItemInput = z.object({
  emoji: z.string().min(1).max(8),
  iconUrl: z.string().optional(),
  title: z.string().min(2),
  description: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  zh: zhInput,
});

export const classOfferingInput = z.object({
  name: z.string().min(2),
  description: z.string().min(2),
  imageUrl: z.string().optional(),
  whatsappMessage: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  zh: zhInput,
});

/** Rate-card row. Price is integer cents; the admin form types ringgit. */
export const pricingPlanInput = z.object({
  name: z.string().min(2),
  priceCents: z.coerce.number().int().min(0),
  unit: z.string().optional(),
  features: z.string().optional(),
  highlight: z.boolean().default(false),
  whatsappMessage: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  zh: zhInput,
});

export const faqItemInput = z.object({
  question: z.string().min(4),
  answer: z.string().min(2),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  zh: zhInput,
});

// Alt text is system-generated in the gallery router — never typed by hand.
export const galleryImageInput = z.object({
  imageUrl: z.string().min(4),
  label: z.string().optional(),
  caption: z.string().optional(),
  submittedBy: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

/** Promotion banner — portrait artwork, 9:16. */
export const promotionInput = z.object({
  imageUrl: z.string().min(4),
  title: z.string().min(2),
  whatsappMessage: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

/** Visitor photo submission — the name is the only thing they type. */
export const photoSubmissionInput = z.object({
  name: z.string().trim().min(2).max(40),
  caption: z.string().trim().max(80).optional(),
});

export const testimonialInput = z.object({
  author: z.string().min(2),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  quote: z.string().min(2),
  source: z.string().min(2).default("Google"),
  reviewedAt: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const socialLinkInput = z.object({
  platform: z.string().min(2),
  label: z.string().min(2),
  url: z.string().min(4),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const reorderInput = z.object({
  ids: z.array(z.uuid()).min(1),
});
