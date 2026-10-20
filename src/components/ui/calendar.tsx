"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

/**
 * shadcn's Calendar — react-day-picker under it, repainted into the admin
 * palette (stone surfaces, a red-700 selected day) the way `dialog.tsx` and
 * `switch.tsx` are. The slot names are react-day-picker's own, so anything the
 * upstream docs say about `classNames` still applies.
 */
export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const cell =
    "grid size-9 place-items-center rounded-md text-sm text-stone-700 transition";

  return (
    <DayPicker
      className={cn("w-fit select-none", className)}
      classNames={{
        root: "relative",
        months: "flex flex-col gap-4 sm:flex-row",
        month: "grid gap-3",
        // The nav spans the caption row, so it lets taps through to the month
        // and year dropdowns underneath; only its two buttons catch them.
        nav: "pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous:
          "pointer-events-auto grid size-8 place-items-center rounded-md text-stone-500 transition hover:bg-stone-100 hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 aria-disabled:opacity-40",
        button_next:
          "pointer-events-auto grid size-8 place-items-center rounded-md text-stone-500 transition hover:bg-stone-100 hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 aria-disabled:opacity-40",
        month_caption: "flex h-8 items-center justify-center",
        caption_label:
          "flex items-center gap-0.5 text-sm font-semibold text-stone-950",
        // captionLayout="dropdown": a native <select> laid invisibly over its
        // label, as upstream's stylesheet does, so the tablet gets its own picker.
        dropdowns: "relative inline-flex items-center gap-1",
        dropdown_root:
          "relative inline-flex h-8 items-center rounded-md px-1.5 transition hover:bg-stone-100 active:bg-stone-200 has-[select:focus-visible]:outline-2 has-[select:focus-visible]:outline-red-600",
        dropdown:
          "absolute inset-0 z-10 w-full cursor-pointer appearance-none opacity-0",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "grid size-9 place-items-center text-xs font-black uppercase tracking-[0.12em] text-stone-500",
        week: "flex w-full",
        day: "p-0",
        day_button: cn(
          cell,
          "hover:bg-stone-100 hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600",
        ),
        today: "font-bold text-red-700",
        // `selected` sits on the day cell, so it has to win over the button's
        // own hover colours — hence the child selector.
        selected:
          "[&>button]:bg-red-700 [&>button]:font-semibold [&>button]:text-white [&>button:hover]:bg-red-800 [&>button:hover]:text-white",
        outside: "[&>button]:text-stone-300",
        disabled: "[&>button]:pointer-events-none [&>button]:text-stone-300",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...rest }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" {...rest} />
          ) : orientation === "down" ? (
            <ChevronDown className="size-4" {...rest} />
          ) : (
            <ChevronRight className="size-4" {...rest} />
          ),
      }}
      showOutsideDays={showOutsideDays}
      {...props}
    />
  );
}
