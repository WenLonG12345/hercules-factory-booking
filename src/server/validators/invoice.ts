import { z } from "zod";
import { dateString, invoiceStatusSchema, paymentMethodSchema } from "./common";

export const invoiceInput = z
  .object({
    customerId: z.uuid(),
    packageId: z.uuid().optional(),
    description: z.string().optional(),
    subtotalCents: z.coerce.number().int().min(0),
    discountCents: z.coerce.number().int().min(0).default(0),
    issueDate: dateString,
    dueDate: dateString.optional(),
    notes: z.string().optional(),
  })
  .refine((v) => v.discountCents <= v.subtotalCents, {
    message: "Discount cannot be larger than the subtotal.",
    path: ["discountCents"],
  });

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
