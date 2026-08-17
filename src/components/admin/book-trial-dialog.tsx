"use client";

import { useState } from "react";
import { toast } from "sonner";
import { readTrialFields, TrialFields } from "@/components/admin/trial-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/form";
import { api } from "@/lib/trpc";

/** Books a trial for a customer who is already on file. New customers get
 *  theirs from the create-customer dialog instead. */
export function BookTrialDialog({
  customerId,
  customerName,
  trigger,
  onSuccess,
}: {
  customerId: string;
  customerName?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const book = api.trial.book.useMutation({
    onSuccess: () => {
      toast.success("Trial booked.");
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="quiet">
            Book trial
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book a trial</DialogTitle>
          <DialogDescription>
            {customerName ? `For ${customerName}. ` : ""}
            Creates a one-seat trial session and puts them on it.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            book.mutate({ ...readTrialFields(fd), customerId });
          }}
        >
          <TrialFields />
          <Field label="Notes">
            <Textarea name="trialNotes" />
          </Field>
          <Button disabled={book.isPending} type="submit">
            {book.isPending ? "Saving…" : "Book trial"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
