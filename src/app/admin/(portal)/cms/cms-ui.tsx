"use client";

import type { inferRouterOutputs } from "@trpc/server";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import type { AppRouter } from "@/server/routers/_app";

export type CmsData = inferRouterOutputs<AppRouter>["cms"]["allContent"];

/**
 * Toast plus the two invalidations every CMS mutation on this page shares —
 * the admin list it was edited in, and the public landing query.
 */
export function useCmsToast() {
  const utils = api.useUtils();
  const onError = (error: { message: string }) => toast.error(error.message);
  const onSuccess = (message: string) => () => {
    toast.success(message);
    utils.cms.allContent.invalidate();
    utils.cms.publicContent.invalidate();
  };
  return { onError, onSuccess };
}

export function SectionHeader({
  id,
  title,
  hint,
}: {
  id: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-3">
      <h2 className="scroll-mt-24 text-xl font-black" id={id}>
        {title}
      </h2>
      {hint ? <p className="mt-1 text-sm text-stone-500">{hint}</p> : null}
    </div>
  );
}

/**
 * The repeated trash affordance on rows that have no edit form.
 *
 * Arms before it fires: the first press swaps the icon for a filled red
 * "Delete?" and only the second press commits. Every one of these deletions is
 * irreversible — a gallery row takes its R2 object with it — so there is no
 * Undo to offer instead. It disarms itself after four seconds, and on blur, so
 * a stray tap can never sit primed on the page.
 *
 * Sized off the pointer, not the breakpoint: 36px under a mouse, 44px under a
 * finger. `shrink-0` matters — these sit in flex rows next to an `<input>`,
 * and without it the input's intrinsic ~173px minimum pushed the button past
 * the tile's `overflow-hidden` edge and out of existence on tablets.
 */
export function DeleteButton({
  className,
  label = "Delete",
  onClick,
  pending = false,
}: {
  className?: string;
  label?: string;
  onClick: () => void;
  pending?: boolean;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);

  return (
    <button
      aria-label={armed ? `Confirm ${label.toLowerCase()}` : label}
      className={cn(
        // `transition-colors`, not `transition` — the latter covers box-shadow,
        // which would fade the focus ring in and leave a keyboard user with no
        // indicator for the first 150ms.
        "inline-flex h-9 min-w-9 shrink-0 items-center justify-center gap-1.5 rounded-md text-xs font-semibold transition-colors",
        // The soft red halo is the house style, but at 20% alpha it carries no
        // contrast on its own — the solid outline is the indicator that passes.
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 focus-visible:ring-4 focus-visible:ring-red-600/20",
        "disabled:pointer-events-none disabled:opacity-40",
        "pointer-coarse:h-11 pointer-coarse:min-w-11",
        armed
          ? "bg-red-700 px-2.5 text-white hover:bg-red-600 active:bg-red-800"
          : "text-red-700 hover:bg-red-50 active:bg-red-100",
        className,
      )}
      // Sits inside draggable tiles on the Media tab — without this the browser
      // hands the press to the tile's drag instead of the button.
      draggable={false}
      disabled={pending}
      onBlur={() => setArmed(false)}
      onClick={() => {
        if (!armed) {
          setArmed(true);
          return;
        }
        setArmed(false);
        onClick();
      }}
      title={armed ? "Press again to delete — this cannot be undone" : label}
      type="button"
    >
      <Trash2 className="size-4 shrink-0" />
      {armed ? <span className="whitespace-nowrap">Delete?</span> : null}
    </button>
  );
}

/**
 * An existing CMS row, collapsed behind a native `<details>`. Before this the
 * lists were delete-only, so a typo — or a missing translation — meant deleting
 * the row and typing it again.
 */
export function EditRow({
  summary,
  subtitle,
  onSubmit,
  onDelete,
  pending,
  children,
}: {
  summary: string;
  subtitle?: string | null;
  onSubmit: (formData: FormData) => void;
  onDelete: () => void;
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="rounded-md border border-stone-100">
      <details>
        <summary className="cursor-pointer px-3 py-2">
          <span className="font-semibold">{summary}</span>
          <span className="block text-stone-500">{subtitle ?? "—"}</span>
        </summary>
        <form
          className="grid gap-4 border-t border-stone-100 px-3 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(new FormData(e.currentTarget));
          }}
        >
          {children}
          <div className="flex gap-2">
            <Button disabled={pending} type="submit">
              Save
            </Button>
            <Button onClick={onDelete} type="button" variant="quiet">
              <Trash2 className="size-4 text-red-700" />
            </Button>
          </div>
        </form>
      </details>
    </li>
  );
}
