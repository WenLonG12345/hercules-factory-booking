import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { getSessions } from "@/server/services/queries";

export default async function SchedulePage() {
  const sessions = await getSessions();

  return (
    <main className="min-h-screen bg-stone-950 px-4 py-16 text-stone-50 md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link className="text-sm text-amber-300" href="/">
          Back to home
        </Link>
        <h1 className="mt-6 text-5xl font-black tracking-tight">
          Class schedule
        </h1>
        <div className="mt-8 grid gap-3">
          {sessions.map((session) => (
            <div
              className="flex flex-col justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5 md:flex-row md:items-center"
              key={session.id}
            >
              <div>
                <p className="flex items-center gap-2 text-lg font-black">
                  <CalendarDays className="size-5 text-red-500" />
                  {session.sessionDate}
                </p>
                <p className="mt-1 text-stone-300">
                  {session.startTime} - {session.endTime} - {session.coachName}
                </p>
              </div>
              <ButtonLink href="/member/login" variant="secondary">
                Book
              </ButtonLink>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
