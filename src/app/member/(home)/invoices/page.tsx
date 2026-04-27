"use client";

import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { formatDate } from "../member-format";

export default function InvoicesPage() {
  const { data: myInvoices = [], isLoading } = api.portal.myInvoices.useQuery();

  const statusTone = (status: string): "green" | "amber" | "gray" => {
    if (status === "paid") return "green";
    if (status === "pending") return "amber";
    return "gray";
  };

  if (isLoading) {
    return (
      <div className="animate-pulse grid gap-5">
        <div className="h-8 w-24 rounded bg-stone-200" />
        <div className="grid gap-2">
          {["a", "b", "c"].map((k) => (
            <div key={k} className="h-16 rounded-lg bg-stone-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-700">
          Billing
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-stone-950">
          Invoices
        </h1>
      </div>

      {myInvoices.length === 0 ? (
        <p className="text-center text-sm text-stone-500 py-8">
          No invoices yet.
        </p>
      ) : (
        <div className="grid gap-2">
          {myInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-3 text-sm shadow-sm"
            >
              <div>
                <p className="font-medium text-stone-950">
                  {invoice.invoiceNumber}
                </p>
                <p className="text-xs text-stone-500">
                  {formatDate(invoice.issueDate)}
                </p>
                {invoice.notes && (
                  <p className="mt-0.5 max-w-48 truncate text-xs text-stone-500">
                    {invoice.notes}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <p className="font-bold text-stone-950">
                  {formatCurrency(invoice.totalCents)}
                </p>
                <Badge tone={statusTone(invoice.status)}>
                  {invoice.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
