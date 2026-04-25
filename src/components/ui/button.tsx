import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-red-700 text-white shadow-[0_10px_30px_rgba(185,28,28,0.28)] hover:bg-red-600",
  secondary:
    "border border-amber-400/40 bg-amber-300 text-stone-950 hover:bg-amber-200",
  ghost: "border border-white/12 bg-white/5 text-stone-100 hover:bg-white/10",
  quiet: "bg-stone-100 text-stone-950 hover:bg-white",
};

type Variant = keyof typeof variants;

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  variant = "primary",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant }) {
  return (
    <a
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
