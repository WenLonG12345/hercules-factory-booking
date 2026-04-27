"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/trpc";
import { formatDate, formatTime } from "../member-format";

export default function SchedulePage() {
  const utils = api.useUtils();
  const [bookingSessionId, setBookingSessionId] = useState<string | null>(null);

  const { data: scheduleData = [], isLoading: scheduleLoading } =
    api.portal.schedule.useQuery({});
  const { data: myMemberships = [], isLoading: membershipsLoading } =
    api.portal.myMemberships.useQuery();
  const bookClass = api.portal.bookClass.useMutation({
    onSuccess: () => {
      toast.success("Class booked.");
      setBookingSessionId(null);
      utils.portal.schedule.invalidate();
    },
    onError: (error) => {
      setBookingSessionId(null);
      toast.error(error.message || "Unable to book this class.");
    },
  });

  const isLoading = scheduleLoading || membershipsLoading;

  const today = new Date().toISOString().split("T")[0];
  const hasActiveMembership = myMemberships.some(
    (m) =>
      m.membership.status === "active" &&
      (m.membership.expiryDate === null || m.membership.expiryDate >= today),
  );

  if (isLoading) {
    return (
      <div className="animate-pulse grid gap-5">
        <div className="h-8 w-32 rounded bg-stone-200" />
        <div className="grid gap-3">
          {["a", "b", "c"].map((k) => (
            <div key={k} className="h-24 rounded-xl bg-stone-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-700">
          Schedule
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-stone-950">
          Book a class
        </h1>
        {!hasActiveMembership && (
          <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
            Active membership required to book. Request one under Membership.
          </p>
        )}
      </div>

      {scheduleData.length === 0 ? (
        <p className="text-center text-sm text-stone-500 py-8">
          No upcoming classes scheduled.
        </p>
      ) : (
        <div className="grid gap-3">
          {scheduleData.map(({ session, myBooking }) => {
            const isBooked = myBooking && myBooking.status !== "cancelled";
            const isPending =
              bookClass.isPending && bookingSessionId === session.id;

            return (
              <Card key={session.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-stone-950">{session.title}</p>
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
                    <p className="mt-0.5 text-xs text-stone-500">
                      Capacity: {session.capacity} pax
                    </p>
                  </div>
                  <div className="shrink-0">
                    {isBooked ? (
                      <Badge tone="amber">Booked</Badge>
                    ) : hasActiveMembership ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          setBookingSessionId(session.id);
                          bookClass.mutate({ classSessionId: session.id });
                        }}
                        className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
                      >
                        {isPending ? "Booking…" : "Book"}
                      </button>
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
