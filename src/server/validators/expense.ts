import { z } from "zod";
import { dateString, expenseCategorySchema } from "./common";

export const expenseInput = z.object({
  date: dateString,
  category: expenseCategorySchema,
  amountCents: z.coerce.number().int().min(1),
  coachId: z.uuid().optional(),
  vendor: z.string().optional(),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export const updateExpenseInput = expenseInput.extend({ id: z.uuid() });
