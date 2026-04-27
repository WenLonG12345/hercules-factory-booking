"use client";

import { useState } from "react";
import { WhatsappCopyButton } from "@/app/admin/(portal)/bookings/whatsapp-copy-button";
import { PageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Select, Textarea } from "@/components/ui/form";
import { TableWrap, tableClass, tdClass, thClass } from "@/components/ui/table";
import { api } from "@/lib/trpc";
import { addDays, toDateInputValue } from "@/lib/utils";

const statuses = ["booked", "no_show", "cancelled"];

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function AdminBookingsPage() {
  const utils = api.useUtils();
  const [addOpen, setAddOpen] = useState(false);

  const { data: bookings = [], isLoading: bookingsLoading } =
    api.booking.list.useQuery();
  const { data: customers = [] } = api.customer.list.useQuery();
  const { data: sessions = [] } = api.schedule.list.useQuery();

  const createBooking = api.booking.create.useMutation({
    onSuccess: () => {
      utils.booking.list.invalidate();
      setAddOpen(false);
    },
  });

  const updateStatus = api.booking.updateStatus.useMutation({
    onSuccess: () => utils.booking.list.invalidate(),
  });

  if (bookingsLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 rounded bg-stone-200" />
        <div className="h-64 rounded-xl bg-stone-200" />
      </div>
    );
  }

  const today = toDateInputValue(new Date());
  const tomorrow = toDateInputValue(addDays(new Date(), 1));
  const upcomingDates = [today, tomorrow];

  const bookingCountBySession = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((map, b) => {
      map.set(b.classSessionId, (map.get(b.classSessionId) ?? 0) + 1);
      return map;
    }, new Map<string, number>());

  const upcomingSessions = sessions.filter(
    (s) => upcomingDates.includes(s.sessionDate) && !s.isCancelled,
  );

  const groupedByDate = upcomingDates
    .map((date) => {
      const d = new Date(`${date}T00:00:00`);
      const label = new Intl.DateTimeFormat("en-MY", {
        weekday: "long",
        day: "numeric",
        month: "short",
      }).format(d);
      return {
        date,
        label,
        sessions: upcomingSessions.filter((s) => s.sessionDate === date),
      };
    })
    .filter((g) => g.sessions.length > 0);

  const messageLines = ["🥊 Hercules Factory"];
  for (const group of groupedByDate) {
    messageLines.push(`\n📅 ${group.label}`);
    for (const s of group.sessions) {
      const count = bookingCountBySession.get(s.id) ?? 0;
      messageLines.push(
        `⏰ ${formatTime(s.startTime)} – ${s.title} (${count}/${s.capacity} booked)`,
      );
    }
  }
  messageLines.push("\nReply with your name + timeslot to reserve your spot! 💪");
  const whatsappMessage = messageLines.join("\n");

  return (
    <>
      <PageHeader eyebrow="Reservations" title="Bookings">
        <div className="flex gap-2">
          <WhatsappCopyButton message={whatsappMessage} />
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button type="button">Add booking</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manual booking</DialogTitle>
                <DialogDescription>
                  Add an existing customer to an available class slot.
                </DialogDescription>
              </DialogHeader>
              <form
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  createBooking.mutate({
                    customerId: String(fd.get("customerId") ?? ""),
                    classSessionId: String(fd.get("classSessionId") ?? ""),
                    notes: fd.get("notes") ? String(fd.get("notes")) : undefined,
                  });
                }}
              >
                <Field label="Customer">
                  <Select name="customerId">
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Class">
                  <Select name="classSessionId">
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.sessionDate} - {session.startTime}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Notes">
                  <Textarea name="notes" />
                </Field>
                <Button type="submit" disabled={createBooking.isPending}>
                  Add booking
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>
      <p className="mb-4 text-sm text-stone-500">
        To mark a customer attended and deduct credits, use the{" "}
        <a className="underline" href="/admin/attendance">
          Check-in page
        </a>
        .
      </p>
      <TableWrap>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Customer</th>
              <th className={thClass}>Class</th>
              <th className={thClass}>Source</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Update</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td className={tdClass}>{booking.customer?.name}</td>
                <td className={tdClass}>
                  {booking.classSession?.sessionDate} –{" "}
                  {booking.classSession?.startTime}
                </td>
                <td className={tdClass}>{booking.source}</td>
                <td className={tdClass}>
                  <Badge tone={booking.status === "booked" ? "amber" : "gray"}>
                    {booking.status}
                  </Badge>
                </td>
                <td className={tdClass}>
                  <div className="flex gap-2">
                    <select
                      className="h-9 rounded border border-stone-200 px-2"
                      defaultValue={booking.status}
                      onChange={(e) =>
                        updateStatus.mutate({
                          id: booking.id,
                          status: e.target.value as "booked",
                        })
                      }
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
}
