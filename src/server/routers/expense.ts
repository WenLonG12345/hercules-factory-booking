import { and, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { expenses } from "@/db/schema";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";
import { idSchema, monthSchema } from "@/server/validators/common";
import { expenseInput, updateExpenseInput } from "@/server/validators/expense";

export const expenseRouter = createTRPCRouter({
  list: adminProcedure
    .input(z.object({ month: monthSchema.optional() }).optional())
    .query(({ ctx, input }) =>
      ctx.db.query.expenses.findMany({
        where: input?.month
          ? and(
              gte(expenses.date, `${input.month}-01`),
              lte(expenses.date, `${input.month}-31`),
            )
          : undefined,
        with: { coach: true },
        orderBy: desc(expenses.date),
      }),
    ),
  create: adminProcedure.input(expenseInput).mutation(({ ctx, input }) =>
    ctx.db
      .insert(expenses)
      .values({ ...input, coachId: input.coachId ?? null })
      .returning(),
  ),
  update: adminProcedure
    .input(updateExpenseInput)
    .mutation(({ ctx, input }) => {
      const { id, ...values } = input;
      return ctx.db
        .update(expenses)
        .set({
          ...values,
          coachId: values.coachId ?? null,
          updatedAt: new Date(),
        })
        .where(eq(expenses.id, id))
        .returning();
    }),
  delete: adminProcedure
    .input(idSchema)
    .mutation(({ ctx, input }) =>
      ctx.db.delete(expenses).where(eq(expenses.id, input.id)).returning(),
    ),
});
