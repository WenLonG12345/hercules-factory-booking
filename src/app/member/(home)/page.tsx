import {
  and,
  asc,
  desc,
  eq,
  gte,
  isNull,
  or,
} from "drizzle-orm";
import Link from "next/link";
import { RiCalendarLine, RiCheckboxCircleLine, RiQrCodeLine } from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  attendanceRecords,
  bookings,
  classSessions,
  memberships,
  packages,
} from "@/db/schema";
import { formatDate, formatTime, requireCustomer } from "./member-data";

export default async function MemberDashboard() {
  const { customer, db } = await requireCustomer();
  const today = new Date().toISOString().split("T")[0];

  const [activeMembership] = await db
    .select({ membership: memberships, package: packages })
    .from(memberships)
    .innerJoin(packages, eq(packages.id, memberships.packageId))
    .where(
      and(
        eq(memberships.customerId, customer.id),
        eq(memberships.status, "active"),
        or(isNull(memberships.expiryDate), gte(memberships.expiryDate, today)),
      ),
    )
    .orderBy(desc(memberships.createdAt))
    .limit(1);

  const upcomingBookings = await db
    .select({ booking: bookings, session: classSessions })
    .from(bookings)
    .innerJoin(classSessions, eq(classSessions.id, bookings.classSessionId))
    .where(
      and(
        eq(bookings.customerId, customer.id),
        eq(bookings.status, "booked"),
        gte(classSessions.sessionDate, today),
      ),
    )
    .orderBy(asc(classSessions.sessionDate), asc(classSessions.startTime))
    .limit(5);

  const recentAttendance = await db
    .select({ record: attendanceRecords, session: classSessions })
    .from(attendanceRecords)
    .innerJoin(
      classSessions,
      eq(classSessions.id, attendanceRecords.classSessionId),
    )
    .where(eq(attendanceRecords.customerId, customer.id))
    .orderBy(desc(attendanceRecords.checkedInAt))
    .limit(3);

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-500">
          Member portal
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-stone-50">
          Hey, {customer.name.split(" ")[0]}
        </h1>
      </div>

      {/* Membership card */}
      <Card className="p-4 border-white/10 bg-white/4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
              Membership
            </p>
            {activeMembership ? (
              <>
                <p className="mt-1 font-bold text-stone-100">
                  {activeMembership.package.name}
                </p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-stone-400">
                  {activeMembership.membership.expiryDate ? (
                    <span>
                      Expires {formatDate(activeMembership.membership.expiryDate)}
                    </span>
                  ) : (
                    <span>No expiry</span>
                  )}
                  {activeMembership.membership.remainingCredits !== null && (
                    <span className="font-medium text-amber-300">
                      {activeMembership.membership.remainingCredits} classes left
                    </span>
                  )}
                </div>
              </>
            ) : (
              <p className="mt-1 text-sm text-stone-400">No active membership</p>
            )}
          </div>
          <Badge
            tone={activeMembership ? "green" : "gray"}
            className="shrink-0"
          >
            {activeMembership ? "Active" : "Inactive"}
          </Badge>
        </div>
        {!activeMembership && (
          <Link
            href="/member/memberships"
            className="mt-3 block text-sm font-medium text-red-400 hover:underline"
          >
            Request a membership →
          </Link>
        )}
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/member/schedule"
          className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/4 p-3 text-center text-xs font-medium text-stone-300 transition hover:border-red-500/30 hover:bg-red-900/20"
        >
          <RiCalendarLine className="size-6 text-red-500" />
          Book a class
        </Link>
        <Link
          href="/member/check-in"
          className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/4 p-3 text-center text-xs font-medium text-stone-300 transition hover:border-red-500/30 hover:bg-red-900/20"
        >
          <RiQrCodeLine className="size-6 text-red-500" />
          Check in
        </Link>
        <Link
          href="/member/memberships"
          className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/4 p-3 text-center text-xs font-medium text-stone-300 transition hover:border-red-500/30 hover:bg-red-900/20"
        >
          <RiCheckboxCircleLine className="size-6 text-red-500" />
          Membership
        </Link>
      </div>

      {/* Upcoming bookings */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-100">Upcoming classes</h2>
          <Link href="/member/bookings" className="text-xs text-red-400 hover:underline">
            View all
          </Link>
        </div>
        {upcomingBookings.length === 0 ? (
          <p className="text-sm text-stone-500">No upcoming bookings.</p>
        ) : (
          <div className="grid gap-2">
            {upcomingBookings.map(({ booking, session }) => (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/4 px-3 py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium text-stone-100">{session.title}</p>
                  <p className="text-xs text-stone-400">
                    {formatDate(session.sessionDate)} ·{" "}
                    {formatTime(session.startTime)}
                  </p>
                </div>
                <Badge tone="amber">Booked</Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent attendance */}
      {recentAttendance.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-100">Recent attendance</h2>
            <Link href="/member/attendance" className="text-xs text-red-400 hover:underline">
              View all
            </Link>
          </div>
          <div className="grid gap-2">
            {recentAttendance.map(({ record, session }) => (
              <div
                key={record.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/4 px-3 py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium text-stone-100">{session.title}</p>
                  <p className="text-xs text-stone-400">
                    {formatDate(session.sessionDate)} ·{" "}
                    {formatTime(session.startTime)}
                  </p>
                </div>
                <Badge tone="green">Attended</Badge>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
