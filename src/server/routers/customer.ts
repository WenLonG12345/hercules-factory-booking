import { desc, eq } from "drizzle-orm";
import {
  attendanceRecords,
  customers,
  invoices,
  memberships,
  payments,
} from "@/db/schema";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";
import { idSchema } from "@/server/validators/common";
import {
  customerInput,
  updateCustomerInput,
} from "@/server/validators/customer";

export const customerRouter = createTRPCRouter({
  list: adminProcedure.query(({ ctx }) =>
    ctx.db.select().from(customers).orderBy(desc(customers.createdAt)),
  ),
  byId: adminProcedure.input(idSchema).query(async ({ ctx, input }) => {
    const [customer] = await ctx.db
      .select()
      .from(customers)
      .where(eq(customers.id, input.id));
    return customer;
  }),
  profile: adminProcedure.input(idSchema).query(async ({ ctx, input }) => {
    const [customer] = await ctx.db
      .select()
      .from(customers)
      .where(eq(customers.id, input.id));

    const customerMemberships = await ctx.db.query.memberships.findMany({
      where: eq(memberships.customerId, input.id),
      with: { package: true },
      orderBy: desc(memberships.createdAt),
    });

    const customerInvoices = await ctx.db
      .select()
      .from(invoices)
      .where(eq(invoices.customerId, input.id))
      .orderBy(desc(invoices.createdAt));

    const customerPayments = await ctx.db
      .select()
      .from(payments)
      .where(eq(payments.customerId, input.id))
      .orderBy(desc(payments.paidDate));

    const attendanceHistory = await ctx.db.query.attendanceRecords.findMany({
      where: eq(attendanceRecords.customerId, input.id),
      with: { classSession: true },
      orderBy: desc(attendanceRecords.checkedInAt),
    });

    return {
      customer,
      memberships: customerMemberships,
      invoices: customerInvoices,
      payments: customerPayments,
      attendanceHistory,
    };
  }),
  create: adminProcedure
    .input(customerInput)
    .mutation(({ ctx, input }) =>
      ctx.db.insert(customers).values(input).returning(),
    ),
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
