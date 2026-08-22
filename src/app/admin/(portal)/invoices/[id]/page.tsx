"use client";

import Link from "next/link";
import { use } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/trpc";
import { formatCurrency, whatsappLink } from "@/lib/utils";
import {
  PACKAGE_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  remaining,
} from "../../admin-format";
import { InvoiceActions } from "../invoice-actions";

const statusTone = {
  paid: "green",
  pending: "amber",
  cancelled: "gray",
} as const;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-stone-900">{value}</dd>
    </div>
  );
}

export default function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const utils = api.useUtils();

  // ponytail: reads the same cached list the table uses instead of a byId
  // procedure — one admin, a few hundred invoices. Add invoice.byId if the
  // list ever needs paging.
  const { data: invoices = [], isLoading } = api.invoice.list.useQuery();
  const invoice = invoices.find((row) => row.id === id);

  const invalidate = () => {
    utils.invoice.list.invalidate();
    utils.report.dashboard.invalidate();
  };

  const updateStatus = api.invoice.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Invoice updated.");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-52 rounded bg-stone-200" />
        <div className="h-40 rounded-xl bg-stone-200" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <Card>
        <p className="text-sm text-stone-600">
          Invoice not found.{" "}
          <Link className="font-semibold text-red-700" href="/admin/invoices">
            Back to invoices
          </Link>
        </p>
      </Card>
    );
  }

  const { customer, package: pkg } = invoice;
  const left = pkg ? remaining(pkg) : null;
  // A linked package carries the real dates; the invoice's own window is the
  // fallback for one written by hand.
  const validFrom = pkg?.startDate ?? invoice.validFrom;
  const validUntil = pkg?.expiryDate ?? invoice.validUntil;

  return (
    <>
      <PageHeader eyebrow="Invoice" title={invoice.invoiceNumber}>
        <InvoiceActions invoice={invoice} onSuccess={invalidate} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Badge tone={statusTone[invoice.status]}>
              {invoice.status}
              {invoice.paidDate ? ` · ${invoice.paidDate}` : ""}
            </Badge>
            <div className="flex gap-2">
              {invoice.status !== "pending" ? (
                <Button
                  disabled={updateStatus.isPending}
                  onClick={() =>
                    updateStatus.mutate({ id: invoice.id, status: "pending" })
                  }
                  type="button"
                  variant="quiet"
                >
                  Move to pending
                </Button>
              ) : null}
              {invoice.status !== "cancelled" ? (
                <Button
                  disabled={updateStatus.isPending}
                  onClick={() =>
                    updateStatus.mutate({ id: invoice.id, status: "cancelled" })
                  }
                  type="button"
                  variant="quiet"
                >
                  Cancel invoice
                </Button>
              ) : null}
            </div>
          </div>

          <dl className="grid gap-4 sm:grid-cols-3">
            <Row label="Issued" value={invoice.issueDate} />
            <Row label="Due" value={invoice.dueDate ?? "—"} />
            <Row
              label="Payment method"
              value={
                invoice.paymentMethod
                  ? PAYMENT_METHOD_LABEL[invoice.paymentMethod]
                  : "—"
              }
            />
            <Row
              label="Description"
              value={invoice.description ?? "Membership"}
            />
            <Row
              label="Valid"
              value={
                validFrom && validUntil ? `${validFrom} → ${validUntil}` : "—"
              }
            />
            <Row
              label="Subtotal"
              value={formatCurrency(invoice.subtotalCents)}
            />
            <Row
              label="Discount"
              value={formatCurrency(invoice.discountCents)}
            />
          </dl>

          <p className="mt-6 border-t border-stone-100 pt-4 text-3xl font-black tracking-tight">
            {formatCurrency(invoice.totalCents)}
          </p>

          {invoice.notes ? (
            <p className="mt-4 border-t border-stone-100 pt-4 text-sm text-stone-600">
              {invoice.notes}
            </p>
          ) : null}
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Customer
          </p>
          {customer ? (
            <>
              <Link
                className="mt-1 block text-xl font-black text-red-700"
                href={`/admin/customers/${customer.id}`}
              >
                {customer.name}
              </Link>
              <p className="mt-1 text-sm text-stone-600">{customer.phone}</p>
              <a
                className="mt-3 inline-flex text-sm font-semibold text-emerald-700"
                href={whatsappLink(
                  customer.phone,
                  `Hi ${customer.name}, this is Hercules Factory 👊`,
                )}
                rel="noreferrer"
                target="_blank"
              >
                WhatsApp
              </a>
            </>
          ) : (
            <p className="mt-1 text-sm text-stone-600">—</p>
          )}

          <div className="mt-5 border-t border-stone-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Package
            </p>
            {pkg ? (
              <dl className="mt-2 grid gap-2 text-sm">
                <Row label="Type" value={PACKAGE_TYPE_LABEL[pkg.type]} />
                <Row
                  label="Runs"
                  value={`${pkg.startDate} → ${pkg.expiryDate}`}
                />
                <Row
                  label="Credits"
                  value={
                    left === null
                      ? "Unlimited"
                      : `${left} of ${pkg.totalCredits} left`
                  }
                />
              </dl>
            ) : (
              <p className="mt-1 text-sm text-stone-600">Not linked</p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
