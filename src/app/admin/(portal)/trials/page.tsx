"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { SellPackageDialog } from "@/components/admin/sell-package-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { TableWrap, tableClass, tdClass, thClass } from "@/components/ui/table";
import { api } from "@/lib/trpc";
import { today } from "../admin-format";

const STATUS_TONE = {
  booked: "gray",
  attended: "green",
  no_show: "red",
  cancelled: "gray",
  converted: "amber",
} as const;

export default function TrialsPage() {
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);

  const { data: trials = [], isLoading } = api.trial.list.useQuery();
  const { data: customers = [] } = api.customer.list.useQuery();
  const { data: coaches = [] } = api.coach.list.useQuery();

  const invalidate = () => {
    utils.trial.list.invalidate();
    utils.report.dashboard.invalidate();
  };

  const book = api.trial.book.useMutation({
    onSuccess: () => {
      toast.success("Trial booked.");
      setOpen(false);
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const setAttendance = api.schedule.setAttendance.useMutation({
    onSuccess: () => {
      toast.success("Updated.");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 rounded bg-stone-200" />
        <div className="h-64 rounded-xl bg-stone-200" />
      </div>
    );
  }

  const total = trials.length;
  const converted = trials.filter((trial) =>
    trial.attendees.some((attendee) => attendee.status === "converted"),
  ).length;

  return (
    <>
      <PageHeader eyebrow="Pipeline" title="Trials">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button">Book trial</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Book a trial</DialogTitle>
              <DialogDescription>
                Creates a one-seat trial session and puts the customer on it.
              </DialogDescription>
            </DialogHeader>
            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                book.mutate({
                  customerId: String(fd.get("customerId")),
                  date: String(fd.get("date")),
                  startTime: String(fd.get("startTime")),
                  endTime: String(fd.get("endTime")),
                  coachId: String(fd.get("coachId") ?? "") || undefined,
                  notes: String(fd.get("notes") ?? "") || undefined,
                });
              }}
            >
              <Field label="Customer">
                <Select name="customerId" required>
                  <option value="">Select a customer…</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} — {customer.phone}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Date">
                  <Input
                    defaultValue={today()}
                    name="date"
                    required
                    type="date"
                  />
                </Field>
                <Field label="Start">
                  <Input
                    defaultValue="19:00"
                    name="startTime"
                    required
                    type="time"
                  />
                </Field>
                <Field label="End">
                  <Input
                    defaultValue="20:00"
                    name="endTime"
                    required
                    type="time"
                  />
                </Field>
              </div>
              <Field label="Coach">
                <Select name="coachId" defaultValue="">
                  <option value="">Not assigned</option>
                  {coaches.map((coach) => (
                    <option key={coach.id} value={coach.id}>
                      {coach.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Notes">
                <Textarea name="notes" />
              </Field>
              <Button disabled={book.isPending} type="submit">
                {book.isPending ? "Saving…" : "Book trial"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card className="mb-6">
        <p className="text-sm font-medium text-stone-500">Conversion</p>
        <p className="mt-2 text-3xl font-black tracking-tight">
          {converted} / {total}
          <span className="ml-2 text-base font-semibold text-stone-500">
            {total ? Math.round((converted / total) * 100) : 0}%
          </span>
        </p>
      </Card>

      <TableWrap>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Date</th>
              <th className={thClass}>Time</th>
              <th className={thClass}>Customer</th>
              <th className={thClass}>Coach</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trials.length === 0 ? (
              <tr>
                <td className={tdClass} colSpan={6}>
                  No trials booked yet.
                </td>
              </tr>
            ) : (
              trials.map((trial) => {
                const attendee = trial.attendees[0];
                return (
                  <tr key={trial.id}>
                    <td className={tdClass}>{trial.date}</td>
                    <td className={tdClass}>{trial.startTime}</td>
                    <td className={tdClass}>
                      {attendee?.customer?.name ?? "—"}
                    </td>
                    <td className={tdClass}>{trial.coach?.name ?? "—"}</td>
                    <td className={tdClass}>
                      {attendee ? (
                        <Badge tone={STATUS_TONE[attendee.status]}>
                          {attendee.status}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={tdClass}>
                      {attendee && attendee.status !== "converted" ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="text-sm font-semibold text-emerald-700"
                            onClick={() =>
                              setAttendance.mutate({
                                attendeeId: attendee.id,
                                status: "attended",
                              })
                            }
                            type="button"
                          >
                            Attended
                          </button>
                          <button
                            className="text-sm font-semibold text-stone-500"
                            onClick={() =>
                              setAttendance.mutate({
                                attendeeId: attendee.id,
                                status: "no_show",
                              })
                            }
                            type="button"
                          >
                            No show
                          </button>
                          <SellPackageDialog
                            convertedFromSessionId={trial.id}
                            customerId={attendee.customerId}
                            customerName={attendee.customer?.name}
                            onSuccess={invalidate}
                            trigger={
                              <button
                                className="text-sm font-semibold text-red-700"
                                type="button"
                              >
                                Convert
                              </button>
                            }
                          />
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
}
