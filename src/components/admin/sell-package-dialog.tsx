"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  defaultExpiry,
  PACKAGE_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  ringgitToCents,
  today,
} from "@/app/admin/(portal)/admin-format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { PACKAGE_TYPES, PAYMENT_METHODS } from "@/db/schema";
import { api } from "@/lib/trpc";

export function SellPackageDialog({
  customerId,
  customerName,
  convertedFromSessionId,
  trigger,
  onSuccess,
}: {
  customerId?: string;
  customerName?: string;
  convertedFromSessionId?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("credit");
  const [startDate, setStartDate] = useState(today());

  const { data: customers = [] } = api.customer.list.useQuery(undefined, {
    enabled: open && !customerId,
  });

  const sell = api.package.create.useMutation({
    onSuccess: () => {
      toast.success("Package sold.");
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button type="button">Sell package</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sell package</DialogTitle>
          <DialogDescription>
            {customerName
              ? `For ${customerName}.`
              : "Pick a customer and record what they paid."}
            {" Ticking “create invoice” books the income at the same time."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const packageType = String(fd.get("type"));
            sell.mutate({
              customerId: customerId ?? String(fd.get("customerId")),
              type: packageType as (typeof PACKAGE_TYPES)[number],
              startDate: String(fd.get("startDate")),
              expiryDate: String(fd.get("expiryDate")),
              totalCredits:
                packageType === "unlimited"
                  ? undefined
                  : Number(fd.get("totalCredits")),
              amountPaidCents: ringgitToCents(fd.get("amountPaid")),
              paymentMethod: String(
                fd.get("paymentMethod"),
              ) as (typeof PAYMENT_METHODS)[number],
              notes: String(fd.get("notes") ?? "") || undefined,
              convertedFromSessionId,
              createInvoice: fd.get("createInvoice") === "on",
              discountCents: ringgitToCents(fd.get("discount")),
              markInvoicePaid: fd.get("markInvoicePaid") === "on",
            });
          }}
        >
          {customerId ? null : (
            <Field label="Customer">
              <Select name="customerId" required>
                <option value="">Select a customer…</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} — {customer.phone}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Package type">
            <Select
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {PACKAGE_TYPES.map((value) => (
                <option key={value} value={value}>
                  {PACKAGE_TYPE_LABEL[value]}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start date">
              <Input
                name="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </Field>
            <Field label="Expiry date">
              <Input
                name="expiryDate"
                type="date"
                defaultValue={defaultExpiry(startDate, type)}
                key={`${startDate}-${type}`}
                required
              />
            </Field>
          </div>
          {type === "unlimited" ? null : (
            <Field label={type === "pt" ? "PT sessions" : "Credits"}>
              <Input
                name="totalCredits"
                type="number"
                min={1}
                defaultValue={10}
                required
              />
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount paid (RM)">
              <Input name="amountPaid" inputMode="decimal" required />
            </Field>
            <Field label="Payment method">
              <Select name="paymentMethod" defaultValue="cash">
                {PAYMENT_METHODS.map((value) => (
                  <option key={value} value={value}>
                    {PAYMENT_METHOD_LABEL[value]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-3 rounded-md border border-stone-200 bg-stone-50 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
              <input
                className="size-4"
                defaultChecked
                name="createInvoice"
                type="checkbox"
              />
              Create invoice
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Discount (RM)">
                <Input name="discount" inputMode="decimal" defaultValue="0" />
              </Field>
              <label className="flex items-end gap-2 pb-3 text-sm font-medium text-stone-700">
                <input
                  className="size-4"
                  defaultChecked
                  name="markInvoicePaid"
                  type="checkbox"
                />
                Mark as paid (books income)
              </label>
            </div>
          </div>
          <Field label="Notes">
            <Textarea name="notes" />
          </Field>
          <Button disabled={sell.isPending} type="submit">
            {sell.isPending ? "Saving…" : "Sell package"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
