"use client";

import { Scanner } from "@yudiel/react-qr-scanner";
import { useCallback, useState, useTransition } from "react";
import { RiCheckboxCircleFill, RiCloseCircleFill } from "react-icons/ri";
import { memberCheckInAction } from "@/app/member/actions";

type State =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "success" }
  | { status: "error"; message: string };

export function QrCheckIn() {
  const [state, setState] = useState<State>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  const handleScan = useCallback(
    (results: { rawValue: string }[]) => {
      if (
        isPending ||
        state.status === "success" ||
        state.status === "checking"
      )
        return;
      const raw = results[0]?.rawValue;
      if (!raw) return;

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(raw)) {
        setState({
          status: "error",
          message: "Invalid QR code. Please scan the class QR.",
        });
        return;
      }

      setState({ status: "checking" });
      startTransition(async () => {
        const result = await memberCheckInAction(raw);
        if (result.success) {
          setState({ status: "success" });
        } else {
          setState({
            status: "error",
            message: result.error ?? "Check-in failed.",
          });
        }
      });
    },
    [isPending, state.status],
  );

  function reset() {
    setState({ status: "idle" });
  }

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <RiCheckboxCircleFill className="size-16 text-green-500" />
        <div>
          <p className="text-xl font-black text-stone-950">Checked in!</p>
          <p className="mt-1 text-sm text-stone-500">
            Attendance recorded. Enjoy your class!
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="mt-2 rounded-md bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-950 transition hover:bg-white"
        >
          Scan another
        </button>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <RiCloseCircleFill className="size-16 text-red-700" />
        <div>
          <p className="text-xl font-black text-stone-950">Check-in failed</p>
          <p className="mt-1 text-sm text-stone-500">{state.message}</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="mt-2 rounded-md bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-950 transition hover:bg-white"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {state.status === "checking" && (
        <p className="text-center text-sm font-medium text-amber-700">
          Checking in…
        </p>
      )}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <Scanner
          onScan={handleScan}
          styles={{ container: { width: "100%", aspectRatio: "1 / 1" } }}
        />
      </div>
      <p className="text-center text-xs text-stone-500">
        Point your camera at the class QR code displayed by the coach.
      </p>
    </div>
  );
}
