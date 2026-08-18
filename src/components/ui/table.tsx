import type { ComponentProps, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * shadcn's table primitives, repainted into the admin palette (stone surfaces,
 * uppercase stone-500 headers). `TableWrap` is ours — it is the scroll/border
 * shell shadcn keeps inside `Table`, pulled out so a table can opt out of it.
 */

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

export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <table data-slot="table" className={cn(tableClass, className)} {...props} />
  );
}

export function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={className} {...props} />;
}

export function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={className} {...props} />;
}

export function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
  return <tfoot data-slot="table-footer" className={className} {...props} />;
}

export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return <tr data-slot="table-row" className={className} {...props} />;
}

export function TableHead({ className, ...props }: ComponentProps<"th">) {
  return (
    <th data-slot="table-head" className={cn(thClass, className)} {...props} />
  );
}

export function TableCell({ className, ...props }: ComponentProps<"td">) {
  return (
    <td data-slot="table-cell" className={cn(tdClass, className)} {...props} />
  );
}

export function TableCaption({
  className,
  ...props
}: ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-stone-500", className)}
      {...props}
    />
  );
}
