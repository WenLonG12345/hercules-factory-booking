import { z } from "zod";

export const customerInput = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  email: z.email().optional().or(z.literal("")),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
});

export const updateCustomerInput = customerInput.extend({
  id: z.uuid(),
});
