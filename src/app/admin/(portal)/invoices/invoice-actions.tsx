"use client";

import { FileDown, Pencil } from "lucide-react";
import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
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
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { PAYMENT_METHODS } from "@/db/schema";
import { exportInvoicePDF } from "@/lib/invoice-pdf";
import { api, type RouterOutputs } from "@/lib/trpc";
import { formatCurrency, whatsappLink } from "@/lib/utils";
import {
  centsToRinggit,
  PACKAGE_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  ringgitToCents,
  today,
} from "../admin-format";

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
        <button
          className="text-sm font-semibold text-emerald-700"
          type="button"
        >
          Mark paid
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
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
              {PAYMENT_METHODS.map((value) => (
                <option key={value} value={value}>
                  {PAYMENT_METHOD_LABEL[value]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Paid date">
            <Input
              defaultValue={today()}
              name="paidDate"
              required
              type="date"
            />
          </Field>
          <Button disabled={updateStatus.isPending} type="submit">
            {updateStatus.isPending ? "Saving…" : "Mark as paid"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Edit an issued invoice. Not the customer and not the package — an invoice is
 * the sale of one package to one customer, so getting either wrong means
 * deleting it and issuing a new one. Status moves through MarkPaidDialog.
 */
export function EditInvoiceDialog({
  invoice,
  onSuccess,
}: {
  invoice: Invoice;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const update = api.invoice.update.useMutation({
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
        <button
          className="inline-flex items-center gap-1 text-sm font-semibold text-stone-600"
          type="button"
        >
          <Pencil className="size-4" />
          Edit
        </button>
      </DialogTrigger>
      <DialogContent>
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
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            update.mutate({
              id: invoice.id,
              customerId: invoice.customerId,
              description: String(fd.get("description") ?? "") || undefined,
              subtotalCents: ringgitToCents(fd.get("subtotal")),
              discountCents: ringgitToCents(fd.get("discount")),
              issueDate: String(fd.get("issueDate")),
              dueDate: String(fd.get("dueDate") ?? "") || undefined,
              validFrom: String(fd.get("validFrom") ?? "") || undefined,
              validUntil: String(fd.get("validUntil") ?? "") || undefined,
              notes: String(fd.get("notes") ?? "") || undefined,
            });
          }}
        >
          <Field label="Description">
            <Input
              defaultValue={invoice.description ?? ""}
              name="description"
              placeholder="10 credit package"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Subtotal (RM)">
              <Input
                defaultValue={centsToRinggit(invoice.subtotalCents)}
                inputMode="decimal"
                name="subtotal"
                required
              />
            </Field>
            <Field label="Discount (RM)">
              <Input
                defaultValue={centsToRinggit(invoice.discountCents)}
                inputMode="decimal"
                name="discount"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Issue date">
              <Input
                defaultValue={invoice.issueDate}
                name="issueDate"
                required
                type="date"
              />
            </Field>
            <Field label="Due date">
              <Input
                defaultValue={invoice.dueDate ?? ""}
                name="dueDate"
                type="date"
              />
            </Field>
          </div>
          {/* A linked package prints its own window; these two only matter for
              a hand-written invoice. */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Valid from">
              <Input
                defaultValue={invoice.validFrom ?? ""}
                name="validFrom"
                type="date"
              />
            </Field>
            <Field label="Valid until">
              <Input
                defaultValue={invoice.validUntil ?? ""}
                name="validUntil"
                type="date"
              />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea defaultValue={invoice.notes ?? ""} name="notes" />
          </Field>
          <Button disabled={update.isPending} type="submit">
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Mark paid · edit · WhatsApp · PDF — everything done to an invoice, shown
 *  the same way in the table row and on the invoice page. */
export function InvoiceActions({
  invoice,
  onSuccess,
}: {
  invoice: Invoice;
  onSuccess?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {invoice.status === "pending" ? (
        <MarkPaidDialog invoice={invoice} onSuccess={onSuccess} />
      ) : null}
      <EditInvoiceDialog invoice={invoice} onSuccess={onSuccess} />
      <button
        className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 disabled:opacity-40"
        disabled={!invoice.customer?.phone}
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
        type="button"
      >
        <FaWhatsapp className="size-4" />
        Send
      </button>
      <button
        className="inline-flex items-center gap-1 text-sm font-semibold text-stone-600"
        onClick={() =>
          exportInvoicePDF({
            customerName: invoice.customer?.name ?? "",
            customerPhone: invoice.customer?.phone ?? "",
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: invoice.issueDate,
            totalCents: invoice.totalCents,
            description:
              invoice.description ??
              (invoice.package
                ? `${PACKAGE_TYPE_LABEL[invoice.package.type]} package`
                : "Membership"),
            startDate:
              invoice.package?.startDate ?? invoice.validFrom ?? undefined,
            expiryDate:
              invoice.package?.expiryDate ?? invoice.validUntil ?? undefined,
          })
        }
        type="button"
      >
        <FileDown className="size-4" />
        PDF
      </button>
    </div>
  );
}
