"use client";

import { useActionState } from "react";

type BookState = { error?: string; bookingId?: string } | null;

export function BookClassForm({
  classSessionId,
  action,
}: {
  classSessionId: string;
  action: (prev: BookState, formData: FormData) => Promise<BookState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  if (state?.bookingId) {
    return (
      <span className="inline-flex items-center rounded px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-900">
        Booked!
      </span>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="classSessionId" value={classSessionId} />
      {state?.error && (
        <p className="mb-1 text-xs text-red-600 text-right max-w-32">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? "Booking…" : "Book"}
      </button>
    </form>
  );
}
