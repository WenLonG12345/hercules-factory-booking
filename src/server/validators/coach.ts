import { z } from "zod";

export const coachInput = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  photoUrl: z.string().optional(),
  bio: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const updateCoachInput = coachInput.extend({ id: z.uuid() });
