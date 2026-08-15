import { and, asc, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { sessionAttendees, sessions } from "@/db/schema";
import { toDateInputValue } from "@/lib/utils";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";
import { dateString, timeString } from "@/server/validators/common";

/**
 * Trials are the same rows as the schedule — `sessions.type = "trial"` plus its
 * roster — listed as a pipeline instead of a calendar.
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
    .input(
      z.object({
        customerId: z.uuid(),
        date: dateString,
        startTime: timeString,
        endTime: timeString,
        coachId: z.uuid().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [session] = await ctx.db
        .insert(sessions)
        .values({
          type: "trial",
          title: "Trial class",
          date: input.date,
          startTime: input.startTime,
          endTime: input.endTime,
          capacity: 1,
          coachId: input.coachId ?? null,
          notes: input.notes,
        })
        .returning();

      await ctx.db.insert(sessionAttendees).values({
        sessionId: session.id,
        customerId: input.customerId,
      });

      return session;
    }),
});
