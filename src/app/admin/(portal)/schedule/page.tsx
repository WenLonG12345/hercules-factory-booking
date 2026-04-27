"use client";

import { PageHeader } from "@/components/admin/admin-shell";
import { api } from "@/lib/trpc";
import { ScheduleCalendar } from "./schedule-calendar";

export default function AdminSchedulePage() {
  const utils = api.useUtils();
  const { data: sessions = [], isLoading } = api.schedule.list.useQuery();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-32 rounded bg-stone-200" />
        <div className="h-96 rounded-xl bg-stone-200" />
      </div>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Classes" title="Schedule" />
      <ScheduleCalendar
        sessions={sessions}
        onRefetch={() => utils.schedule.list.invalidate()}
      />
    </>
  );
}
