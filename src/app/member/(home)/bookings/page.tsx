import { desc, eq } from "drizzle-orm";
import { cancelBookingAction } from "@/app/member/actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { bookings, classSessions } from "@/db/schema";
import { formatDate, formatTime, requireCustomer } from "../member-data";
import { CancelBookingForm } from "./cancel-form";

export default async function BookingsPage() {
  const { customer, db } = await requireCustomer();
  const today = new Date().toISOString().split("T")[0];

  const allBookings = await db
    .select({ booking: bookings, session: classSessions })
    .from(bookings)
    .innerJoin(classSessions, eq(classSessions.id, bookings.classSessionId))
    .where(eq(bookings.customerId, customer.id))
    .orderBy(desc(classSessions.sessionDate), desc(classSessions.startTime));

  const upcoming = allBookings.filter(
    (b) =>
      b.session.sessionDate >= today && b.booking.status === "booked",
  );
  const past = allBookings.filter(
    (b) =>
      b.session.sessionDate < today || b.booking.status !== "booked",
  );

  const statusTone = (
    status: string,
  ): "green" | "amber" | "gray" | "red" => {
    if (status === "attended") return "green";
    if (status === "booked") return "amber";
    if (status === "cancelled") return "gray";
    return "red";
  };

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-500">
          My bookings
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-stone-50">
          Classes
        </h1>
      </div>

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold text-stone-300">Upcoming</h2>
          <div className="grid gap-3">
            {upcoming.map(({ booking, session }) => (
              <Card key={booking.id} className="p-4 border-white/10 bg-white/4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-stone-100 truncate">
                      {session.title}
                    </p>
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
                  </div>
                  <Badge tone="amber" className="shrink-0">
                    Booked
                  </Badge>
                </div>
                <div className="mt-3">
                  <CancelBookingForm
                    bookingId={booking.id}
                    action={cancelBookingAction}
                  />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold text-stone-300">Past</h2>
          <div className="grid gap-2">
            {past.map(({ booking, session }) => (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/4 px-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-stone-100 truncate">
                    {session.title}
                  </p>
                  <p className="text-xs text-stone-400">
                    {formatDate(session.sessionDate)} ·{" "}
                    {formatTime(session.startTime)}
                  </p>
                </div>
                <Badge tone={statusTone(booking.status)} className="shrink-0 capitalize">
                  {booking.status}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {allBookings.length === 0 && (
        <p className="text-center text-sm text-stone-500 py-8">
          No bookings yet. Book your first class!
        </p>
      )}
    </div>
  );
}
