"use client";

import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/trpc";
import { formatDate, formatTime } from "../member-format";

export default function AttendancePage() {
  const { data: records = [], isLoading } = api.portal.myAttendance.useQuery();

  if (isLoading) {
    return (
      <div className="animate-pulse grid gap-5">
        <div className="h-8 w-40 rounded bg-stone-200" />
        <div className="grid gap-2">
          {["a", "b", "c", "d"].map((k) => (
            <div key={k} className="h-16 rounded-lg bg-stone-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-700">
          History
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-stone-950">
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
              className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-3 text-sm shadow-sm"
            >
              <div>
                <p className="font-medium text-stone-950">{session.title}</p>
                <p className="text-xs text-stone-500">
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
                  <span className="text-xs text-amber-700">−1 credit</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
