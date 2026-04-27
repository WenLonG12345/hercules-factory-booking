import { and, desc, eq, gte, lte, sql, sum } from "drizzle-orm";
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

    const [summaryRows, recentPayments] = await Promise.all([
      ctx.db.execute<{
        totalCustomers: number;
        activeMemberships: number;
        monthlyRevenueCents: number;
        todayBookings: number;
      }>(sql`
        select
          (select count(*)::int from ${customers}) as "totalCustomers",
          (
            select count(*)::int
            from ${memberships}
            where ${memberships.status} = ${"active"}
          ) as "activeMemberships",
          (
            select coalesce(sum(${payments.amountCents}), 0)::int
            from ${payments}
            where ${payments.paidDate} >= ${monthStart}
          ) as "monthlyRevenueCents",
          (
            select count(*)::int
            from ${bookings}
            inner join ${classSessions}
              on ${classSessions.id} = ${bookings.classSessionId}
            where ${classSessions.sessionDate} = ${today}
          ) as "todayBookings"
      `),
      ctx.db.query.payments.findMany({
        with: { customer: true, invoice: true },
        orderBy: desc(payments.paidDate),
        limit: 5,
      }),
    ]);
    const summary = summaryRows[0];

    return {
      totalCustomers: summary?.totalCustomers ?? 0,
      activeMemberships: summary?.activeMemberships ?? 0,
      monthlyRevenueCents: summary?.monthlyRevenueCents ?? 0,
      todayBookings: summary?.todayBookings ?? 0,
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
