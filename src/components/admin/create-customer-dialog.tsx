"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SOURCE_LABEL, today } from "@/app/admin/(portal)/admin-format";
import { readTrialFields, TrialFields } from "@/components/admin/trial-fields";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/form";
import {
  readSelect,
  SELECT_NONE,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CUSTOMER_SOURCES, GENDERS } from "@/db/schema";
import { api } from "@/lib/trpc";

/**
 * Customer intake. Ticking “came from a trial class” books the one-seat trial
 * in the same mutation, so the trial pipeline on this page fills itself.
 */
export function CreateCustomerDialog({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [withTrial, setWithTrial] = useState(false);

  const createCustomer = api.customer.create.useMutation({
    onSuccess: () => {
      toast.success(
        withTrial ? "Customer created and trial booked." : "Customer created.",
      );
      setOpen(false);
      setWithTrial(false);
      onSuccess?.();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button type="button" variant="quiet">
          Create customer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create customer</DialogTitle>
          <DialogDescription>
            Where they came from matters — the source feeds the monthly report.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const age = String(fd.get("age") ?? "");
            createCustomer.mutate({
              name: String(fd.get("name")),
              phone: String(fd.get("phone") ?? "") || undefined,
              ic: String(fd.get("ic") ?? "") || undefined,
              age: age ? Number(age) : undefined,
              gender: readSelect(fd.get("gender")) as
                | (typeof GENDERS)[number]
                | undefined,
              emergencyContact:
                String(fd.get("emergencyContact") ?? "") || undefined,
              dateJoined: String(fd.get("dateJoined")),
              source: readSelect(fd.get("source")) as
                | (typeof CUSTOMER_SOURCES)[number]
                | undefined,
              notes: String(fd.get("notes") ?? "") || undefined,
              trial: withTrial ? readTrialFields(fd) : undefined,
            });
          }}
        >
          <Field label="Name">
            <Input name="name" required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="WhatsApp phone">
              <Input name="phone" />
            </Field>
            <Field label="IC / company reg. no.">
              <Input name="ic" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Age">
              <Input max={100} min={3} name="age" type="number" />
            </Field>
            <Field label="Gender">
              <Select defaultValue={SELECT_NONE} name="gender">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_NONE}>Not set</SelectItem>
                  {GENDERS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date joined">
              <DatePicker defaultValue={today()} name="dateJoined" />
            </Field>
            <Field label="Emergency contact">
              <Input name="emergencyContact" />
            </Field>
            <Field label="Source">
              <Select defaultValue={SELECT_NONE} name="source">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_NONE}>Not set</SelectItem>
                  {CUSTOMER_SOURCES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {SOURCE_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
              <input
                checked={withTrial}
                className="size-4"
                name="withTrial"
                onChange={(e) => setWithTrial(e.target.checked)}
                type="checkbox"
              />
              Coming from a trial class
            </label>
            {withTrial ? <TrialFields /> : null}
          </div>
          <Field label="Notes">
            <Textarea name="notes" />
          </Field>
          <Button disabled={createCustomer.isPending} type="submit">
            {createCustomer.isPending
              ? "Saving…"
              : withTrial
                ? "Create customer & book trial"
                : "Create customer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
