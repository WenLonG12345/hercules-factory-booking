import { z } from "zod";
import { invoiceStatusSchema, paymentMethodSchema } from "./common";

export const invoiceInput = z.object({
  customerId: z.uuid(),
  membershipId: z.uuid().optional().or(z.literal("")),
  subtotalCents: z.coerce.number().int().min(0),
  totalCents: z.coerce.number().int().min(0),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export const updateInvoiceInput = z.object({
  id: z.uuid(),
  status: invoiceStatusSchema,
});

export const paymentInput = z.object({
  invoiceId: z.uuid(),
  customerId: z.uuid(),
  amountCents: z.coerce.number().int().min(1),
  method: paymentMethodSchema,
  paidDate: z.string(),
  reference: z.string().optional(),
});
