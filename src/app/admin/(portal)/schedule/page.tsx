"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SESSION_TYPES } from "@/db/schema";
import { api } from "@/lib/trpc";
import {
  DAY_LABELS,
  monthGrid,
  monthLabel,
  SESSION_TYPE_LABEL,
  shiftMonths,
  today,
} from "../admin-format";

const TYPE_STYLE = {
  class: "border-red-200 bg-red-50 text-red-900",
  pt: "border-amber-200 bg-amber-50 text-amber-900",
  trial: "border-emerald-200 bg-emerald-50 text-emerald-900",
} as const;

// Mon-first labels carry their JS weekday number (0 = Sunday).
const WEEKDAYS = DAY_LABELS.map((label, index) => ({
  label,
  value: (index + 1) % 7,
}));

export default function SchedulePage() {
  const utils = api.useUtils();
  const [anchor, setAnchor] = useState(today());
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("class");

  const grid = monthGrid(anchor);
  const month = anchor.slice(0, 7);
  const { data: sessions = [], isLoading } = api.schedule.week.useQuery({
    from: grid[0],
    to: grid[grid.length - 1],
  });
  const { data: coaches = [] } = api.coach.list.useQuery();

  const create = api.schedule.create.useMutation({
    onSuccess: (rows) => {
      toast.success(
        rows.length > 1
          ? `${rows.length} sessions created.`
          : "Session created.",
      );
      setOpen(false);
      utils.schedule.week.invalidate();
      utils.report.dashboard.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <>
      <PageHeader eyebrow="Timetable" title="Schedule">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setAnchor(shiftMonths(anchor, -1))}
            type="button"
            variant="quiet"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <p className="min-w-40 text-center text-sm font-black">
            {monthLabel(anchor)}
          </p>
          <Button
            onClick={() => setAnchor(shiftMonths(anchor, 1))}
            type="button"
            variant="quiet"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            onClick={() => setAnchor(today())}
            type="button"
            variant="quiet"
          >
            Today
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button">Create session</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create session</DialogTitle>
                <DialogDescription>
                  Tick the weekdays and set an end date to write the whole
                  recurring timetable in one go.
                </DialogDescription>
              </DialogHeader>
              <form
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const sessionType = String(
                    fd.get("type"),
                  ) as (typeof SESSION_TYPES)[number];
                  create.mutate({
                    type: sessionType,
                    title: String(fd.get("title")),
                    date: String(fd.get("date")),
                    startTime: String(fd.get("startTime")),
                    endTime: String(fd.get("endTime")),
                    capacity: Number(fd.get("capacity")),
                    coachId: String(fd.get("coachId") ?? "") || undefined,
                    notes: String(fd.get("notes") ?? "") || undefined,
                    repeatUntil:
                      String(fd.get("repeatUntil") ?? "") || undefined,
                    repeatDays: fd.getAll("repeatDays").map(Number),
                  });
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Type">
                    <Select
                      name="type"
                      onChange={(e) => setType(e.target.value)}
                      value={type}
                    >
                      {SESSION_TYPES.map((value) => (
                        <option key={value} value={value}>
                          {SESSION_TYPE_LABEL[value]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Title">
                    <Input
                      defaultValue="Muay Thai Class"
                      name="title"
                      required
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Starts on">
                    <Input
                      defaultValue={anchor}
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Capacity">
                    <Input
                      key={type}
                      defaultValue={type === "class" ? 24 : 1}
                      min={1}
                      name="capacity"
                      required
                      type="number"
                    />
                  </Field>
                  <Field label="Coach">
                    <Select defaultValue="" name="coachId">
                      <option value="">Not assigned</option>
                      {coaches.map((coach) => (
                        <option key={coach.id} value={coach.id}>
                          {coach.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div className="grid gap-4 rounded-lg border border-stone-200 bg-stone-50 p-3 sm:grid-cols-2">
                  <Field label="Repeat on">
                    <div className="flex flex-wrap gap-1.5">
                      {WEEKDAYS.map((day) => (
                        <label
                          key={day.label}
                          className="cursor-pointer text-xs font-semibold"
                        >
                          <input
                            className="peer sr-only"
                            name="repeatDays"
                            type="checkbox"
                            value={day.value}
                          />
                          <span className="block rounded-md border border-stone-200 bg-white px-2 py-1.5 text-stone-500 transition peer-checked:border-red-600 peer-checked:bg-red-600 peer-checked:text-white">
                            {day.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </Field>
                  <Field label="Repeat until">
                    <Input name="repeatUntil" type="date" />
                  </Field>
                </div>
                <Field label="Notes">
                  <Textarea name="notes" />
                </Field>
                <Button disabled={create.isPending} type="submit">
                  {create.isPending ? "Saving…" : "Create session"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-stone-200 bg-stone-200">
        {DAY_LABELS.map((day) => (
          <p
            key={day}
            className="bg-stone-50 px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-stone-500"
          >
            {day}
          </p>
        ))}
        {grid.map((date) => {
          const daySessions = isLoading
            ? []
            : sessions.filter((session) => session.date === date);
          const outside = date.slice(0, 7) !== month;
          return (
            <section
              key={date}
              className={`min-h-28 p-1.5 ${outside ? "bg-stone-50" : "bg-white"}`}
            >
              <p
                className={`mb-1 text-right text-xs font-black ${
                  date === today()
                    ? "text-red-700"
                    : outside
                      ? "text-stone-300"
                      : "text-stone-500"
                }`}
              >
                {Number(date.slice(8))}
              </p>
              <div className="grid gap-1">
                {isLoading ? (
                  <div className="h-8 animate-pulse rounded bg-stone-100" />
                ) : (
                  daySessions.map((session) => {
                    const attended = session.attendees.filter(
                      (attendee) => attendee.status !== "cancelled",
                    ).length;
                    return (
                      <Link
                        key={session.id}
                        className={`block rounded border px-1.5 py-1 text-[11px] leading-tight transition hover:brightness-95 ${
                          TYPE_STYLE[session.type]
                        } ${session.isCancelled ? "opacity-50 line-through" : ""}`}
                        href={`/admin/schedule/${session.id}`}
                      >
                        <p className="font-black">{session.startTime}</p>
                        <p className="truncate font-semibold">
                          {session.title}
                        </p>
                        <p className="opacity-80">
                          {attended}/{session.capacity}
                        </p>
                      </Link>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
