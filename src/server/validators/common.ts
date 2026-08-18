import { z } from "zod";
import {
  ATTENDEE_STATUSES,
  CUSTOMER_SOURCES,
  GENDERS,
  INVOICE_STATUSES,
  LEDGER_DIRECTIONS,
  PACKAGE_TYPES,
  PAYMENT_METHODS,
  SESSION_TYPES,
} from "@/db/schema";

export const idSchema = z.object({ id: z.uuid() });

export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
export const timeString = z.string().regex(/^\d{2}:\d{2}$/, "Expected HH:MM");

export const packageTypeSchema = z.enum(PACKAGE_TYPES);
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);
export const invoiceStatusSchema = z.enum(INVOICE_STATUSES);
export const sessionTypeSchema = z.enum(SESSION_TYPES);
export const attendeeStatusSchema = z.enum(ATTENDEE_STATUSES);
export const customerSourceSchema = z.enum(CUSTOMER_SOURCES);
export const genderSchema = z.enum(GENDERS);
export const ledgerDirectionSchema = z.enum(LEDGER_DIRECTIONS);

/** A month, as YYYY-MM. */
export const monthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Expected YYYY-MM");
