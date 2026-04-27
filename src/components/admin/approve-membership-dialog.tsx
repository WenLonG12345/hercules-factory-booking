"use client";

import { approvePortalMembershipAction } from "@/app/admin/(portal)/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

type Package = { id: string; name: string };

export function ApproveMembershipDialog({
  invoiceId,
  customerName,
  totalCents,
  requestedPackageName,
  packages,
  onSuccess,
}: {
  invoiceId: string;
  customerName: string;
  totalCents: number;
  requestedPackageName: string;
  packages: Package[];
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const matchedPkg =
    packages.find(
      (p) => p.name.toLowerCase() === requestedPackageName.toLowerCase(),
    ) ?? packages[0];

  async function handleSubmit(formData: FormData) {
    await approvePortalMembershipAction(formData);
    onSuccess?.();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" className="h-7 text-xs">
          Approve
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Approve membership request</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-stone-600">
          <span className="font-semibold">{customerName}</span> requested{" "}
          <span className="font-semibold">{requestedPackageName}</span> —{" "}
          {formatCurrency(totalCents)}.
        </p>
        <form action={handleSubmit} className="grid gap-4">
          <input type="hidden" name="invoiceId" value={invoiceId} />
          <Field label="Package to activate">
            <Select name="packageId" defaultValue={matchedPkg?.id}>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Payment method">
            <Select name="method" defaultValue="bank_transfer">
              <option value="bank_transfer">Bank transfer</option>
              <option value="tng">Touch &apos;n Go</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Reference / receipt no.">
            <Input name="reference" placeholder="Optional" />
          </Field>
          <Field label="Payment date">
            <Input
              name="paidDate"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </Field>
          <Button type="submit" className="mt-1">
            Approve &amp; activate membership
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
