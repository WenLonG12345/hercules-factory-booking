import { z } from "zod";
import { membershipStatusSchema } from "./common";

export const membershipInput = z.object({
  customerId: z.uuid(),
  packageId: z.uuid(),
  startDate: z.string(),
});

export const updateMembershipInput = z.object({
  id: z.uuid(),
  status: membershipStatusSchema.optional(),
  expiryDate: z.string().optional(),
  remainingCredits: z.coerce.number().int().min(0).optional(),
});
