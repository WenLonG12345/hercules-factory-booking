import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { attendanceRecords } from "@/db/schema";
import { toDateInputValue } from "@/lib/utils";
import { markAttendance } from "@/server/services/business";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";

export const attendanceRouter = createTRPCRouter({
  list: adminProcedure.query(({ ctx }) =>
    ctx.db.query.attendanceRecords.findMany({
      with: {
        customer: true,
        classSession: true,
        membership: { with: { package: true } },
      },
      orderBy: desc(attendanceRecords.checkedInAt),
    }),
  ),
  todayWithSessions: adminProcedure.query(({ ctx }) => {
    const today = toDateInputValue(new Date());
    return ctx.db.query.classSessions.findMany({
      where: (s, { eq }) => eq(s.sessionDate, today),
      orderBy: (s, { asc }) => asc(s.startTime),
      with: {
        bookings: {
          with: {
            customer: {
              with: {
                memberships: {
                  where: (m, { eq }) => eq(m.status, "active"),
                  with: { package: true },
                  orderBy: (m, { desc }) => desc(m.createdAt),
                  limit: 1,
                },
              },
            },
          },
        },
      },
    });
  }),
  markAttended: adminProcedure
    .input(
      z.object({
        bookingId: z.string().uuid(),
        signatureDataUrl: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) => markAttendance(ctx.db, input)),
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) =>
      ctx.db
        .delete(attendanceRecords)
        .where(eq(attendanceRecords.id, input.id))
        .returning(),
    ),
});
