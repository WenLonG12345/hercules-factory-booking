import {
  markAttendanceAction,
  updateBookingStatusAction,
} from "@/app/admin/(portal)/actions";
import { PageHeader } from "@/components/admin/admin-shell";
import { SessionQrDialog } from "@/components/admin/session-qr-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TableWrap, tableClass, tdClass, thClass } from "@/components/ui/table";
import {
  getAttendanceRecords,
  getTodaySessionsWithBookings,
} from "@/server/services/queries";

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function membershipBadge(packageType: string | undefined | null) {
  if (!packageType) return { label: "No pass", tone: "gray" as const };
  if (packageType === "ten_class")
    return { label: "10-Class", tone: "amber" as const };
  if (packageType === "unlimited")
    return { label: "Unlimited", tone: "green" as const };
  return { label: "Drop-in", tone: "gray" as const };
}

export default async function AttendancePage() {
  const [todaySessions, records] = await Promise.all([
    getTodaySessionsWithBookings(),
    getAttendanceRecords(),
  ]);

  return (
    <>
      <PageHeader eyebrow="Check-in" title="Attendance" />

      <div className="mb-8 grid gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
          Today&apos;s Classes
        </h2>
        {todaySessions.length === 0 ? (
          <p className="text-sm text-stone-500">No classes scheduled today.</p>
        ) : (
          todaySessions.map((session) => {
            const activeBookings = session.bookings.filter(
              (b) => b.status !== "cancelled",
            );
            const pendingBookings = session.bookings.filter(
              (b) => b.status === "booked",
            );
            return (
              <Card key={session.id}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {formatTime(session.startTime)}
                    </span>
                    <span className="text-stone-400">·</span>
                    <span className="text-stone-700">{session.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="gray">
                      {activeBookings.length}/{session.capacity} booked
                    </Badge>
                    <SessionQrDialog
                      classSessionId={session.id}
                      sessionLabel={`${session.title} · ${formatTime(session.startTime)}`}
                    />
                  </div>
                </div>
                {pendingBookings.length === 0 ? (
                  <p className="text-sm text-stone-400">
                    No pending check-ins.
                  </p>
                ) : (
                  <ul className="divide-y divide-stone-100">
                    {pendingBookings.map((booking) => {
                      const activeMembership =
                        booking.customer?.memberships?.[0];
                      const badge = membershipBadge(
                        activeMembership?.package?.type,
                      );
                      return (
                        <li
                          key={booking.id}
                          className="flex items-center justify-between py-2"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium">
                              {booking.customer?.name}
                            </span>
                            <Badge tone={badge.tone}>{badge.label}</Badge>
                            {activeMembership?.remainingCredits != null && (
                              <span className="text-xs text-stone-400">
                                {activeMembership.remainingCredits} left
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <form action={markAttendanceAction}>
                              <input
                                type="hidden"
                                name="bookingId"
                                value={booking.id}
                              />
                              <Button
                                className="h-8 text-xs"
                                type="submit"
                                variant="quiet"
                              >
                                Check in ✓
                              </Button>
                            </form>
                            <form action={updateBookingStatusAction}>
                              <input
                                type="hidden"
                                name="id"
                                value={booking.id}
                              />
                              <input
                                type="hidden"
                                name="status"
                                value="no_show"
                              />
                              <Button
                                className="h-8 text-xs"
                                type="submit"
                                variant="quiet"
                              >
                                No-show ✗
                              </Button>
                            </form>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            );
          })
        )}
      </div>

      <details>
        <summary className="mb-3 cursor-pointer select-none text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
          All Records ({records.length})
        </summary>
        <TableWrap>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Customer</th>
                <th className={thClass}>Class</th>
                <th className={thClass}>Package</th>
                <th className={thClass}>Credit deducted</th>
                <th className={thClass}>Checked in at</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td className={tdClass}>{record.customer?.name}</td>
                  <td className={tdClass}>
                    {record.classSession?.sessionDate} –{" "}
                    {record.classSession?.startTime}
                  </td>
                  <td className={tdClass}>
                    {record.membership?.package?.name ?? "—"}
                  </td>
                  <td className={tdClass}>
                    <Badge tone={record.creditDeducted ? "amber" : "gray"}>
                      {record.creditDeducted ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td className={tdClass}>
                    {new Date(record.checkedInAt).toLocaleString("en-MY")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </details>
    </>
  );
}
