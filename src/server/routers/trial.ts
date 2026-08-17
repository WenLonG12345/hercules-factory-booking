import { and, asc, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { sessions } from "@/db/schema";
import { toDateInputValue } from "@/lib/utils";
import { bookTrialSession } from "@/server/services/business";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";
import { trialBookingInput } from "@/server/validators/customer";

/**
 * Trials are the same rows as the schedule — `sessions.type = "trial"` plus its
 * roster. The pipeline itself lives on the customers page; this router only
 * feeds and books it.
 */
export const trialRouter = createTRPCRouter({
  list: adminProcedure
    .input(z.object({ upcomingOnly: z.boolean().default(false) }).optional())
    .query(({ ctx, input }) => {
      const today = toDateInputValue(new Date());
      return ctx.db.query.sessions.findMany({
        where: input?.upcomingOnly
          ? and(eq(sessions.type, "trial"), gte(sessions.date, today))
          : eq(sessions.type, "trial"),
        with: { coach: true, attendees: { with: { customer: true } } },
        orderBy: input?.upcomingOnly
          ? [asc(sessions.date), asc(sessions.startTime)]
          : [desc(sessions.date), desc(sessions.startTime)],
      });
    }),
  book: adminProcedure
    .input(trialBookingInput.extend({ customerId: z.uuid() }))
    .mutation(({ ctx, input }) => bookTrialSession(ctx.db, input)),
});
