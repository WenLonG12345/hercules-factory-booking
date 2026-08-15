import { and, asc, between, eq } from "drizzle-orm";
import { z } from "zod";
import { sessionAttendees, sessions } from "@/db/schema";
import {
  activePackageFor,
  assertSessionHasCapacity,
  BusinessRuleError,
  recurringDates,
  setAttendance,
} from "@/server/services/business";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";
import { idSchema } from "@/server/validators/common";
import {
  addAttendeeInput,
  sessionInput,
  setAttendanceInput,
  updateSessionInput,
  weekInput,
} from "@/server/validators/schedule";

export const scheduleRouter = createTRPCRouter({
  week: adminProcedure.input(weekInput).query(({ ctx, input }) =>
    ctx.db.query.sessions.findMany({
      where: between(sessions.date, input.from, input.to),
      with: { coach: true, attendees: { with: { customer: true } } },
      orderBy: [asc(sessions.date), asc(sessions.startTime)],
    }),
  ),
  byId: adminProcedure.input(idSchema).query(({ ctx, input }) =>
    ctx.db.query.sessions.findFirst({
      where: eq(sessions.id, input.id),
      with: {
        coach: true,
        attendees: { with: { customer: true, package: true } },
      },
    }),
  ),
  create: adminProcedure.input(sessionInput).mutation(({ ctx, input }) => {
    const { repeatUntil, repeatDays, ...values } = input;
    const dates = recurringDates(values.date, repeatUntil, repeatDays);

    return ctx.db
      .insert(sessions)
      .values(
        dates.map((date) => ({
          ...values,
          date,
          coachId: values.coachId ?? null,
        })),
      )
      .returning();
  }),
  update: adminProcedure
    .input(updateSessionInput)
    .mutation(({ ctx, input }) => {
      const { id, ...values } = input;
      return ctx.db
        .update(sessions)
        .set({
          ...values,
          coachId: values.coachId ?? null,
          updatedAt: new Date(),
        })
        .where(eq(sessions.id, id))
        .returning();
    }),
  delete: adminProcedure
    .input(idSchema)
    .mutation(({ ctx, input }) =>
      ctx.db.delete(sessions).where(eq(sessions.id, input.id)).returning(),
    ),
  addAttendee: adminProcedure
    .input(addAttendeeInput)
    .mutation(async ({ ctx, input }) => {
      const session = await assertSessionHasCapacity(ctx.db, input.sessionId);

      const packageId =
        session.type === "trial"
          ? null
          : (input.packageId ??
            (await activePackageFor(ctx.db, input.customerId))?.id ??
            null);

      if (session.type !== "trial" && !packageId) {
        throw new BusinessRuleError(
          "This customer has no active package. Sell one first.",
        );
      }

      const existing = await ctx.db.query.sessionAttendees.findFirst({
        where: and(
          eq(sessionAttendees.sessionId, input.sessionId),
          eq(sessionAttendees.customerId, input.customerId),
        ),
      });
      if (existing) {
        throw new BusinessRuleError("Customer is already on this roster.");
      }

      return ctx.db
        .insert(sessionAttendees)
        .values({
          sessionId: input.sessionId,
          customerId: input.customerId,
          packageId,
        })
        .returning();
    }),
  setAttendance: adminProcedure
    .input(setAttendanceInput)
    .mutation(({ ctx, input }) =>
      setAttendance(ctx.db, input.attendeeId, input.status),
    ),
  markAllAttended: adminProcedure
    .input(idSchema)
    .mutation(async ({ ctx, input }) => {
      const roster = await ctx.db
        .select()
        .from(sessionAttendees)
        .where(
          and(
            eq(sessionAttendees.sessionId, input.id),
            eq(sessionAttendees.status, "booked"),
          ),
        );

      const failures: string[] = [];
      for (const attendee of roster) {
        try {
          await setAttendance(ctx.db, attendee.id, "attended");
        } catch (error) {
          failures.push(
            error instanceof BusinessRuleError
              ? error.message
              : "Unknown error",
          );
        }
      }
      return { marked: roster.length - failures.length, failures };
    }),
  removeAttendee: adminProcedure
    .input(z.object({ attendeeId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Give back a credit that was burnt before removing the row.
      await setAttendance(ctx.db, input.attendeeId, "cancelled");
      return ctx.db
        .delete(sessionAttendees)
        .where(eq(sessionAttendees.id, input.attendeeId))
        .returning();
    }),
});
