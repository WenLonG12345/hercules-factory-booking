"use client";

import { today } from "@/app/admin/(portal)/admin-format";
import { Field, Input, Select } from "@/components/ui/form";
import { api } from "@/lib/trpc";

/**
 * The trial slot inputs. Shared by the create-customer dialog (where the trial
 * is optional) and the book-trial dialog, so both write the same shape. Names
 * are prefixed — the create form carries customer fields alongside these.
 */
export function TrialFields() {
  const { data: coaches = [] } = api.coach.list.useQuery();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Trial date">
          <Input defaultValue={today()} name="trialDate" required type="date" />
        </Field>
        <Field label="Start">
          <Input defaultValue="19:00" name="trialStart" required type="time" />
        </Field>
        <Field label="End">
          <Input defaultValue="20:00" name="trialEnd" required type="time" />
        </Field>
      </div>
      <Field label="Coach">
        <Select defaultValue="" name="trialCoachId">
          <option value="">Not assigned</option>
          {coaches.map((coach) => (
            <option key={coach.id} value={coach.id}>
              {coach.name}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );
}

/** Pulls the `TrialFields` values back out of a submitted form. */
export function readTrialFields(fd: FormData) {
  return {
    date: String(fd.get("trialDate")),
    startTime: String(fd.get("trialStart")),
    endTime: String(fd.get("trialEnd")),
    coachId: String(fd.get("trialCoachId") ?? "") || undefined,
    notes: String(fd.get("trialNotes") ?? "") || undefined,
  };
}
