"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import type { LedgerCategory, LedgerDirection } from "@/db/schema";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ringgitToCents, today } from "../admin-format";

export function AddEntryDialog({
  categories,
  onSuccess,
}: {
  categories: LedgerCategory[];
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<LedgerDirection>("income");
  const [categoryId, setCategoryId] = useState("");

  const { data: coaches = [] } = api.coach.list.useQuery();
  const create = api.ledger.create.useMutation({
    onSuccess: () => {
      toast.success("Entry recorded.");
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => toast.error(error.message),
  });

  const options = categories.filter(
    (category) => category.direction === direction && !category.isArchived,
  );
  const selected = options.find((category) => category.id === categoryId);
  const isSalary = selected?.slug === "coach_salary";

  function switchDirection(next: LedgerDirection) {
    setDirection(next);
    setCategoryId("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">Add entry</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add daily entry</DialogTitle>
          <DialogDescription>
            One row of the daily book. Package sales stay on the Invoices page —
            marking an invoice paid books its income here automatically.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            if (!categoryId) {
              toast.error("Pick a category.");
              return;
            }
            create.mutate({
              date: String(fd.get("date")),
              direction,
              categoryId,
              amountCents: ringgitToCents(fd.get("amount")),
              coachId: readSelect(fd.get("coachId")),
              vendor: String(fd.get("vendor") ?? "") || undefined,
              notes: String(fd.get("notes") ?? "") || undefined,
            });
          }}
        >
          <div className="grid grid-cols-2 gap-2 rounded-md bg-stone-100 p-1">
            {(["income", "expense"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => switchDirection(value)}
                className={cn(
                  "rounded px-3 py-2 text-sm font-semibold capitalize transition",
                  direction === value
                    ? "bg-white text-stone-950 shadow-sm"
                    : "text-stone-500 hover:text-stone-800",
                )}
              >
                {value}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date">
              <DatePicker defaultValue={today()} name="date" />
            </Field>
            <Field label="Amount (RM)">
              <Input inputMode="decimal" name="amount" required />
            </Field>
          </div>

          <Field label="Category">
            <Select onValueChange={setCategoryId} required value={categoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {options.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {isSalary ? (
            <Field label="Coach">
              <Select defaultValue={SELECT_NONE} name="coachId">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_NONE}>Not set</SelectItem>
                  {coaches.map((coach) => (
                    <SelectItem key={coach.id} value={coach.id}>
                      {coach.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}

          <Field label={direction === "expense" ? "Vendor" : "Paid by"}>
            <Input name="vendor" />
          </Field>
          <Field label="Purpose / notes">
            <Textarea name="notes" />
          </Field>

          <Button disabled={create.isPending} type="submit">
            {create.isPending ? "Saving…" : "Add entry"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
