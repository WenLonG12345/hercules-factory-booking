import { desc, eq } from "drizzle-orm";
import { invoices } from "@/db/schema";
import {
  bookInvoiceIncome,
  nextInvoiceNumber,
  unbookInvoiceIncome,
} from "@/server/services/business";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";
import { idSchema } from "@/server/validators/common";
import {
  invoiceInput,
  updateInvoiceStatusInput,
} from "@/server/validators/invoice";

export const invoiceRouter = createTRPCRouter({
  list: adminProcedure.query(({ ctx }) =>
    ctx.db.query.invoices.findMany({
      with: { customer: true, package: true },
      orderBy: desc(invoices.issueDate),
    }),
  ),
  create: adminProcedure.input(invoiceInput).mutation(async ({ ctx, input }) =>
    ctx.db
      .insert(invoices)
      .values({
        ...input,
        packageId: input.packageId ?? null,
        totalCents: input.subtotalCents - input.discountCents,
        invoiceNumber: await nextInvoiceNumber(ctx.db),
      })
      .returning(),
  ),
  /**
   * Marking an invoice paid books the income row in the ledger; moving it back
   * to pending or cancelled removes that row again. The ledger is the only
   * place income is counted from.
   */
  updateStatus: adminProcedure
    .input(updateInvoiceStatusInput)
    .mutation(async ({ ctx, input }) => {
      const [invoice] = await ctx.db
        .update(invoices)
        .set({
          status: input.status,
          paymentMethod: input.status === "paid" ? input.paymentMethod : null,
          paidDate:
            input.status === "paid"
              ? (input.paidDate ?? new Date().toISOString().slice(0, 10))
              : null,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, input.id))
        .returning();

      if (invoice) {
        if (invoice.status === "paid") await bookInvoiceIncome(ctx.db, invoice);
        else await unbookInvoiceIncome(ctx.db, invoice.id);
      }

      return invoice ? [invoice] : [];
    }),
  delete: adminProcedure
    .input(idSchema)
    .mutation(({ ctx, input }) =>
      ctx.db.delete(invoices).where(eq(invoices.id, input.id)).returning(),
    ),
});
