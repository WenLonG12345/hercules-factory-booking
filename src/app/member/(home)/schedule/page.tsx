import { and, asc, eq, gte, inArray, isNull, or } from "drizzle-orm";
import { bookClassAction } from "@/app/member/actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { bookings, classSessions, memberships } from "@/db/schema";
import { formatDate, formatTime, requireCustomer } from "../member-data";
import { BookClassForm } from "./book-form";

export default async function SchedulePage() {
  const { customer, db } = await requireCustomer();
  const today = new Date().toISOString().split("T")[0];

  const sessions = await db
    .select()
    .from(classSessions)
    .where(
      and(
        eq(classSessions.isCancelled, false),
        gte(classSessions.sessionDate, today),
      ),
    )
    .orderBy(asc(classSessions.sessionDate), asc(classSessions.startTime));

  const [activeMembership] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(
      and(
        eq(memberships.customerId, customer.id),
        eq(memberships.status, "active"),
        or(isNull(memberships.expiryDate), gte(memberships.expiryDate, today)),
      ),
    )
    .limit(1);

  const sessionIds = sessions.map((s) => s.id);
  const myBookings =
    sessionIds.length > 0
      ? await db
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.customerId, customer.id),
              inArray(bookings.classSessionId, sessionIds),
            ),
          )
      : [];

  const myBookingMap = new Map(myBookings.map((b) => [b.classSessionId, b]));

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-500">
          Schedule
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-stone-50">
          Book a class
        </h1>
        {!activeMembership && (
          <p className="mt-2 rounded-md bg-amber-900/30 px-3 py-2 text-xs text-amber-300 ring-1 ring-amber-500/30">
            Active membership required to book. Request one under Membership.
          </p>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="text-center text-sm text-stone-500 py-8">
          No upcoming classes scheduled.
        </p>
      ) : (
        <div className="grid gap-3">
          {sessions.map((session) => {
            const myBooking = myBookingMap.get(session.id);
            const isBooked =
              myBooking && myBooking.status !== "cancelled";

            return (
              <Card key={session.id} className="p-4 border-white/10 bg-white/4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-stone-100">{session.title}</p>
                    <p className="mt-0.5 text-sm text-stone-400">
                      {formatDate(session.sessionDate)} ·{" "}
                      {formatTime(session.startTime)} –{" "}
                      {formatTime(session.endTime)}
                    </p>
                    {session.coachName && (
                      <p className="mt-0.5 text-xs text-stone-500">
                        Coach: {session.coachName}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-stone-500">
                      Capacity: {session.capacity} pax
                    </p>
                  </div>
                  <div className="shrink-0">
                    {isBooked ? (
                      <Badge tone="amber">Booked</Badge>
                    ) : activeMembership ? (
                      <BookClassForm
                        classSessionId={session.id}
                        action={bookClassAction}
                      />
                    ) : (
                      <Badge tone="gray">Members only</Badge>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
