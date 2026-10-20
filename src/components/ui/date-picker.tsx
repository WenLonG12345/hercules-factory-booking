"use client";

import { CalendarDays, X } from "lucide-react";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, formatDate } from "@/lib/utils";

/** `2026-09-18` → a Date in the local zone, never a UTC-shifted one. */
function parseISO(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** A Date → `2026-09-18`, read off the local fields for the same reason. */
function toISO(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * The date field the admin actually uses — a shadcn popover calendar, in place
 * of the native `<input type="date">` and its browser-by-browser picker.
 *
 * It stands in for `Input` wherever a date was typed, so it takes the same two
 * shapes the forms already use:
 * - controlled, with `value` and `onValueChange`;
 * - uncontrolled, with `defaultValue` and a `name`, which writes a hidden input
 *   so `new FormData(form)` still reads the date out.
 *
 * `clearable` adds the TBC control: an × on the trigger and a "Set to TBC"
 * button under the calendar, both of which hand back an empty string. Leave it
 * off for a date that must always carry a value.
 */
export function DatePicker({
  className,
  clearable = false,
  defaultValue,
  disabled,
  id,
  name,
  onValueChange,
  placeholder = "Pick a date",
  value,
}: {
  className?: string;
  clearable?: boolean;
  defaultValue?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  value?: string;
}) {
  const [open, setOpen] = useState(false);
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
  // `value === undefined` is the caller saying "you hold it"; `""` is a real
  // controlled value meaning the date is not set.
  const current = value === undefined ? uncontrolled : value;

  const commit = (next: string) => {
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  const selected = parseISO(current);

  return (
    <div className={cn("relative", className)}>
      {name ? <input name={name} type="hidden" value={current} /> : null}
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger
          className={cn(
            "flex h-11 w-full min-w-0 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-left text-sm outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-600/10 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-400",
            clearable && current ? "pr-10" : "",
            current ? "text-stone-950" : "text-stone-400",
          )}
          disabled={disabled}
          id={id}
          type="button"
        >
          <CalendarDays
            aria-hidden
            className="size-4 shrink-0 text-stone-400"
          />
          <span className="truncate">
            {selected ? formatDate(selected) : placeholder}
          </span>
        </PopoverTrigger>
        <PopoverContent>
          {/* Month and year dropdowns: the admin's tablet closes the popover on
              the ‹ arrow, so she jumps months here instead. The dropdown range
              otherwise stops at December this year — five years ahead covers
              due dates and package expiries. */}
          <Calendar
            autoFocus
            captionLayout="dropdown"
            defaultMonth={selected}
            endMonth={new Date(new Date().getFullYear() + 5, 11)}
            mode="single"
            onSelect={(date) => {
              commit(date ? toISO(date) : "");
              setOpen(false);
            }}
            selected={selected}
          />
          {clearable ? (
            <button
              className="mt-2 w-full rounded-md border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              onClick={() => {
                commit("");
                setOpen(false);
              }}
              type="button"
            >
              Set to TBC
            </button>
          ) : null}
        </PopoverContent>
      </Popover>
      {clearable && current ? (
        <button
          aria-label="Clear the date — leave it TBC"
          className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-stone-400 transition hover:bg-stone-100 hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          onClick={() => commit("")}
          type="button"
        >
          <X aria-hidden className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
