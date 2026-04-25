import { PageHeader } from "@/components/admin/admin-shell";
import { getSessions } from "@/server/services/queries";
import { ScheduleCalendar } from "./schedule-calendar";

export default async function AdminSchedulePage() {
  const sessions = await getSessions();

  return (
    <>
      <PageHeader eyebrow="Classes" title="Schedule" />
      <ScheduleCalendar sessions={sessions} />
    </>
  );
}
