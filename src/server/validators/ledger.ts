import { z } from "zod";
import { dateString, ledgerDirectionSchema } from "./common";

export const ledgerCategoryInput = z.object({
  name: z.string().trim().min(1).max(60),
  direction: ledgerDirectionSchema,
});

export const updateLedgerCategoryInput = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(60).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isArchived: z.boolean().optional(),
});

export const ledgerEntryInput = z.object({
  date: dateString,
  direction: ledgerDirectionSchema,
  categoryId: z.uuid(),
  amountCents: z.coerce.number().int().min(1),
  customerId: z.uuid().optional(),
  coachId: z.uuid().optional(),
  vendor: z.string().optional(),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export const updateLedgerEntryInput = ledgerEntryInput
  .partial()
  .extend({ id: z.uuid() });
