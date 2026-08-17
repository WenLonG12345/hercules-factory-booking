"use client";

import type { inferRouterOutputs } from "@trpc/server";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";
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

/** The repeated trash affordance on rows that have no edit form. */
export function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button aria-label="Delete" onClick={onClick} type="button">
      <Trash2 className="size-4 text-red-700" />
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
