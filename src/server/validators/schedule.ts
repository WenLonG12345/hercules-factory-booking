import { z } from "zod";
import {
  attendeeStatusSchema,
  dateString,
  sessionTypeSchema,
  timeString,
} from "./common";

export const sessionInput = z
  .object({
    type: sessionTypeSchema,
    title: z.string().min(2),
    date: dateString,
    startTime: timeString,
    endTime: timeString,
    capacity: z.coerce.number().int().min(1).max(80),
    coachId: z.uuid().optional(),
    notes: z.string().optional(),
    // Recurrence: which weekdays (0 = Sunday) to repeat on, and when to stop.
    // No days means "same weekday, every week".
    repeatUntil: dateString.optional(),
    repeatDays: z.array(z.coerce.number().int().min(0).max(6)).optional(),
  })
  .refine((v) => v.endTime > v.startTime, {
    message: "End time must be after the start time.",
    path: ["endTime"],
  })
  .refine((v) => !v.repeatUntil || v.repeatUntil >= v.date, {
    message: "Repeat-until date cannot be before the session date.",
    path: ["repeatUntil"],
  })
  .refine((v) => !v.repeatDays?.length || !!v.repeatUntil, {
    message: "Pick an end date for the repeating days.",
    path: ["repeatUntil"],
  });

export const updateSessionInput = z.object({
  id: z.uuid(),
  title: z.string().min(2),
  date: dateString,
  startTime: timeString,
  endTime: timeString,
  capacity: z.coerce.number().int().min(1).max(80),
  coachId: z.uuid().optional(),
  isCancelled: z.boolean().optional(),
  cancellationReason: z.string().optional(),
  notes: z.string().optional(),
});

export const addAttendeeInput = z.object({
  sessionId: z.uuid(),
  customerId: z.uuid(),
  packageId: z.uuid().optional(),
});

export const setAttendanceInput = z.object({
  attendeeId: z.uuid(),
  status: attendeeStatusSchema.exclude(["converted"]),
});

export const weekInput = z.object({ from: dateString, to: dateString });
