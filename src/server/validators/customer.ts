import { z } from "zod";
import {
  customerSourceSchema,
  dateString,
  genderSchema,
  timeString,
} from "./common";

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

/** The trial slot booked alongside a customer — same shape as `trial.book`
 *  minus the customer id, which the create mutation supplies itself. */
export const trialBookingInput = z.object({
  date: dateString,
  startTime: timeString,
  endTime: timeString,
  coachId: z.uuid().optional(),
  notes: z.string().optional(),
});

export const createCustomerInput = customerInput.extend({
  trial: trialBookingInput.optional(),
});

export const updateCustomerInput = customerInput.extend({ id: z.uuid() });
