import { z } from "zod";
import { bookingStatusSchema } from "./common";

export const bookingInput = z.object({
  customerId: z.uuid(),
  classSessionId: z.uuid(),
  source: z.string().default("admin"),
  notes: z.string().optional(),
});

export const publicBookingInput = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  email: z.email().optional().or(z.literal("")),
  classSessionId: z.uuid(),
  notes: z.string().optional(),
});

export const updateBookingInput = z.object({
  id: z.uuid(),
  status: bookingStatusSchema,
});
