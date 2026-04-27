"use client";

import Link from "next/link";
import {
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiQrCodeLine,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/trpc";
import { formatDate, formatTime } from "./member-format";

export default function MemberDashboard() {
  const { data, isLoading } = api.portal.dashboard.useQuery();

  if (isLoading) {
    return (
      <div className="animate-pulse grid gap-5">
        <div className="h-8 w-40 rounded bg-white/10" />
        <div className="h-28 rounded-xl bg-white/10" />
        <div className="grid grid-cols-3 gap-3">
          {["a", "b", "c"].map((k) => (
            <div key={k} className="h-20 rounded-xl bg-white/10" />
          ))}
        </div>
        <div className="h-32 rounded-xl bg-white/10" />
      </div>
    );
  }

  const {
    customer,
    activeMembership,
    upcomingBookings = [],
    recentAttendance = [],
  } = data ?? {};

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-500">
          Member portal
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-stone-50">
          Hey, {customer?.name.split(" ")[0]}
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
                      Expires{" "}
                      {formatDate(activeMembership.membership.expiryDate)}
                    </span>
                  ) : (
                    <span>No expiry</span>
                  )}
                  {activeMembership.membership.remainingCredits !== null && (
                    <span className="font-medium text-amber-300">
                      {activeMembership.membership.remainingCredits} classes
                      left
                    </span>
                  )}
                </div>
              </>
            ) : (
              <p className="mt-1 text-sm text-stone-400">
                No active membership
              </p>
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
          <Link
            href="/member/bookings"
            className="text-xs text-red-400 hover:underline"
          >
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
            <h2 className="text-sm font-bold text-stone-100">
              Recent attendance
            </h2>
            <Link
              href="/member/attendance"
              className="text-xs text-red-400 hover:underline"
            >
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
