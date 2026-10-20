"use client";

import { FileDown, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAYMENT_METHODS } from "@/db/schema";
import { exportInvoicePDF } from "@/lib/invoice-pdf";
import { api, type RouterOutputs } from "@/lib/trpc";
import { formatCurrency, whatsappLink } from "@/lib/utils";
import {
  centsToRinggit,
  PAYMENT_METHOD_LABEL,
  ringgitToCents,
  today,
} from "../admin-format";
import {
  InvoiceLinesEditor,
  type LineDraft,
  linesBlocker,
  linesFromItems,
  linesSubtotalCents,
  lineToInput,
} from "./invoice-lines-editor";

export type Invoice = RouterOutputs["invoice"]["list"][number];

/**
 * The customer-facing view of one invoice. The id is the whole credential, so
 * the link only ever goes out over WhatsApp to the customer it belongs to.
 * Read inside the click handler, not during render, so the `window` fallback
 * never runs on the server.
 */
const invoiceUrl = (id: string) =>
  `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/invoice/${id}`;

/** Marking paid is what books the income row — same call from the list and
 *  from the invoice page. */
export function MarkPaidDialog({
  invoice,
  onSuccess,
}: {
  invoice: Invoice;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const updateStatus = api.invoice.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Invoice updated.");
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button className="text-emerald-700" size="sm" variant="quiet">
          Mark paid
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark as paid</DialogTitle>
          <DialogDescription>
            {invoice.invoiceNumber} · {formatCurrency(invoice.totalCents)}. This
            books the income.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            updateStatus.mutate({
              id: invoice.id,
              status: "paid",
              paymentMethod: String(
                fd.get("paymentMethod"),
              ) as (typeof PAYMENT_METHODS)[number],
              paidDate: String(fd.get("paidDate")),
            });
          }}
        >
          <Field label="Payment method">
            <Select defaultValue="cash" name="paymentMethod">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {PAYMENT_METHOD_LABEL[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Paid date">
            <DatePicker defaultValue={today()} name="paidDate" />
          </Field>
          <Button disabled={updateStatus.isPending} type="submit">
            {updateStatus.isPending ? "Saving…" : "Mark as paid"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Fix a typo in the name or phone straight from the invoice row — the
 *  customer stays the same person, so this edits the customer, not the
 *  invoice. */
export function EditCustomerDialog({
  customer,
  onSuccess,
}: {
  customer: NonNullable<Invoice["customer"]>;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const update = api.customer.update.useMutation({
    onSuccess: () => {
      toast.success("Customer updated.");
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <button
          aria-label="Edit customer"
          className="grid size-10 place-items-center rounded-md text-stone-400 transition hover:bg-stone-100 hover:text-red-700 active:bg-stone-100"
          title="Edit name or phone"
          type="button"
        >
          <Pencil className="size-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit customer</DialogTitle>
          <DialogDescription>
            Changes apply to every invoice for this customer.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            update.mutate({
              id: customer.id,
              name: String(fd.get("name")).trim(),
              phone: String(fd.get("phone")).trim() || undefined,
              dateJoined: customer.dateJoined,
            });
          }}
        >
          <Field label="Name">
            <Input defaultValue={customer.name} name="name" required />
          </Field>
          <Field label="Phone">
            <Input
              defaultValue={customer.phone ?? ""}
              name="phone"
              placeholder="0123456789"
              type="tel"
            />
          </Field>
          <Button disabled={update.isPending} type="submit">
            {update.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Edit an issued invoice, lines and all. Not the customer — an invoice is a
 * sale to one person, so the wrong name means deleting it and issuing a new
 * one. Status moves through MarkPaidDialog. Package lines re-date their
 * package; one with credits already used cannot drop below what was burned.
 */
export function EditInvoiceDialog({
  invoice,
  onSuccess,
}: {
  invoice: Invoice;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  // Seeded when the dialog opens; Radix unmounts the content on close, so
  // the next open starts from the invoice again.
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [discount, setDiscount] = useState("0");

  const update = api.invoice.update.useMutation({
    onSuccess: () => {
      toast.success("Invoice updated.");
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => toast.error(error.message),
  });

  const subtotalCents = linesSubtotalCents(lines);
  const discountCents = ringgitToCents(discount);
  const problem =
    linesBlocker(lines) ??
    (discountCents > subtotalCents
      ? "The discount is bigger than the subtotal."
      : null);

  return (
    <Dialog
      onOpenChange={(next) => {
        if (next) {
          setLines(linesFromItems(invoice.items));
          setDiscount(centsToRinggit(invoice.discountCents));
        }
        setOpen(next);
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="quiet">
          <Pencil className="size-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit invoice</DialogTitle>
          <DialogDescription>
            {invoice.invoiceNumber}
            {invoice.status === "paid"
              ? " — this invoice is paid, so a new total updates its ledger row too."
              : ""}
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (problem) {
              toast.error(problem);
              return;
            }
            const fd = new FormData(e.currentTarget);
            update.mutate({
              id: invoice.id,
              items: lines.map(lineToInput),
              discountCents,
              issueDate: String(fd.get("issueDate")),
              dueDate: String(fd.get("dueDate") ?? "") || undefined,
              notes: String(fd.get("notes") ?? "") || undefined,
              paidDate: String(fd.get("paidDate") ?? "") || undefined,
            });
          }}
        >
          <InvoiceLinesEditor lines={lines} onChange={setLines} />
          <div
            className={`grid gap-4 ${invoice.status === "paid" ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}
          >
            <Field label="Discount (RM)">
              <Input
                inputMode="decimal"
                onChange={(e) => setDiscount(e.target.value)}
                value={discount}
              />
            </Field>
            <Field label="Issue date">
              <DatePicker defaultValue={invoice.issueDate} name="issueDate" />
            </Field>
            <Field label="Due date">
              <DatePicker
                clearable
                defaultValue={invoice.dueDate ?? ""}
                name="dueDate"
                placeholder="No due date"
              />
            </Field>
            {invoice.status === "paid" ? (
              <Field label="Paid date">
                <DatePicker
                  defaultValue={invoice.paidDate ?? today()}
                  name="paidDate"
                />
              </Field>
            ) : null}
          </div>
          <Field label="Notes">
            <Textarea defaultValue={invoice.notes ?? ""} name="notes" />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-600">
              Total{" "}
              <span className="font-black tabular-nums text-stone-950">
                {formatCurrency(Math.max(0, subtotalCents - discountCents))}
              </span>
            </p>
            <Button disabled={update.isPending} type="submit">
              {update.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Deleting an invoice unwinds the sale: the ledger row goes with it, so do
 * the packages it sold while no credits have been burned, and its number goes
 * back in the pot — the next invoice created takes it again.
 */
export function DeleteInvoiceDialog({
  invoice,
  onDeleted,
}: {
  invoice: Invoice;
  onDeleted?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const packages = invoice.items.flatMap((item) =>
    item.package ? [item.package] : [],
  );
  const untouched = packages.filter((pkg) => pkg.usedCredits === 0).length;

  const remove = api.invoice.delete.useMutation({
    onSuccess: () => {
      toast.success(`Invoice ${invoice.invoiceNumber} deleted.`);
      setOpen(false);
      onDeleted?.();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button className="text-red-700" size="sm" variant="quiet">
          <Trash2 className="size-4" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete invoice {invoice.invoiceNumber}?</DialogTitle>
          <DialogDescription>
            This cannot be undone.
            {invoice.status === "paid"
              ? " The income row it booked is removed from the daily ledger."
              : ""}
            {packages.length === 0
              ? ""
              : untouched === packages.length
                ? packages.length === 1
                  ? " The package it sold is removed too."
                  : " The packages it sold are removed too."
                : untouched === 0
                  ? " The packages it sold are kept — credits have already been used on them."
                  : ` ${untouched} of its ${packages.length} packages are removed; the rest are kept because credits have been used on them.`}{" "}
            Number {invoice.invoiceNumber} becomes free again for the next
            invoice.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button onClick={() => setOpen(false)} type="button" variant="quiet">
            Cancel
          </Button>
          <Button
            disabled={remove.isPending}
            onClick={() => remove.mutate({ id: invoice.id })}
            type="button"
          >
            {remove.isPending ? "Deleting…" : "Delete invoice"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Mark paid · edit · WhatsApp · PDF · delete — everything done to an
 *  invoice, shown the same way in the table row and on the invoice page. */
export function InvoiceActions({
  invoice,
  onDeleted,
  onSuccess,
}: {
  invoice: Invoice;
  /** The invoice page navigates away instead of refetching a dead row. */
  onDeleted?: () => void;
  onSuccess?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {invoice.status === "pending" ? (
        <MarkPaidDialog invoice={invoice} onSuccess={onSuccess} />
      ) : null}
      <EditInvoiceDialog invoice={invoice} onSuccess={onSuccess} />
      <Button
        className="text-emerald-700"
        disabled={!invoice.customer?.phone}
        size="sm"
        variant="quiet"
        onClick={() => {
          const phone = invoice.customer?.phone;
          if (!phone) return;
          window.open(
            whatsappLink(
              phone,
              `Hi ${invoice.customer?.name}, here is your invoice ${invoice.invoiceNumber} from Hercules Factory — ${formatCurrency(invoice.totalCents)}.\n\nView it here: ${invoiceUrl(invoice.id)}`,
            ),
            "_blank",
            "noopener",
          );
        }}
        title={
          invoice.customer?.phone
            ? undefined
            : "This customer has no phone number"
        }
      >
        <FaWhatsapp className="size-4" />
        Send
      </Button>
      <Button
        size="sm"
        variant="quiet"
        onClick={() =>
          exportInvoicePDF({
            customerName: invoice.customer?.name ?? "",
            customerPhone: invoice.customer?.phone ?? "",
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: invoice.issueDate,
            totalCents: invoice.totalCents,
            discountCents: invoice.discountCents,
            items: invoice.items.map((item) => ({
              description: item.description,
              amountCents: item.amountCents,
              window: item.package
                ? {
                    from: item.package.startDate,
                    until: item.package.expiryDate,
                  }
                : undefined,
            })),
            paid: invoice.status === "paid",
          })
        }
      >
        <FileDown className="size-4" />
        PDF
      </Button>
      <DeleteInvoiceDialog
        invoice={invoice}
        onDeleted={onDeleted ?? onSuccess}
      />
    </div>
  );
}
