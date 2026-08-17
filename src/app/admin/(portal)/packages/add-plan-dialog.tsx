"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/lib/trpc";
import { PlanForm } from "./plan-form";

/** Radix unmounts the content on close, so the form resets itself. */
export function AddPlanDialog({
  sortOrder,
  onSuccess,
}: {
  sortOrder: number;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const create = api.packagePlan.create.useMutation({
    onSuccess: () => {
      toast.success("Plan added.");
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">Add plan</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add package plan</DialogTitle>
          <DialogDescription>
            A plan is what the gym sells. Selling it copies these numbers onto
            the customer's package — later edits leave past sales alone.
          </DialogDescription>
        </DialogHeader>
        <PlanForm
          onSubmit={(values) => create.mutate(values)}
          pending={create.isPending}
          sortOrder={sortOrder}
          submitLabel="Add plan"
        />
      </DialogContent>
    </Dialog>
  );
}
