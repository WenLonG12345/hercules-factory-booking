import { desc, eq } from "drizzle-orm";
import { invoices } from "@/db/schema";
import { createInvoice, recordPayment } from "@/server/services/business";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";
import {
  invoiceInput,
  paymentInput,
  updateInvoiceInput,
} from "@/server/validators/invoice";

export const invoiceRouter = createTRPCRouter({
  list: adminProcedure.query(({ ctx }) =>
    ctx.db.query.invoices.findMany({
      with: {
        customer: true,
        payments: true,
        membership: { with: { package: true } },
      },
      orderBy: desc(invoices.createdAt),
    }),
  ),
  create: adminProcedure.input(invoiceInput).mutation(({ ctx, input }) =>
    createInvoice(ctx.db, {
      ...input,
      membershipId: input.membershipId || null,
    }),
  ),
  updateStatus: adminProcedure
    .input(updateInvoiceInput)
    .mutation(({ ctx, input }) =>
      ctx.db
        .update(invoices)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(invoices.id, input.id))
        .returning(),
    ),
  recordPayment: adminProcedure
    .input(paymentInput)
    .mutation(({ ctx, input }) => recordPayment(ctx.db, input)),
});
