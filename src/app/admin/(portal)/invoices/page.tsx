"use client";

import { FileDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
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
import { TableWrap, tableClass, tdClass, thClass } from "@/components/ui/table";
import { PAYMENT_METHODS } from "@/db/schema";
import { exportInvoicePDF } from "@/lib/invoice-pdf";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import {
  PACKAGE_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  ringgitToCents,
  today,
} from "../admin-format";

const statusTone = {
  paid: "green",
  pending: "amber",
  cancelled: "gray",
} as const;

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

      <TableWrap>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Number</th>
              <th className={thClass}>Customer</th>
              <th className={thClass}>Issued</th>
              <th className={thClass}>Subtotal</th>
              <th className={thClass}>Discount</th>
              <th className={thClass}>Total</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td className={tdClass} colSpan={8}>
                  No invoices yet.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className={tdClass}>{invoice.invoiceNumber}</td>
                  <td className={tdClass}>{invoice.customer?.name}</td>
                  <td className={tdClass}>{invoice.issueDate}</td>
                  <td className={tdClass}>
                    {formatCurrency(invoice.subtotalCents)}
                  </td>
                  <td className={tdClass}>
                    {formatCurrency(invoice.discountCents)}
                  </td>
                  <td className={tdClass}>
                    {formatCurrency(invoice.totalCents)}
                  </td>
                  <td className={tdClass}>
                    <Badge tone={statusTone[invoice.status]}>
                      {invoice.status}
                      {invoice.paidDate ? ` · ${invoice.paidDate}` : ""}
                    </Badge>
                  </td>
                  <td className={tdClass}>
                    <div className="flex flex-wrap items-center gap-3">
                      {invoice.status === "pending" ? (
                        <Dialog
                          open={payingId === invoice.id}
                          onOpenChange={(next) =>
                            setPayingId(next ? invoice.id : null)
                          }
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
                                {formatCurrency(invoice.totalCents)}. This books
                                the income.
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
                                <Select
                                  defaultValue="cash"
                                  name="paymentMethod"
                                >
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
                              <Button
                                disabled={updateStatus.isPending}
                                type="submit"
                              >
                                {updateStatus.isPending
                                  ? "Saving…"
                                  : "Mark as paid"}
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      ) : null}
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
                          })
                        }
                        type="button"
                      >
                        <FileDown className="size-4" />
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
}
