import { asc, desc, eq } from "drizzle-orm";
import { customers, invoiceItems, invoices } from "@/db/schema";
import {
  bookInvoiceIncome,
  nextInvoiceNumber,
  unbookInvoiceIncome,
  writeInvoiceLines,
} from "@/server/services/business";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";
import { idSchema } from "@/server/validators/common";
import {
  invoiceInput,
  itemsSubtotal,
  updateInvoiceInput,
  updateInvoiceStatusInput,
} from "@/server/validators/invoice";

/** Lines in the order they were written, each with the package it sold. */
const withLines = {
  customer: true,
  items: {
    with: { package: true },
    orderBy: asc(invoiceItems.sortOrder),
  },
} as const;

export const invoiceRouter = createTRPCRouter({
  list: adminProcedure.query(({ ctx }) =>
    ctx.db.query.invoices.findMany({
      with: withLines,
      orderBy: desc(invoices.issueDate),
    }),
  ),
  /**
   * Issuing an invoice IS selling what is on it — one act, one call. The
   * invoice row is written first so its lines can point at it; each package
   * line then opens a package for the customer.
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
      // Guaranteed by the validator's one-of refinement, but the customer row
      // has to exist before either the packages or the invoice can point at it.
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

      const subtotalCents = itemsSubtotal(input.items);
      const paid = !!input.paymentMethod;

      const rows = await ctx.db
        .insert(invoices)
        .values({
          customerId,
          subtotalCents,
          discountCents: input.discountCents,
          totalCents: subtotalCents - input.discountCents,
          status: paid ? "paid" : "pending",
          paymentMethod: input.paymentMethod ?? null,
          paidDate: paid ? (input.paidDate ?? input.issueDate) : null,
          issueDate: input.issueDate,
          dueDate: input.dueDate ?? null,
          notes: input.notes ?? null,
          invoiceNumber: await nextInvoiceNumber(ctx.db),
        })
        .returning();

      await writeInvoiceLines(
        ctx.db,
        {
          id: rows[0].id,
          customerId,
          notes: input.notes ?? null,
          paymentMethod: input.paymentMethod ?? null,
          paid,
        },
        input.items,
        [],
      );

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
   * Edit an issued invoice, lines included. The number and the status stay
   * put — status moves through updateStatus, which is what books the income.
   * A paid invoice re-books so an edited total or paid date lands in the ledger too (the
   * unique invoice_id makes that an update, not a second row).
   */
  update: adminProcedure
    .input(updateInvoiceInput)
    .mutation(async ({ ctx, input }) => {
      const current = await ctx.db.query.invoices.findFirst({
        where: eq(invoices.id, input.id),
        with: withLines,
      });
      if (!current) return [];

      const subtotalCents = itemsSubtotal(input.items);
      const [invoice] = await ctx.db
        .update(invoices)
        .set({
          subtotalCents,
          discountCents: input.discountCents,
          totalCents: subtotalCents - input.discountCents,
          issueDate: input.issueDate,
          dueDate: input.dueDate ?? null,
          notes: input.notes ?? null,
          ...(current.status === "paid" && input.paidDate
            ? { paidDate: input.paidDate }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, input.id))
        .returning();

      await writeInvoiceLines(
        ctx.db,
        {
          id: invoice.id,
          customerId: invoice.customerId,
          notes: invoice.notes,
          paymentMethod: invoice.paymentMethod,
          paid: invoice.status === "paid",
        },
        input.items,
        current.items,
      );

      if (invoice.status === "paid") await bookInvoiceIncome(ctx.db, invoice);

      return [invoice];
    }),
  /**
   * Deleting an invoice unwinds the whole sale. The ledger row goes first so
   * the money stops being counted even where SQLite foreign keys are off, and
   * every package sold on it goes with it while still untouched — a package
   * with burned credits is left standing, because attendance already
   * happened against it.
   *
   * The number is freed by the delete itself: `nextInvoiceNumber` reads
   * max(invoice_number), so removing the newest invoice hands its number back
   * to the next one created.
   */
  delete: adminProcedure.input(idSchema).mutation(async ({ ctx, input }) => {
    const invoice = await ctx.db.query.invoices.findFirst({
      where: eq(invoices.id, input.id),
      with: withLines,
    });
    if (!invoice) return [];

    await unbookInvoiceIncome(ctx.db, invoice.id);
    // Dropping every line releases its package; the cascade would take the
    // rows anyway, but not where SQLite foreign keys are off.
    await writeInvoiceLines(
      ctx.db,
      { ...invoice, paid: false },
      [],
      invoice.items,
    );

    return ctx.db
      .delete(invoices)
      .where(eq(invoices.id, invoice.id))
      .returning();
  }),
});
