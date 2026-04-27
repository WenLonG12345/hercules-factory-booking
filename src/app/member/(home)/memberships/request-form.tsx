"use client";

import { useActionState } from "react";

type RequestState = {
  error?: string;
  invoiceNumber?: string;
  packageName?: string;
} | null;

export function RequestMembershipForm({
  packageId,
  action,
  paymentInfo,
}: {
  packageId: string;
  action: (prev: RequestState, formData: FormData) => Promise<RequestState>;
  paymentInfo: {
    bankName: string;
    bankAccount: string;
    accountName: string;
    tngNumber: string;
  };
}) {
  const [state, formAction, pending] = useActionState(action, null);

  if (state?.invoiceNumber) {
    return (
      <div className="rounded-lg bg-amber-50 p-3 ring-1 ring-amber-200">
        <p className="text-sm font-semibold text-amber-800">
          Request submitted! Invoice {state.invoiceNumber}
        </p>
        <p className="mt-1 text-xs text-amber-700">
          Please transfer payment using one of the methods below:
        </p>
        {paymentInfo.bankAccount || paymentInfo.tngNumber ? (
          <div className="mt-2 grid gap-1 text-xs text-amber-700">
            {paymentInfo.bankAccount && (
              <p>
                <span className="font-medium">Bank transfer:</span>{" "}
                {paymentInfo.bankName} · {paymentInfo.bankAccount}
                {paymentInfo.accountName && ` (${paymentInfo.accountName})`}
              </p>
            )}
            {paymentInfo.tngNumber && (
              <p>
                <span className="font-medium">TNG:</span>{" "}
                {paymentInfo.tngNumber}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-1 text-xs text-amber-700">
            Please contact us on WhatsApp for payment details.
          </p>
        )}
        <p className="mt-2 text-xs text-stone-500">
          Admin will activate your membership once payment is confirmed.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="packageId" value={packageId} />
      {state?.error && (
        <p className="mb-2 text-xs text-red-600">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-red-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Request this package"}
      </button>
    </form>
  );
}
