import { desc, eq } from "drizzle-orm";
import {
  customerPackages,
  customers,
  invoices,
  sessionAttendees,
} from "@/db/schema";
import { bookTrialSession } from "@/server/services/business";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";
import { idSchema } from "@/server/validators/common";
import {
  createCustomerInput,
  updateCustomerInput,
} from "@/server/validators/customer";

export const customerRouter = createTRPCRouter({
  list: adminProcedure.query(({ ctx }) =>
    ctx.db.select().from(customers).orderBy(desc(customers.dateJoined)),
  ),
  profile: adminProcedure.input(idSchema).query(async ({ ctx, input }) => {
    const [[customer], packages, customerInvoices, history] = await Promise.all(
      [
        ctx.db.select().from(customers).where(eq(customers.id, input.id)),
        ctx.db
          .select()
          .from(customerPackages)
          .where(eq(customerPackages.customerId, input.id))
          .orderBy(desc(customerPackages.startDate)),
        ctx.db
          .select()
          .from(invoices)
          .where(eq(invoices.customerId, input.id))
          .orderBy(desc(invoices.issueDate)),
        ctx.db.query.sessionAttendees.findMany({
          where: eq(sessionAttendees.customerId, input.id),
          with: { session: true },
          orderBy: desc(sessionAttendees.createdAt),
          limit: 50,
        }),
      ],
    );

    return { customer, packages, invoices: customerInvoices, history };
  }),
  /**
   * Creates the customer and, when they came in off a trial class, the
   * one-seat trial session in the same call — the trial pipeline lives on the
   * customers page, so a signup never has to be entered twice.
   */
  create: adminProcedure
    .input(createCustomerInput)
    .mutation(async ({ ctx, input }) => {
      const { trial, ...values } = input;
      const rows = await ctx.db.insert(customers).values(values).returning();

      if (trial) {
        await bookTrialSession(ctx.db, { ...trial, customerId: rows[0].id });
      }

      return rows;
    }),
  update: adminProcedure
    .input(updateCustomerInput)
    .mutation(({ ctx, input }) => {
      const { id, ...values } = input;
      return ctx.db
        .update(customers)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(customers.id, id))
        .returning();
    }),
  delete: adminProcedure
    .input(idSchema)
    .mutation(({ ctx, input }) =>
      ctx.db.delete(customers).where(eq(customers.id, input.id)).returning(),
    ),
});
