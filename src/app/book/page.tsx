import { CheckCircle, Droplets, Package, Shirt } from "lucide-react";
import { publicBookingAction } from "@/app/admin/(portal)/actions";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { getSessions } from "@/server/services/queries";
import customParseFormat from "dayjs/plugin/customParseFormat";
import dayjs from "dayjs";

dayjs.extend(customParseFormat);

const SCHEDULE = [
  { days: "Mon – Thu", slots: ["7:00 PM – 8:30 PM", "8:30 PM – 10:00 PM"] },
  {
    days: "Friday",
    slots: ["7:00 PM – 8:00 PM", "8:00 PM – 9:00 PM", "9:00 PM – 10:00 PM"],
  },
  { days: "Saturday", slots: ["9:00 PM – 10:30 PM"] },
];

const WHAT_TO_BRING = [
  { icon: Package, label: "Hand wraps" },
  { icon: Droplets, label: "Water bottle" },
  { icon: Shirt, label: "Towel" },
];

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const [sessions, params] = await Promise.all([getSessions(), searchParams]);
  const futureSessions = sessions.filter((s) => !s.isCancelled);

  console.log("@test", futureSessions);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <PublicHeader />

      <main>
        <section className="relative isolate overflow-hidden pt-20 pb-10 md:pt-24 md:pb-20">
          <img
            alt="Muay Thai training"
            className="absolute inset-0 -z-20 h-full w-full object-cover opacity-30"
            src="https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?auto=format&fit=crop&w=1800&q=80"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(15,12,10,0.98),rgba(15,12,10,0.80),rgba(127,29,29,0.35))]" />

          <div className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-[1fr_1fr] md:gap-12 md:px-8">
            <div className="flex flex-col justify-center pt-2 md:py-6">
              <p className="mb-3 inline-flex w-fit items-center gap-2 rounded bg-red-700 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.2em] text-white md:mb-5 md:text-xs md:tracking-[0.24em]">
                Book a class
              </p>
              <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-stone-50 md:text-6xl md:leading-tight">
                Reserve your spot
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-stone-300 md:mt-5 md:text-base md:leading-8">
                Fill in your details and we&apos;ll confirm your slot via
                WhatsApp. No experience needed for your first class.
              </p>

              <ul className="mt-4 flex flex-wrap gap-2 md:hidden">
                {WHAT_TO_BRING.map(({ icon: Icon, label }) => (
                  <li
                    key={label}
                    className="inline-flex items-center gap-2 rounded border border-amber-300/25 bg-stone-900/55 px-3 py-2 text-xs font-semibold text-stone-200"
                  >
                    <Icon className="size-3.5 shrink-0 text-amber-300" />
                    {label}
                  </li>
                ))}
              </ul>

              <div className="mt-8 hidden md:block">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
                  What to bring
                </p>
                <ul className="grid gap-2">
                  {WHAT_TO_BRING.map(({ icon: Icon, label }) => (
                    <li
                      key={label}
                      className="flex items-center gap-3 text-sm text-stone-300"
                    >
                      <Icon className="size-4 text-amber-300 shrink-0" />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 hidden border-l-2 border-amber-300/40 pl-5 md:block">
                <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
                  Class schedule
                </p>
                <ul className="grid gap-3">
                  {SCHEDULE.map(({ days, slots }) => (
                    <li key={days}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                        {days}
                      </p>
                      <ul className="mt-1 grid gap-1">
                        {slots.map((slot) => (
                          <li key={slot} className="text-sm font-semibold">
                            {slot}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col items-start">
              <form
                action={publicBookingAction}
                className="grid w-full gap-3 rounded-lg border border-white/10 bg-stone-900/85 p-4 backdrop-blur md:gap-4 md:rounded-xl md:p-7"
              >
                <div>
                  <h2 className="text-lg font-black md:text-xl">
                    Book your first class
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-stone-400">
                    We&apos;ll confirm via WhatsApp within a few hours.
                  </p>
                </div>

                {params.success ? (
                  <div className="flex items-center gap-3 rounded-lg bg-emerald-900/50 border border-emerald-700/50 px-4 py-3">
                    <CheckCircle className="size-5 text-emerald-400 shrink-0" />
                    <p className="text-sm font-semibold text-emerald-300">
                      Booking received! We&apos;ll confirm your slot shortly.
                    </p>
                  </div>
                ) : null}

                <Field label="Name" className="text-stone-300">
                  <Input
                    name="name"
                    required
                    className="border-stone-700 bg-stone-800 text-base text-stone-100 placeholder:text-stone-500 md:text-sm"
                  />
                </Field>
                <Field label="WhatsApp number" className="text-stone-300">
                  <Input
                    name="phone"
                    required
                    className="border-stone-700 bg-stone-800 text-base text-stone-100 placeholder:text-stone-500 md:text-sm"
                  />
                </Field>
                <Field label="Email (optional)" className="text-stone-300">
                  <Input
                    name="email"
                    type="email"
                    className="border-stone-700 bg-stone-800 text-base text-stone-100 placeholder:text-stone-500 md:text-sm"
                  />
                </Field>
                <Field label="Class slot" className="text-stone-300">
                  <Select
                    name="classSessionId"
                    required
                    className="border-stone-700 bg-stone-800 text-base text-stone-100 md:text-sm"
                  >
                    {futureSessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.sessionDate} (
                        {dayjs(session.sessionDate).format("dddd")}) ·{" "}
                        {dayjs(session.startTime, "HH:mm:ss").format("h:mm A")}{" "}
                        – {dayjs(session.endTime, "HH:mm:ss").format("h:mm A")}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Notes (optional)" className="text-stone-300">
                  <Textarea
                    name="notes"
                    placeholder="Injury notes or experience level"
                    className="min-h-20 border-stone-700 bg-stone-800 text-base text-stone-100 placeholder:text-stone-500 md:min-h-24 md:text-sm"
                  />
                </Field>
                <Button type="submit" className="mt-1 h-12 md:h-11">
                  Request booking
                </Button>
              </form>

              <div className="mt-6 w-full border-l-2 border-amber-300/40 pl-4 md:hidden">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
                  Class schedule
                </p>
                <ul className="grid gap-3">
                  {SCHEDULE.map(({ days, slots }) => (
                    <li key={days}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                        {days}
                      </p>
                      <ul className="mt-1 grid gap-1">
                        {slots.map((slot) => (
                          <li key={slot} className="text-sm font-semibold">
                            {slot}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
