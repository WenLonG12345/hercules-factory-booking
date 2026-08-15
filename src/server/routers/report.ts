import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import {
  coaches,
  customerPackages,
  customers,
  expenses,
  invoices,
  sessionAttendees,
  sessions,
} from "@/db/schema";
import { addDays, toDateInputValue } from "@/lib/utils";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";
import { monthSchema } from "@/server/validators/common";

function monthBounds(month: string) {
  return { from: `${month}-01`, to: `${month}-31` };
}

export const reportRouter = createTRPCRouter({
  /** Every dashboard tile, one round trip for the counters plus three lists. */
  dashboard: adminProcedure.query(async ({ ctx }) => {
    const today = toDateInputValue(new Date());
    const month = today.slice(0, 7);
    const { from, to } = monthBounds(month);
    const soon = toDateInputValue(addDays(new Date(), 14));

    const [counters, expiring, unpaid, upcomingTrials] = await Promise.all([
      ctx.db.get<{
        todayClasses: number;
        todayPt: number;
        todayTrials: number;
        newCustomers: number;
        todayIncomeCents: number;
        monthIncomeCents: number;
        monthExpenseCents: number;
      }>(sql`
        select
          (select count(*) from ${sessions}
            where ${sessions.date} = ${today}
              and ${sessions.type} = 'class'
              and ${sessions.isCancelled} = 0) as "todayClasses",
          (select count(*) from ${sessions}
            where ${sessions.date} = ${today}
              and ${sessions.type} = 'pt'
              and ${sessions.isCancelled} = 0) as "todayPt",
          (select count(*) from ${sessions}
            where ${sessions.date} = ${today}
              and ${sessions.type} = 'trial'
              and ${sessions.isCancelled} = 0) as "todayTrials",
          (select count(*) from ${customers}
            where ${customers.dateJoined} = ${today}) as "newCustomers",
          (select coalesce(sum(${invoices.totalCents}), 0) from ${invoices}
            where ${invoices.status} = 'paid'
              and ${invoices.paidDate} = ${today}) as "todayIncomeCents",
          (select coalesce(sum(${invoices.totalCents}), 0) from ${invoices}
            where ${invoices.status} = 'paid'
              and ${invoices.paidDate} between ${from} and ${to}) as "monthIncomeCents",
          (select coalesce(sum(${expenses.amountCents}), 0) from ${expenses}
            where ${expenses.date} between ${from} and ${to}) as "monthExpenseCents"
      `),
      ctx.db.query.customerPackages.findMany({
        where: and(
          gte(customerPackages.expiryDate, today),
          lte(customerPackages.expiryDate, soon),
        ),
        with: { customer: true },
        orderBy: asc(customerPackages.expiryDate),
      }),
      ctx.db.query.invoices.findMany({
        where: eq(invoices.status, "pending"),
        with: { customer: true },
        orderBy: asc(invoices.issueDate),
      }),
      ctx.db.query.sessions.findMany({
        where: and(eq(sessions.type, "trial"), gte(sessions.date, today)),
        with: { attendees: { with: { customer: true } } },
        orderBy: [asc(sessions.date), asc(sessions.startTime)],
        limit: 10,
      }),
    ]);

    const monthIncomeCents = counters?.monthIncomeCents ?? 0;
    const monthExpenseCents = counters?.monthExpenseCents ?? 0;

    return {
      todayClasses: counters?.todayClasses ?? 0,
      todayPt: counters?.todayPt ?? 0,
      todayTrials: counters?.todayTrials ?? 0,
      newCustomers: counters?.newCustomers ?? 0,
      todayIncomeCents: counters?.todayIncomeCents ?? 0,
      monthIncomeCents,
      monthExpenseCents,
      monthNetCents: monthIncomeCents - monthExpenseCents,
      // "Nearly out of credits" counts as expiring too.
      expiring: expiring.filter(
        (pkg) =>
          pkg.totalCredits === null ||
          pkg.totalCredits - pkg.usedCredits <= 2 ||
          pkg.expiryDate <= soon,
      ),
      unpaid,
      unpaidTotalCents: unpaid.reduce((sum, inv) => sum + inv.totalCents, 0),
      upcomingTrials,
    };
  }),

  monthly: adminProcedure
    .input(z.object({ month: monthSchema }))
    .query(async ({ ctx, input }) => {
      const { from, to } = monthBounds(input.month);

      const [
        incomeByType,
        expenseByCategory,
        newCustomers,
        trials,
        perCoach,
        paidInvoices,
      ] = await Promise.all([
        ctx.db
          .select({
            type: sql<string>`coalesce(${customerPackages.type}, 'other')`,
            totalCents: sql<number>`coalesce(sum(${invoices.totalCents}), 0)`,
          })
          .from(invoices)
          .leftJoin(
            customerPackages,
            eq(customerPackages.id, invoices.packageId),
          )
          .where(
            and(
              eq(invoices.status, "paid"),
              gte(invoices.paidDate, from),
              lte(invoices.paidDate, to),
            ),
          )
          .groupBy(customerPackages.type),
        ctx.db
          .select({
            category: expenses.category,
            totalCents: sql<number>`coalesce(sum(${expenses.amountCents}), 0)`,
          })
          .from(expenses)
          .where(and(gte(expenses.date, from), lte(expenses.date, to)))
          .groupBy(expenses.category),
        ctx.db
          .select({ value: sql<number>`count(*)` })
          .from(customers)
          .where(
            and(gte(customers.dateJoined, from), lte(customers.dateJoined, to)),
          ),
        ctx.db
          .select({
            status: sessionAttendees.status,
            value: sql<number>`count(*)`,
          })
          .from(sessionAttendees)
          .innerJoin(sessions, eq(sessions.id, sessionAttendees.sessionId))
          .where(
            and(
              eq(sessions.type, "trial"),
              gte(sessions.date, from),
              lte(sessions.date, to),
            ),
          )
          .groupBy(sessionAttendees.status),
        ctx.db
          .select({
            coachId: coaches.id,
            coachName: coaches.name,
            sessionCount: sql<number>`count(distinct ${sessions.id})`,
            headcount: sql<number>`count(${sessionAttendees.id})`,
          })
          .from(coaches)
          .leftJoin(
            sessions,
            and(
              eq(sessions.coachId, coaches.id),
              gte(sessions.date, from),
              lte(sessions.date, to),
            ),
          )
          .leftJoin(
            sessionAttendees,
            and(
              eq(sessionAttendees.sessionId, sessions.id),
              eq(sessionAttendees.status, "attended"),
            ),
          )
          .groupBy(coaches.id, coaches.name),
        ctx.db.query.invoices.findMany({
          where: and(
            eq(invoices.status, "paid"),
            gte(invoices.paidDate, from),
            lte(invoices.paidDate, to),
          ),
          with: { customer: true },
          orderBy: desc(invoices.paidDate),
        }),
      ]);

      const salaries = await ctx.db
        .select({
          coachId: expenses.coachId,
          totalCents: sql<number>`coalesce(sum(${expenses.amountCents}), 0)`,
        })
        .from(expenses)
        .where(
          and(
            eq(expenses.category, "coach_salary"),
            gte(expenses.date, from),
            lte(expenses.date, to),
          ),
        )
        .groupBy(expenses.coachId);

      const totalIncomeCents = incomeByType.reduce(
        (sum, row) => sum + Number(row.totalCents),
        0,
      );
      const totalExpenseCents = expenseByCategory.reduce(
        (sum, row) => sum + Number(row.totalCents),
        0,
      );
      const trialsTotal = trials.reduce(
        (sum, row) => sum + Number(row.value),
        0,
      );
      const trialsConverted = Number(
        trials.find((row) => row.status === "converted")?.value ?? 0,
      );

      return {
        month: input.month,
        totalIncomeCents,
        totalExpenseCents,
        netCents: totalIncomeCents - totalExpenseCents,
        incomeByType,
        expenseByCategory,
        newCustomers: Number(newCustomers[0]?.value ?? 0),
        trialsTotal,
        trialsConverted,
        perCoach: perCoach.map((coach) => ({
          ...coach,
          salaryCents: Number(
            salaries.find((s) => s.coachId === coach.coachId)?.totalCents ?? 0,
          ),
        })),
        paidInvoices,
      };
    }),

  annual: adminProcedure
    .input(z.object({ year: z.coerce.number().int().min(2000).max(2100) }))
    .query(async ({ ctx, input }) => {
      const from = `${input.year}-01-01`;
      const to = `${input.year}-12-31`;

      const [income, expense] = await Promise.all([
        ctx.db
          .select({
            month: sql<string>`substr(${invoices.paidDate}, 1, 7)`,
            totalCents: sql<number>`coalesce(sum(${invoices.totalCents}), 0)`,
          })
          .from(invoices)
          .where(
            and(
              eq(invoices.status, "paid"),
              gte(invoices.paidDate, from),
              lte(invoices.paidDate, to),
            ),
          )
          .groupBy(sql`substr(${invoices.paidDate}, 1, 7)`),
        ctx.db
          .select({
            month: sql<string>`substr(${expenses.date}, 1, 7)`,
            totalCents: sql<number>`coalesce(sum(${expenses.amountCents}), 0)`,
          })
          .from(expenses)
          .where(and(gte(expenses.date, from), lte(expenses.date, to)))
          .groupBy(sql`substr(${expenses.date}, 1, 7)`),
      ]);

      const months = Array.from({ length: 12 }, (_, i) => {
        const key = `${input.year}-${String(i + 1).padStart(2, "0")}`;
        const incomeCents = Number(
          income.find((row) => row.month === key)?.totalCents ?? 0,
        );
        const expenseCents = Number(
          expense.find((row) => row.month === key)?.totalCents ?? 0,
        );
        return {
          month: key,
          incomeCents,
          expenseCents,
          netCents: incomeCents - expenseCents,
        };
      });

      return {
        year: input.year,
        months,
        totalIncomeCents: months.reduce((s, m) => s + m.incomeCents, 0),
        totalExpenseCents: months.reduce((s, m) => s + m.expenseCents, 0),
        netCents: months.reduce((s, m) => s + m.netCents, 0),
      };
    }),
});
