import { and, eq, gte, lte, sum } from "drizzle-orm";
import { z } from "zod";
import { memberships, packages, payments } from "@/db/schema";
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
});
