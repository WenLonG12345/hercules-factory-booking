import { z } from "zod";

export const classSessionInput = z.object({
  title: z.string().min(2).default("Muay Thai Class"),
  sessionDate: z.string(),
  dayOfWeek: z.coerce.number().int().min(1).max(6),
  startTime: z.string(),
  endTime: z.string(),
  capacity: z.coerce.number().int().min(1).max(80),
  coachName: z.string().optional(),
});

export const updateClassSessionInput = classSessionInput.partial().extend({
  id: z.uuid(),
  isCancelled: z.coerce.boolean().optional(),
  cancellationReason: z.string().optional(),
});
