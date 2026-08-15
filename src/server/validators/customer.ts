import { z } from "zod";
import { customerSourceSchema, dateString, genderSchema } from "./common";

export const customerInput = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  age: z.coerce.number().int().min(3).max(100).optional(),
  gender: genderSchema.optional(),
  emergencyContact: z.string().optional(),
  dateJoined: dateString,
  source: customerSourceSchema.optional(),
  notes: z.string().optional(),
});

export const updateCustomerInput = customerInput.extend({ id: z.uuid() });
