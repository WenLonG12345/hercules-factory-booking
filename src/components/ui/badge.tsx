import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const tones = {
  red: "bg-red-100 text-red-800",
  amber: "bg-amber-100 text-amber-900",
  green: "bg-emerald-100 text-emerald-800",
  gray: "bg-stone-100 text-stone-700",
  dark: "bg-stone-900 text-stone-50",
};

export function Badge({
  className,
  tone = "gray",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
