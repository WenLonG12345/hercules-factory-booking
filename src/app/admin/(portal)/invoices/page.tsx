"use client";

import { FileDown } from "lucide-react";
import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { columnHelper, DataTable } from "@/components/ui/data-table";
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
  PACKAGE_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  ringgitToCents,
  today,
} from "../admin-format";

type Invoice = RouterOutputs["invoice"]["list"][number];

const helper = columnHelper<Invoice>();

const statusTone = {
  paid: "green",
  pending: "amber",
  cancelled: "gray",
} as const;

/**
 * The customer-facing view of one invoice. The id is the whole credential, so
 * the link only ever goes out over WhatsApp to the customer it belongs to.
 * Read inside the click handler, not during render, so the `window` fallback
 * never runs on the server.
 */
const invoiceUrl = (id: string) =>
  `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/invoice/${id}`;

export default function InvoicesPage() {
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);

  const { data: invoices = [], isLoading } = api.invoice.list.useQuery();
  const { data: customers = [] } = api.customer.list.useQuery();
  const { data: packages = [] } = api.package.list.useQuery();

  const invalidate = () => {
    utils.invoice.list.invalidate();
    utils.report.dashboard.invalidate();
  };

  const createInvoice = api.invoice.create.useMutation({
    onSuccess: () => {
      toast.success("Invoice created.");
      setOpen(false);
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateStatus = api.invoice.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Invoice updated.");
      setPayingId(null);
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-32 rounded bg-stone-200" />
        <div className="h-64 rounded-xl bg-stone-200" />
      </div>
    );
  }

  const customerPackages = packages.filter(
    (pkg) => pkg.customerId === customerId,
  );

  const columns = helper.columns([
    helper.accessor("invoiceNumber", { header: "Number" }),
    helper.accessor((row) => row.customer?.name, {
      id: "customer",
      header: "Customer",
    }),
    helper.accessor("issueDate", { header: "Issued" }),
    helper.accessor("subtotalCents", {
      header: "Subtotal",
      cell: (info) => formatCurrency(info.getValue()),
    }),
    helper.accessor("discountCents", {
      header: "Discount",
      cell: (info) => formatCurrency(info.getValue()),
    }),
    helper.accessor("totalCents", {
      header: "Total",
      cell: (info) => formatCurrency(info.getValue()),
    }),
    helper.accessor("status", {
      header: "Status",
      cell: ({ row }) => (
        <Badge tone={statusTone[row.original.status]}>
          {row.original.status}
          {row.original.paidDate ? ` \u00b7 ${row.original.paidDate}` : ""}
        </Badge>
      ),
    }),
    helper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div className="flex flex-wrap items-center gap-3">
            {invoice.status === "pending" ? (
              <Dialog
                open={payingId === invoice.id}
                onOpenChange={(next) => setPayingId(next ? invoice.id : null)}
              >
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
                      {invoice.invoiceNumber} ·{" "}
                      {formatCurrency(invoice.totalCents)}. This books the
                      income.
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
            ) : null}
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
                  startDate: invoice.package?.startDate,
                  expiryDate: invoice.package?.expiryDate,
                })
              }
              type="button"
            >
              <FileDown className="size-4" />
              PDF
            </button>
          </div>
        );
      },
    }),
  ]);

  return (
    <>
      <PageHeader eyebrow="Money in" title="Invoices">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button">Create invoice</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create invoice</DialogTitle>
              <DialogDescription>
                Marking an invoice paid is what books the income — there is no
                separate income entry.
              </DialogDescription>
            </DialogHeader>
            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                createInvoice.mutate({
                  customerId: String(fd.get("customerId")),
                  packageId: String(fd.get("packageId") ?? "") || undefined,
                  description: String(fd.get("description") ?? "") || undefined,
                  subtotalCents: ringgitToCents(fd.get("subtotal")),
                  discountCents: ringgitToCents(fd.get("discount")),
                  issueDate: String(fd.get("issueDate")),
                  dueDate: String(fd.get("dueDate") ?? "") || undefined,
                  notes: String(fd.get("notes") ?? "") || undefined,
                });
              }}
            >
              <Field label="Customer">
                <Select
                  name="customerId"
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                  value={customerId}
                >
                  <option value="">Select a customer…</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} — {customer.phone}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Package (optional)">
                <Select name="packageId" defaultValue="">
                  <option value="">Not linked</option>
                  {customerPackages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {PACKAGE_TYPE_LABEL[pkg.type]} · {pkg.startDate}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Description">
                <Input name="description" placeholder="10 credit package" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Subtotal (RM)">
                  <Input inputMode="decimal" name="subtotal" required />
                </Field>
                <Field label="Discount (RM)">
                  <Input defaultValue="0" inputMode="decimal" name="discount" />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Issue date">
                  <Input
                    defaultValue={today()}
                    name="issueDate"
                    required
                    type="date"
                  />
                </Field>
                <Field label="Due date">
                  <Input name="dueDate" type="date" />
                </Field>
              </div>
              <Field label="Notes">
                <Textarea name="notes" />
              </Field>
              <Button disabled={createInvoice.isPending} type="submit">
                {createInvoice.isPending ? "Saving…" : "Create invoice"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <DataTable
        columns={columns}
        data={invoices}
        empty="No invoices yet."
        getRowId={(invoice) => invoice.id}
        sortable
      />
    </>
  );
}
