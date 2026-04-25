import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { attendanceRecords } from "@/db/schema";
import { markAttendance } from "@/server/services/business";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";

export const attendanceRouter = createTRPCRouter({
  list: adminProcedure.query(({ ctx }) =>
    ctx.db.query.attendanceRecords.findMany({
      with: { customer: true, classSession: true, membership: true },
      orderBy: desc(attendanceRecords.checkedInAt),
    }),
  ),
  markAttended: adminProcedure
    .input(
      z.object({
        bookingId: z.uuid(),
        signatureDataUrl: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) => markAttendance(ctx.db, input)),
  delete: adminProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(({ ctx, input }) =>
      ctx.db
        .delete(attendanceRecords)
        .where(eq(attendanceRecords.id, input.id))
        .returning(),
    ),
});
