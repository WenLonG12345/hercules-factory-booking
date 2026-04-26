import { desc, eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { attendanceRecords, classSessions } from "@/db/schema";
import { formatDate, formatTime, requireCustomer } from "../member-data";

export default async function AttendancePage() {
  const { customer, db } = await requireCustomer();

  const records = await db
    .select({ record: attendanceRecords, session: classSessions })
    .from(attendanceRecords)
    .innerJoin(
      classSessions,
      eq(classSessions.id, attendanceRecords.classSessionId),
    )
    .where(eq(attendanceRecords.customerId, customer.id))
    .orderBy(desc(attendanceRecords.checkedInAt));

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-500">
          History
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-stone-50">
          Attendance ({records.length})
        </h1>
      </div>

      {records.length === 0 ? (
        <p className="text-center text-sm text-stone-500 py-8">
          No attendance records yet.
        </p>
      ) : (
        <div className="grid gap-2">
          {records.map(({ record, session }) => (
            <div
              key={record.id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/4 px-3 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-stone-100">{session.title}</p>
                <p className="text-xs text-stone-400">
                  {formatDate(session.sessionDate)} ·{" "}
                  {formatTime(session.startTime)}
                </p>
                {session.coachName && (
                  <p className="text-xs text-stone-500">
                    Coach: {session.coachName}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge tone="green">Attended</Badge>
                {record.creditDeducted && (
                  <span className="text-xs text-amber-300">−1 credit</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
