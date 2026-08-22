import { desc, eq } from "drizzle-orm";
import { customerPackages, invoices, packagePlans } from "@/db/schema";
import {
  bookInvoiceIncome,
  nextInvoiceNumber,
  unbookInvoiceIncome,
} from "@/server/services/business";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";
import { idSchema } from "@/server/validators/common";
import {
  invoiceInput,
  updateInvoiceInput,
  updateInvoiceStatusInput,
} from "@/server/validators/invoice";

export const invoiceRouter = createTRPCRouter({
  list: adminProcedure.query(({ ctx }) =>
    ctx.db.query.invoices.findMany({
      with: { customer: true, package: true },
      orderBy: desc(invoices.issueDate),
    }),
  ),
  /**
   * Issuing an invoice IS selling the package — one act, one call. The package
   * row is written first so the invoice can point at it; the invoice's validity
   * window is the package window. The income is booked only when the invoice is
   * marked paid, same as every other invoice.
   */
  create: adminProcedure
    .input(invoiceInput)
    .mutation(async ({ ctx, input }) => {
      const plan = input.planId
        ? await ctx.db.query.packagePlans.findFirst({
            where: eq(packagePlans.id, input.planId),
          })
        : undefined;

      const totalCents = input.subtotalCents - input.discountCents;

      const [pkg] = await ctx.db
        .insert(customerPackages)
        .values({
          customerId: input.customerId,
          planId: input.planId ?? null,
          type: input.packageType,
          startDate: input.validFrom,
          expiryDate: input.validUntil,
          totalCredits:
            input.packageType === "unlimited" ? null : input.totalCredits,
          amountPaidCents: totalCents,
          notes: input.notes ?? null,
        })
        .returning();

      return ctx.db
        .insert(invoices)
        .values({
          customerId: input.customerId,
          packageId: pkg.id,
          description:
            input.description ?? plan?.name ?? `${input.packageType} package`,
          subtotalCents: input.subtotalCents,
          discountCents: input.discountCents,
          totalCents,
          issueDate: input.issueDate,
          dueDate: input.dueDate ?? null,
          validFrom: input.validFrom,
          validUntil: input.validUntil,
          notes: input.notes ?? null,
          invoiceNumber: await nextInvoiceNumber(ctx.db),
        })
        .returning();
    }),
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
  /**
   * Edit an issued invoice. The number and the status stay put — status moves
   * through updateStatus, which is what books the income. A paid invoice
   * re-books so an edited total lands in the ledger too (the unique
   * invoice_id makes that an update, not a second row).
   */
  update: adminProcedure
    .input(updateInvoiceInput)
    .mutation(async ({ ctx, input }) => {
      const { id, ...values } = input;
      const [invoice] = await ctx.db
        .update(invoices)
        .set({
          ...values,
          description: values.description ?? null,
          dueDate: values.dueDate ?? null,
          validFrom: values.validFrom ?? null,
          validUntil: values.validUntil ?? null,
          notes: values.notes ?? null,
          totalCents: values.subtotalCents - values.discountCents,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, id))
        .returning();

      if (invoice?.status === "paid") await bookInvoiceIncome(ctx.db, invoice);

      return invoice ? [invoice] : [];
    }),
  delete: adminProcedure
    .input(idSchema)
    .mutation(({ ctx, input }) =>
      ctx.db.delete(invoices).where(eq(invoices.id, input.id)).returning(),
    ),
});
