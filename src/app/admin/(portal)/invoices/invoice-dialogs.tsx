"use client";

import {
  createInvoiceAction,
  recordPaymentAction,
} from "@/app/admin/(portal)/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useState } from "react";
import { RiAddLine, RiMoneyDollarCircleLine } from "react-icons/ri";

type Customer = { id: string; name: string };
type Invoice = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer: { name: string } | null;
};

export function CreateInvoiceDialog({
  customers,
  onSuccess,
}: {
  customers: Customer[];
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    const amount = Number(formData.get("amountRinggit") ?? 0);
    formData.set("totalCents", String(Math.round(amount * 100)));
    formData.set("subtotalCents", String(Math.round(amount * 100)));
    await createInvoiceAction(formData);
    onSuccess?.();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="quiet" className="gap-1.5">
          <RiAddLine className="size-4" />
          New invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create invoice</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4">
          <Field label="Customer">
            <Select name="customerId" required>
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Amount (RM)">
            <Input
              name="amountRinggit"
              type="number"
              min="0"
              step="0.01"
              placeholder="150.00"
              required
            />
          </Field>
          <Field label="Due date">
            <Input name="dueDate" type="date" />
          </Field>
          <Field label="Notes">
            <Textarea name="notes" rows={2} />
          </Field>
          <Button type="submit" className="mt-1">
            Create invoice
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RecordPaymentDialog({
  invoices,
  onSuccess,
}: {
  invoices: Invoice[];
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(
    invoices[0]?.id ?? "",
  );

  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);

  async function handleSubmit(formData: FormData) {
    if (selectedInvoice) {
      formData.set("customerId", selectedInvoice.customerId);
    }
    await recordPaymentAction(formData);
    onSuccess?.();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" className="gap-1.5">
          <RiMoneyDollarCircleLine className="size-4" />
          Record payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4">
          <Field label="Invoice">
            <Select
              name="invoiceId"
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              required
            >
              <option value="">Select invoice…</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} · {inv.customer?.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Amount (RM)">
            <Input
              name="amountCents"
              type="number"
              min="0"
              step="1"
              placeholder="15000"
              required
            />
          </Field>
          <Field label="Method">
            <Select name="method" defaultValue="bank_transfer">
              <option value="bank_transfer">Bank transfer</option>
              <option value="tng">Touch &apos;n Go</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Reference">
            <Input name="reference" placeholder="Receipt / transaction no." />
          </Field>
          <Field label="Paid date">
            <Input
              name="paidDate"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
          </Field>
          <Button type="submit" className="mt-1">
            Record payment
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
