import { z } from "zod";

export const idSchema = z.object({ id: z.uuid() });

export const packageTypeSchema = z.enum(["single", "ten_class", "unlimited"]);
export const membershipStatusSchema = z.enum([
  "active",
  "expired",
  "cancelled",
]);
export const bookingStatusSchema = z.enum([
  "booked",
  "attended",
  "no_show",
  "cancelled",
]);
export const invoiceStatusSchema = z.enum(["pending", "paid", "cancelled"]);
export const paymentMethodSchema = z.enum([
  "cash",
  "bank_transfer",
  "tng",
  "card",
  "other",
]);
