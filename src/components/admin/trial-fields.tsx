"use client";

import { today } from "@/app/admin/(portal)/admin-format";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, Input } from "@/components/ui/form";
import {
  readSelect,
  SELECT_NONE,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
          <DatePicker defaultValue={today()} name="trialDate" />
        </Field>
        <Field label="Start">
          <Input defaultValue="19:00" name="trialStart" required type="time" />
        </Field>
        <Field label="End">
          <Input defaultValue="20:00" name="trialEnd" required type="time" />
        </Field>
      </div>
      <Field label="Coach">
        <Select defaultValue={SELECT_NONE} name="trialCoachId">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SELECT_NONE}>Not assigned</SelectItem>
            {coaches.map((coach) => (
              <SelectItem key={coach.id} value={coach.id}>
                {coach.name}
              </SelectItem>
            ))}
          </SelectContent>
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
    coachId: readSelect(fd.get("trialCoachId")),
    notes: String(fd.get("trialNotes") ?? "") || undefined,
  };
}
