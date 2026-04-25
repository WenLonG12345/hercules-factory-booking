import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function TableWrap({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-stone-200 bg-white",
        className,
      )}
      {...props}
    />
  );
}

export const tableClass =
  "w-full min-w-[760px] border-collapse text-left text-sm";
export const thClass =
  "border-b border-stone-200 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500";
export const tdClass = "border-b border-stone-100 px-4 py-3 text-stone-700";
