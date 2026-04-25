import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("grid gap-2 text-sm font-medium text-stone-700", className)}
    >
      <span>{label}</span>
      {children}
    </div>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-red-600 focus:ring-4 focus:ring-red-600/10",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-red-600 focus:ring-4 focus:ring-red-600/10",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-600/10",
        className,
      )}
      {...props}
    />
  );
}
