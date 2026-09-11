import { desc, eq } from "drizzle-orm";
import {
  customerPackages,
  customers,
  invoices,
  packagePlans,
} from "@/db/schema";
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
   * window is the package window.
   *
   * The create page can hand over a name instead of a customer id, and the
   * payment alongside it. A name opens the account here rather than in a
   * detour the admin has to take first; a payment makes the invoice paid on
   * arrival and books its income row in this same call, so the ledger is
   * right without a second "mark paid" click. No payment and it lands
   * pending, exactly as before.
   */
  create: adminProcedure
    .input(invoiceInput)
    .mutation(async ({ ctx, input }) => {
      const plan = input.planId
        ? await ctx.db.query.packagePlans.findFirst({
            where: eq(packagePlans.id, input.planId),
          })
        : undefined;

      // Guaranteed by the validator's one-of refinement, but the customer row
      // has to exist before either the package or the invoice can point at it.
      const customerId =
        input.customerId ??
        (
          await ctx.db
            .insert(customers)
            .values({
              name: input.newCustomer?.name ?? "",
              phone: input.newCustomer?.phone ?? null,
              dateJoined: input.issueDate,
            })
            .returning()
        )[0].id;

      const totalCents = input.subtotalCents - input.discountCents;
      const paid = !!input.paymentMethod;

      const [pkg] = await ctx.db
        .insert(customerPackages)
        .values({
          customerId,
          planId: input.planId ?? null,
          type: input.packageType,
          startDate: input.validFrom,
          expiryDate: input.validUntil,
          totalCredits:
            input.packageType === "unlimited" ? null : input.totalCredits,
          amountPaidCents: paid ? totalCents : 0,
          paymentMethod: input.paymentMethod ?? null,
          notes: input.notes ?? null,
        })
        .returning();

      const rows = await ctx.db
        .insert(invoices)
        .values({
          customerId,
          packageId: pkg.id,
          description:
            input.description ?? plan?.name ?? `${input.packageType} package`,
          subtotalCents: input.subtotalCents,
          discountCents: input.discountCents,
          totalCents,
          status: paid ? "paid" : "pending",
          paymentMethod: input.paymentMethod ?? null,
          paidDate: paid ? (input.paidDate ?? input.issueDate) : null,
          issueDate: input.issueDate,
          dueDate: input.dueDate ?? null,
          validFrom: input.validFrom,
          validUntil: input.validUntil,
          notes: input.notes ?? null,
          invoiceNumber: await nextInvoiceNumber(ctx.db),
        })
        .returning();

      if (paid) await bookInvoiceIncome(ctx.db, rows[0]);

      return rows;
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
  /**
   * Deleting an invoice unwinds the whole sale. The ledger row goes first so
   * the money stops being counted even where SQLite foreign keys are off, and
   * the package sold by this invoice goes with it while it is still untouched
   * — a package with burned credits is left standing, because attendance
   * already happened against it.
   *
   * The number is freed by the delete itself: `nextInvoiceNumber` reads
   * max(invoice_number), so removing the newest invoice hands its number back
   * to the next one created.
   */
  delete: adminProcedure.input(idSchema).mutation(async ({ ctx, input }) => {
    const invoice = await ctx.db.query.invoices.findFirst({
      where: eq(invoices.id, input.id),
      with: { package: true },
    });
    if (!invoice) return [];

    await unbookInvoiceIncome(ctx.db, invoice.id);

    const deleted = await ctx.db
      .delete(invoices)
      .where(eq(invoices.id, invoice.id))
      .returning();

    if (invoice.package && invoice.package.usedCredits === 0) {
      await ctx.db
        .delete(customerPackages)
        .where(eq(customerPackages.id, invoice.package.id));
    }

    return deleted;
  }),
});
