import { QrCheckIn } from "@/components/member/qr-check-in";

export default function CheckInPage() {
  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-500">
          Attendance
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-stone-50">
          Check in
        </h1>
        <p className="mt-1 text-sm text-stone-400">
          Scan the QR code displayed by your coach to mark your attendance.
        </p>
      </div>
      <QrCheckIn />
    </div>
  );
}
