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

/** Touch floor: `md` is the 44px default; `sm` (40px) is for actions that sit
 *  inside a table row, where 44px would bloat every line. Nothing smaller. */
const sizes = {
  md: "h-11 px-4",
  sm: "h-10 px-3",
};

type Size = keyof typeof sizes;

const base =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(
        base,
        "disabled:pointer-events-none disabled:opacity-50",
        sizes[size],
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
  size = "md",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <a
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    />
  );
}
