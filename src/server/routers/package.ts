import { and, desc, eq } from "drizzle-orm";
import {
  customerPackages,
  invoices,
  packagePlans,
  sessionAttendees,
} from "@/db/schema";
import {
  bookInvoiceIncome,
  nextInvoiceNumber,
} from "@/server/services/business";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";
import { idSchema } from "@/server/validators/common";
import { packageInput, updatePackageInput } from "@/server/validators/package";

export const packageRouter = createTRPCRouter({
  list: adminProcedure.query(({ ctx }) =>
    ctx.db.query.customerPackages.findMany({
      with: { customer: true },
      orderBy: desc(customerPackages.startDate),
    }),
  ),
  byCustomer: adminProcedure
    .input(idSchema)
    .query(({ ctx, input }) =>
      ctx.db
        .select()
        .from(customerPackages)
        .where(eq(customerPackages.customerId, input.id))
        .orderBy(desc(customerPackages.startDate)),
    ),
  /**
   * Sell a package. Optionally writes the invoice in the same call — that is
   * what "Customer → Package → Invoice" means in practice, and it saves the
   * admin re-keying the amount.
   */
  create: adminProcedure
    .input(packageInput)
    .mutation(async ({ ctx, input }) => {
      const {
        createInvoice,
        discountCents,
        markInvoicePaid,
        convertedFromSessionId,
        ...values
      } = input;

      const [pkg] = await ctx.db
        .insert(customerPackages)
        .values({
          ...values,
          totalCredits:
            values.type === "unlimited" ? null : values.totalCredits,
          convertedFromSessionId: convertedFromSessionId ?? null,
        })
        .returning();

      if (convertedFromSessionId) {
        await ctx.db
          .update(sessionAttendees)
          .set({ status: "converted", updatedAt: new Date() })
          .where(
            and(
              eq(sessionAttendees.sessionId, convertedFromSessionId),
              eq(sessionAttendees.customerId, input.customerId),
            ),
          );
      }

      if (createInvoice) {
        const subtotalCents = input.amountPaidCents + discountCents;
        // Name the plan on the invoice when it was sold off the price list.
        const plan = input.planId
          ? await ctx.db.query.packagePlans.findFirst({
              where: eq(packagePlans.id, input.planId),
            })
          : undefined;
        const [invoice] = await ctx.db
          .insert(invoices)
          .values({
            invoiceNumber: await nextInvoiceNumber(ctx.db),
            customerId: input.customerId,
            packageId: pkg.id,
            description: plan?.name ?? `${input.type} package`,
            subtotalCents,
            discountCents,
            totalCents: input.amountPaidCents,
            status: markInvoicePaid ? "paid" : "pending",
            paymentMethod: markInvoicePaid ? input.paymentMethod : null,
            issueDate: input.startDate,
            paidDate: markInvoicePaid ? input.startDate : null,
          })
          .returning();

        // A paid invoice books one income row — the ledger is the only place
        // money is counted, so the sale must not write the invoice alone.
        if (invoice.status === "paid") await bookInvoiceIncome(ctx.db, invoice);
      }

      return pkg;
    }),
  update: adminProcedure
    .input(updatePackageInput)
    .mutation(({ ctx, input }) => {
      const { id, ...values } = input;
      return ctx.db
        .update(customerPackages)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(customerPackages.id, id))
        .returning();
    }),
  delete: adminProcedure
    .input(idSchema)
    .mutation(({ ctx, input }) =>
      ctx.db
        .delete(customerPackages)
        .where(eq(customerPackages.id, input.id))
        .returning(),
    ),
});
