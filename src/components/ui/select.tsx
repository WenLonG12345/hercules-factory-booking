"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Radix refuses an item whose value is the empty string — it reserves `""` for
 * "nothing is selected, show the placeholder". So a dropdown where "Not set" is
 * a real choice carries this sentinel instead, and the form reader turns it
 * back into undefined. `readSelect` does that in one place.
 */
export const SELECT_NONE = "none";

/** A submitted select value, with the "Not set" sentinel read as undefined. */
export function readSelect(value: FormDataEntryValue | null) {
  const text = String(value ?? "");
  return text && text !== SELECT_NONE ? text : undefined;
}

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

function SelectTrigger({
  children,
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-stone-200 bg-white px-3 text-left text-sm text-stone-950 outline-none transition data-[placeholder]:text-stone-400 focus:border-red-600 focus:ring-4 focus:ring-red-600/10 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-400 [&>span]:truncate",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown aria-hidden className="size-4 shrink-0 text-stone-400" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  children,
  className,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-lg border border-stone-200 bg-white text-stone-950 shadow-2xl data-[state=closed]:animate-out data-[state=open]:animate-in",
          position === "popper" &&
            "w-full min-w-(--radix-select-trigger-width) data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="grid h-6 place-items-center text-stone-400">
          <ChevronUp aria-hidden className="size-4" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="p-1">
          {children}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="grid h-6 place-items-center text-stone-400">
          <ChevronDown aria-hidden className="size-4" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      className={cn(
        "px-2 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-stone-500",
        className,
      )}
      {...props}
    />
  );
}

function SelectItem({
  children,
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-md py-2 pl-3 pr-8 text-sm outline-none transition data-[disabled]:pointer-events-none data-[highlighted]:bg-stone-100 data-[state=checked]:font-semibold data-[disabled]:opacity-50 data-[highlighted]:text-stone-950 data-[state=checked]:text-red-700",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="absolute right-2 grid place-items-center">
        <SelectPrimitive.ItemIndicator>
          <Check aria-hidden className="size-4 text-red-700" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-stone-200", className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
