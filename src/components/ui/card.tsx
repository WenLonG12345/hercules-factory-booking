import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-stone-200 bg-white p-5 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function DarkPanel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/10 bg-stone-950/70 p-5 shadow-2xl shadow-black/20",
        className,
      )}
      {...props}
    />
  );
}
