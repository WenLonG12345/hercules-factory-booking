"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/trpc";
import { formatDate, formatTime } from "../member-format";
import { toast } from "sonner";

export default function BookingsPage() {
  const utils = api.useUtils();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data: allBookings = [], isLoading } =
    api.portal.myBookings.useQuery();
  const cancelBooking = api.portal.cancelBooking.useMutation({
    onSuccess: () => {
      toast.success("Booking cancelled.");
      setCancellingId(null);
      utils.portal.myBookings.invalidate();
    },
  });

  const today = new Date().toISOString().split("T")[0];
  const upcoming = allBookings.filter(
    (b) => b.session.sessionDate >= today && b.booking.status === "booked",
  );
  const past = allBookings.filter(
    (b) => b.session.sessionDate < today || b.booking.status !== "booked",
  );

  const statusTone = (status: string): "green" | "amber" | "gray" | "red" => {
    if (status === "attended") return "green";
    if (status === "booked") return "amber";
    if (status === "cancelled") return "gray";
    return "red";
  };

  if (isLoading) {
    return (
      <div className="animate-pulse grid gap-5">
        <div className="h-8 w-32 rounded bg-stone-200" />
        <div className="grid gap-3">
          {["a", "b", "c"].map((k) => (
            <div key={k} className="h-20 rounded-xl bg-stone-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-700">
          My bookings
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-stone-950">
          Classes
        </h1>
      </div>

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold text-stone-950">Upcoming</h2>
          <div className="grid gap-3">
            {upcoming.map(({ booking, session }) => (
              <Card key={booking.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-stone-950">
                      {session.title}
                    </p>
                    <p className="mt-0.5 text-sm text-stone-500">
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
                  <button
                    type="button"
                    disabled={
                      cancelBooking.isPending && cancellingId === booking.id
                    }
                    onClick={() => {
                      setCancellingId(booking.id);
                      cancelBooking.mutate({ bookingId: booking.id });
                    }}
                    className="text-xs text-stone-500 transition hover:text-red-700 disabled:opacity-60"
                  >
                    {cancelBooking.isPending && cancellingId === booking.id
                      ? "Cancelling…"
                      : "Cancel booking"}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold text-stone-950">Past</h2>
          <div className="grid gap-2">
            {past.map(({ booking, session }) => (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-stone-950">
                    {session.title}
                  </p>
                  <p className="text-xs text-stone-500">
                    {formatDate(session.sessionDate)} ·{" "}
                    {formatTime(session.startTime)}
                  </p>
                </div>
                <Badge
                  tone={statusTone(booking.status)}
                  className="shrink-0 capitalize"
                >
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
