"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SESSION_TYPE_LABEL, today } from "@/app/admin/(portal)/admin-format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/form";
import { api } from "@/lib/trpc";

/**
 * Burn one credit off a package by checking the customer into a real session.
 *
 * Credits only ever move through `session_attendees` — this dialog puts the
 * customer on a roster (or reuses the row they already have) and marks them
 * attended, so capacity, expiry and the double-burn guard all still apply.
 */
export function CheckInDialog({
  pkg,
  onSuccess,
}: {
  pkg: {
    id: string;
    customerId: string;
    customer?: { name: string } | null;
    totalCredits: number | null;
    usedCredits: number;
  };
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today());
  const [busy, setBusy] = useState(false);

  const { data: sessions = [], isLoading } = api.schedule.week.useQuery(
    { from: date, to: date },
    { enabled: open },
  );

  const addAttendee = api.schedule.addAttendee.useMutation();
  const setAttendance = api.schedule.setAttendance.useMutation();

  // Trial sessions never carry a package, so they are not check-in targets.
  const rows = sessions.filter(
    (session) => !session.isCancelled && session.type !== "trial",
  );

  const checkIn = async (session: (typeof rows)[number]) => {
    setBusy(true);
    try {
      const existing = session.attendees.find(
        (attendee) => attendee.customerId === pkg.customerId,
      );
      const attendeeId =
        existing?.id ??
        (
          await addAttendee.mutateAsync({
            sessionId: session.id,
            customerId: pkg.customerId,
            packageId: pkg.id,
          })
        )[0].id;

      await setAttendance.mutateAsync({ attendeeId, status: "attended" });
      toast.success("Checked in — one credit deducted.");
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not check in.",
      );
    } finally {
      setBusy(false);
    }
  };

  const left =
    pkg.totalCredits === null ? null : pkg.totalCredits - pkg.usedCredits;

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <button
          className="text-sm font-semibold text-red-700"
          disabled={left !== null && left <= 0}
          type="button"
        >
          Check in
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check in {pkg.customer?.name}</DialogTitle>
          <DialogDescription>
            {left} credit{left === 1 ? "" : "s"} left. Attending a session is
            what burns one.
          </DialogDescription>
        </DialogHeader>
        <Field label="Date">
          <Input
            onChange={(e) => setDate(e.target.value)}
            type="date"
            value={date}
          />
        </Field>
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-md bg-stone-200" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-stone-500">
            No class or PT sessions on this date. Create one on the Schedule
            page first.
          </p>
        ) : (
          <ul className="grid gap-2">
            {rows.map((session) => {
              const taken = session.attendees.filter(
                (attendee) => attendee.status !== "cancelled",
              ).length;
              return (
                <li
                  className="flex items-center justify-between gap-3 rounded-md border border-stone-200 p-3"
                  key={session.id}
                >
                  <div>
                    <p className="text-sm font-semibold">{session.title}</p>
                    <p className="text-xs text-stone-500">
                      {session.startTime}–{session.endTime} ·{" "}
                      {SESSION_TYPE_LABEL[session.type]} · {taken}/
                      {session.capacity}
                    </p>
                  </div>
                  <Button
                    disabled={busy}
                    onClick={() => checkIn(session)}
                    type="button"
                    variant="quiet"
                  >
                    Attend
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
