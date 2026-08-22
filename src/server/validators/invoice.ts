import { z } from "zod";
import {
  dateString,
  invoiceStatusSchema,
  packageTypeSchema,
  paymentMethodSchema,
} from "./common";

const invoiceFields = z.object({
  customerId: z.uuid(),
  description: z.string().optional(),
  subtotalCents: z.coerce.number().int().min(0),
  discountCents: z.coerce.number().int().min(0).default(0),
  issueDate: dateString,
  dueDate: dateString.optional(),
  validFrom: dateString.optional(),
  validUntil: dateString.optional(),
  notes: z.string().optional(),
});

const discountFitsSubtotal = (v: {
  discountCents: number;
  subtotalCents: number;
}) => v.discountCents <= v.subtotalCents;

const discountError = {
  message: "Discount cannot be larger than the subtotal.",
  path: ["discountCents"],
};

/**
 * Creating an invoice IS selling the package — the two were always one act, so
 * one form does both. `validFrom`/`validUntil` are the package window, which is
 * why they stop being optional here.
 */
export const invoiceInput = invoiceFields
  .extend({
    planId: z.uuid().optional(),
    packageType: packageTypeSchema,
    totalCredits: z.coerce.number().int().min(1).max(500).optional(),
    validFrom: dateString,
    validUntil: dateString,
  })
  .refine(discountFitsSubtotal, discountError)
  .refine((v) => v.validUntil >= v.validFrom, {
    message: "Expiry date cannot be before the start date.",
    path: ["validUntil"],
  })
  .refine(
    (v) => v.packageType === "unlimited" || v.totalCredits !== undefined,
    {
      message: "Credit and PT packages need a credit total.",
      path: ["totalCredits"],
    },
  );

export const updateInvoiceInput = invoiceFields
  .extend({ id: z.uuid() })
  .refine(discountFitsSubtotal, discountError);

export const updateInvoiceStatusInput = z
  .object({
    id: z.uuid(),
    status: invoiceStatusSchema,
    paymentMethod: paymentMethodSchema.optional(),
    paidDate: dateString.optional(),
  })
  .refine((v) => v.status !== "paid" || !!v.paymentMethod, {
    message: "A paid invoice needs a payment method.",
    path: ["paymentMethod"],
  });
