"use client";

import { useActionState } from "react";

type CancelState = { error?: string; success?: boolean } | null;

export function CancelBookingForm({
  bookingId,
  action,
}: {
  bookingId: string;
  action: (prev: CancelState, formData: FormData) => Promise<CancelState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  if (state?.success) {
    return (
      <p className="text-xs font-medium text-stone-500">Booking cancelled.</p>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="bookingId" value={bookingId} />
      {state?.error && (
        <p className="mb-2 text-xs text-red-600">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-medium text-stone-500 transition hover:text-red-700 disabled:opacity-50"
      >
        {pending ? "Cancelling…" : "Cancel booking"}
      </button>
    </form>
  );
}
