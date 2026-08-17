import { z } from "zod";
import { dateString, packageTypeSchema, paymentMethodSchema } from "./common";

/** A price-list entry, not a sale. Selling one copies its numbers. */
export const packagePlanInput = z
  .object({
    name: z.string().min(2),
    type: packageTypeSchema,
    totalCredits: z.coerce.number().int().min(1).max(500).optional(),
    priceCents: z.coerce.number().int().min(0),
    validityDays: z.coerce.number().int().min(1).max(3650),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.coerce.number().int().default(0),
  })
  .refine((v) => v.type === "unlimited" || v.totalCredits !== undefined, {
    message: "Credit and PT plans need a credit total.",
    path: ["totalCredits"],
  });

export const updatePackagePlanInput = z
  .object({
    id: z.uuid(),
    name: z.string().min(2),
    type: packageTypeSchema,
    totalCredits: z.coerce.number().int().min(1).max(500).optional(),
    priceCents: z.coerce.number().int().min(0),
    validityDays: z.coerce.number().int().min(1).max(3650),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.coerce.number().int().default(0),
  })
  .refine((v) => v.type === "unlimited" || v.totalCredits !== undefined, {
    message: "Credit and PT plans need a credit total.",
    path: ["totalCredits"],
  });

export const packageInput = z
  .object({
    customerId: z.uuid(),
    planId: z.uuid().optional(),
    type: packageTypeSchema,
    startDate: dateString,
    expiryDate: dateString,
    totalCredits: z.coerce.number().int().min(1).max(500).optional(),
    amountPaidCents: z.coerce.number().int().min(0),
    paymentMethod: paymentMethodSchema,
    notes: z.string().optional(),
    convertedFromSessionId: z.uuid().optional(),
    // Ticked in the sell dialog — writes the invoice in the same mutation.
    createInvoice: z.boolean().default(false),
    discountCents: z.coerce.number().int().min(0).default(0),
    markInvoicePaid: z.boolean().default(true),
  })
  .refine((v) => v.expiryDate >= v.startDate, {
    message: "Expiry date cannot be before the start date.",
    path: ["expiryDate"],
  })
  .refine((v) => v.type === "unlimited" || v.totalCredits !== undefined, {
    message: "Credit and PT packages need a credit total.",
    path: ["totalCredits"],
  });

export const updatePackageInput = z.object({
  id: z.uuid(),
  startDate: dateString,
  expiryDate: dateString,
  totalCredits: z.coerce.number().int().min(1).max(500).optional(),
  usedCredits: z.coerce.number().int().min(0),
  amountPaidCents: z.coerce.number().int().min(0),
  paymentMethod: paymentMethodSchema,
  notes: z.string().optional(),
});
