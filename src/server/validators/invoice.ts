import { z } from "zod";
import {
  dateString,
  invoiceStatusSchema,
  packageTypeSchema,
  paymentMethodSchema,
} from "./common";

/**
 * A package sold on one line. The window is the package window; credits are
 * required for every type but unlimited. Both dates are optional — the invoice
 * can be raised before the window is agreed and the dates filled in later.
 */
const itemPackage = z
  .object({
    type: packageTypeSchema,
    totalCredits: z.coerce.number().int().min(1).max(500).optional(),
    validFrom: dateString.optional(),
    validUntil: dateString.optional(),
  })
  .refine((v) => !v.validFrom || !v.validUntil || v.validUntil >= v.validFrom, {
    message: "Expiry date cannot be before the start date.",
    path: ["validUntil"],
  })
  .refine((v) => v.type === "unlimited" || v.totalCredits !== undefined, {
    message: "Credit, PT and kid packages need a credit total.",
    path: ["totalCredits"],
  });

/** One line: what it says, what it costs, and the package it sells if any. */
export const invoiceItemInput = z.object({
  /** Set when editing — an existing line keeps its row (and its package). */
  id: z.uuid().optional(),
  description: z.string().trim().min(1, "Every line needs a description."),
  amountCents: z.coerce.number().int().min(0),
  package: itemPackage.optional(),
});

export type InvoiceItemInput = z.infer<typeof invoiceItemInput>;

const invoiceFields = z.object({
  customerId: z.uuid(),
  items: z.array(invoiceItemInput).min(1, "Add at least one line."),
  discountCents: z.coerce.number().int().min(0).default(0),
  issueDate: dateString,
  dueDate: dateString.optional(),
  notes: z.string().optional(),
});

export const itemsSubtotal = (items: { amountCents: number }[]) =>
  items.reduce((sum, item) => sum + item.amountCents, 0);

const discountFitsSubtotal = (v: {
  discountCents: number;
  items: { amountCents: number }[];
}) => v.discountCents <= itemsSubtotal(v.items);

const discountError = {
  message: "Discount cannot be larger than the subtotal.",
  path: ["discountCents"],
};

/**
 * Creating an invoice IS selling what is on it — every package line opens a
 * package for the customer in the same call.
 *
 * Two more things the create page folds in, so the admin never leaves it:
 * - the customer, either an existing id or a name to open an account under
 *   (`newCustomer`) — exactly one of the two;
 * - the payment, which when present makes the invoice paid on arrival and
 *   books its income row in the same call.
 */
export const invoiceInput = invoiceFields
  .omit({ customerId: true })
  .extend({
    customerId: z.uuid().optional(),
    newCustomer: z
      .object({
        name: z.string().min(2),
        phone: z.string().min(8).optional(),
      })
      .optional(),
    /** Set together, and only when the money has already changed hands. */
    paymentMethod: paymentMethodSchema.optional(),
    paidDate: dateString.optional(),
  })
  .refine((v) => !!v.customerId !== !!v.newCustomer, {
    message: "Pick an existing customer or give a name for a new one.",
    path: ["customerId"],
  })
  .refine(discountFitsSubtotal, discountError)
  .refine((v) => !v.paidDate || !!v.paymentMethod, {
    message: "A paid date needs the payment method it was paid by.",
    path: ["paymentMethod"],
  });

export const updateInvoiceInput = invoiceFields
  .omit({ customerId: true })
  // paidDate only applies to an invoice that is already paid.
  .extend({ id: z.uuid(), paidDate: dateString.optional() })
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
