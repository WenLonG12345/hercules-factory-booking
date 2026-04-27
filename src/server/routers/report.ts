import { and, count, desc, eq, gte, lte, sum } from "drizzle-orm";
import { z } from "zod";
import {
  bookings,
  classSessions,
  customers,
  memberships,
  packages,
  payments,
} from "@/db/schema";
import { toDateInputValue } from "@/lib/utils";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";

const rangeInput = z.object({
  from: z.string(),
  to: z.string(),
});

export const reportRouter = createTRPCRouter({
  revenue: adminProcedure.input(rangeInput).query(({ ctx, input }) =>
    ctx.db
      .select({
        totalCents: sum(payments.amountCents),
      })
      .from(payments)
      .where(
        and(
          gte(payments.paidDate, input.from),
          lte(payments.paidDate, input.to),
        ),
      ),
  ),
  revenueByPackage: adminProcedure.query(({ ctx }) =>
    ctx.db
      .select({
        packageName: packages.name,
        packageType: packages.type,
        totalCents: sum(payments.amountCents),
      })
      .from(payments)
      .innerJoin(memberships, eq(memberships.customerId, payments.customerId))
      .innerJoin(packages, eq(packages.id, memberships.packageId))
      .groupBy(packages.name, packages.type),
  ),
  dashboardStats: adminProcedure.query(async ({ ctx }) => {
    const today = toDateInputValue(new Date());
    const monthStart = `${today.slice(0, 8)}01`;

    const [
      [customerCount],
      [membershipCount],
      [revenue],
      [bookingCount],
      recentPayments,
    ] = await Promise.all([
      ctx.db.select({ value: count() }).from(customers),
      ctx.db
        .select({ value: count() })
        .from(memberships)
        .where(eq(memberships.status, "active")),
      ctx.db
        .select({ value: sum(payments.amountCents) })
        .from(payments)
        .where(gte(payments.paidDate, monthStart)),
      ctx.db
        .select({ value: count() })
        .from(bookings)
        .innerJoin(classSessions, eq(classSessions.id, bookings.classSessionId))
        .where(eq(classSessions.sessionDate, today)),
      ctx.db.query.payments.findMany({
        with: { customer: true, invoice: true },
        orderBy: desc(payments.paidDate),
        limit: 5,
      }),
    ]);

    return {
      totalCustomers: customerCount.value,
      activeMemberships: membershipCount.value,
      monthlyRevenueCents: Number(revenue.value ?? 0),
      todayBookings: bookingCount.value,
      recentPayments,
    };
  }),
  revenueReport: adminProcedure.query(async ({ ctx }) => {
    const today = toDateInputValue(new Date());
    const monthStart = `${today.slice(0, 8)}01`;

    const [daily, monthly, paymentRows, byPackage] = await Promise.all([
      ctx.db
        .select({ value: sum(payments.amountCents) })
        .from(payments)
        .where(eq(payments.paidDate, today)),
      ctx.db
        .select({ value: sum(payments.amountCents) })
        .from(payments)
        .where(
          and(
            gte(payments.paidDate, monthStart),
            lte(payments.paidDate, today),
          ),
        ),
      ctx.db.query.payments.findMany({
        with: { customer: true, invoice: true },
        orderBy: desc(payments.paidDate),
      }),
      ctx.db
        .select({
          packageType: packages.type,
          totalCents: sum(payments.amountCents),
        })
        .from(payments)
        .innerJoin(memberships, eq(memberships.customerId, payments.customerId))
        .innerJoin(packages, eq(packages.id, memberships.packageId))
        .groupBy(packages.type),
    ]);

    return {
      dailyRevenueCents: Number(daily[0]?.value ?? 0),
      monthlyRevenueCents: Number(monthly[0]?.value ?? 0),
      payments: paymentRows,
      byPackage,
    };
  }),
});
