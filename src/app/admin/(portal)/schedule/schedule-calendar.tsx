"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import {
  createClassSessionAction,
  deleteClassSessionAction,
  generateWeeklyScheduleAction,
  updateClassSessionAction,
} from "@/app/admin/(portal)/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/form";
import { cn } from "@/lib/utils";

type Session = {
  id: string;
  title: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  isCancelled: boolean;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-MY", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ScheduleCalendar({
  sessions,
  onRefetch,
}: {
  sessions: Session[];
  onRefetch?: () => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [addDate, setAddDate] = useState<string | null>(null);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const startOffset = (firstDayOfWeek + 6) % 7; // Mon=0
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const todayStr = toDateStr(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-MY", {
    month: "long",
    year: "numeric",
  });

  // Group sessions by date
  const byDate: Record<string, Session[]> = {};
  for (const s of sessions) {
    if (!byDate[s.sessionDate]) byDate[s.sessionDate] = [];
    byDate[s.sessionDate].push(s);
  }

  // Build week rows
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startOffset + 1;
    if (dayNum < 1 || dayNum > daysInMonth) return null;
    const dateStr = toDateStr(year, month, dayNum);
    return { dayNum, dateStr, sessions: byDate[dateStr] ?? [] };
  });
  const weeks: (typeof cells)[number][][] = [];
  for (let i = 0; i < totalCells; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const defaultStart = toDateStr(year, month, 1);
  const defaultEnd = toDateStr(year, month, daysInMonth);

  return (
    <>
      {/* Month navigation */}
      <div className="mb-4 flex items-center gap-2">
        <button
          className="rounded p-1.5 text-stone-600 hover:bg-stone-100"
          onClick={prevMonth}
          type="button"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="w-44 text-center font-black">{monthLabel}</span>
        <button
          className="rounded p-1.5 text-stone-600 hover:bg-stone-100"
          onClick={nextMonth}
          type="button"
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          className="ml-auto rounded-md bg-stone-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-700"
          onClick={() => setGenerateOpen(true)}
          type="button"
        >
          Generate schedule
        </button>
      </div>

      {/* Calendar */}
      <div className="overflow-hidden rounded-lg border border-stone-200">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50">
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className="border-r border-stone-200 py-2 text-center text-xs font-semibold text-stone-500 last:border-r-0"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week) => (
          <div
            key={week.map((c) => c?.dateStr ?? "x").join("-")}
            className={cn(
              "grid grid-cols-7",
              weeks.indexOf(week) < weeks.length - 1 &&
                "border-b border-stone-200",
            )}
          >
            {week.map((cell, di) => {
              const isLastCol = di === 6;

              if (!cell) {
                return (
                  <div
                    key={`empty-${DAY_LABELS[di]}`}
                    className={cn(
                      "min-h-28 bg-stone-50",
                      !isLastCol && "border-r border-stone-200",
                    )}
                  />
                );
              }

              const isToday = cell.dateStr === todayStr;

              return (
                <div
                  key={cell.dateStr}
                  className={cn(
                    "group min-h-28 p-1.5",
                    !isLastCol && "border-r border-stone-200",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                        isToday ? "bg-red-700 text-white" : "text-stone-500",
                      )}
                    >
                      {cell.dayNum}
                    </span>
                    <button
                      className="hidden size-5 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700 group-hover:flex"
                      onClick={() => setAddDate(cell.dateStr)}
                      title="Add class"
                      type="button"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {cell.sessions.map((session) => (
                      <button
                        key={session.id}
                        className={cn(
                          "w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-medium transition",
                          session.isCancelled
                            ? "bg-stone-100 text-stone-400 line-through"
                            : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
                        )}
                        onClick={() => setEditSession(session)}
                        type="button"
                      >
                        {session.startTime.slice(0, 5)} {session.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Add dialog */}
      <Dialog
        open={addDate !== null}
        onOpenChange={(open) => !open && setAddDate(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add class — {addDate ? formatDate(addDate) : ""}
            </DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4"
            action={async (formData) => {
              await createClassSessionAction(formData);
              onRefetch?.();
              setAddDate(null);
            }}
          >
            <input name="sessionDate" type="hidden" value={addDate ?? ""} />
            <Field label="Title">
              <Input defaultValue="Muay Thai Class" name="title" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
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
                  defaultValue="20:30"
                  name="endTime"
                  required
                  type="time"
                />
              </Field>
            </div>
            <Field label="Capacity">
              <Input defaultValue="24" min="1" name="capacity" type="number" />
            </Field>
            <Button type="submit">Create class</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generate schedule dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate schedule</DialogTitle>
          </DialogHeader>
          <div className="mb-3 rounded-md bg-stone-50 p-3 text-xs text-stone-600 space-y-1">
            <p className="font-semibold text-stone-800">Weekly template</p>
            <p>Mon – Thu · 7:00–8:30 pm &amp; 8:30–10:00 pm</p>
            <p>Friday · 7:00–8:00 pm, 8:00–9:00 pm, 9:00–10:00 pm</p>
            <p>Saturday · 9:00–10:30 pm</p>
          </div>
          <form
            className="grid gap-4"
            action={async (formData) => {
              await generateWeeklyScheduleAction(formData);
              onRefetch?.();
              setGenerateOpen(false);
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start date">
                <Input
                  name="startDate"
                  type="date"
                  defaultValue={defaultStart}
                  required
                />
              </Field>
              <Field label="End date">
                <Input
                  name="endDate"
                  type="date"
                  defaultValue={defaultEnd}
                  required
                />
              </Field>
            </div>
            <p className="text-xs text-stone-500">
              Existing sessions on the same slot are skipped automatically.
            </p>
            <Button type="submit">Generate</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={editSession !== null}
        onOpenChange={(open) => !open && setEditSession(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit class —{" "}
              {editSession ? formatDate(editSession.sessionDate) : ""}
            </DialogTitle>
          </DialogHeader>
          {editSession && (
            <div className="grid gap-5">
              <form
                key={editSession.id}
                className="grid gap-4"
                action={async (formData) => {
                  await updateClassSessionAction(formData);
                  onRefetch?.();
                  setEditSession(null);
                }}
              >
                <input name="id" type="hidden" value={editSession.id} />
                <Field label="Title">
                  <Input defaultValue={editSession.title} name="title" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Start">
                    <Input
                      defaultValue={editSession.startTime.slice(0, 5)}
                      name="startTime"
                      required
                      type="time"
                    />
                  </Field>
                  <Field label="End">
                    <Input
                      defaultValue={editSession.endTime.slice(0, 5)}
                      name="endTime"
                      required
                      type="time"
                    />
                  </Field>
                </div>
                <Field label="Capacity">
                  <Input
                    defaultValue={String(editSession.capacity)}
                    min="1"
                    name="capacity"
                    type="number"
                  />
                </Field>
                <Button type="submit">Save changes</Button>
              </form>
              <div className="border-t border-stone-200 pt-4">
                <form
                  action={async (formData) => {
                    await deleteClassSessionAction(formData);
                    onRefetch?.();
                    setEditSession(null);
                  }}
                >
                  <input name="id" type="hidden" value={editSession.id} />
                  <Button
                    className="w-full text-red-700 hover:text-red-700"
                    type="submit"
                    variant="quiet"
                  >
                    Delete class
                  </Button>
                </form>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
