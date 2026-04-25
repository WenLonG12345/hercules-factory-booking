import { desc } from "drizzle-orm";
import { payments } from "@/db/schema";
import { recordPayment } from "@/server/services/business";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";
import { paymentInput } from "@/server/validators/invoice";

export const paymentRouter = createTRPCRouter({
  list: adminProcedure.query(({ ctx }) =>
    ctx.db.query.payments.findMany({
      with: { customer: true, invoice: true },
      orderBy: desc(payments.paidDate),
    }),
  ),
  create: adminProcedure
    .input(paymentInput)
    .mutation(({ ctx, input }) => recordPayment(ctx.db, input)),
});
