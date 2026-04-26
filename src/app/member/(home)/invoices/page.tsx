import { desc, eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { invoices } from "@/db/schema";
import { formatCents, formatDate, requireCustomer } from "../member-data";

export default async function InvoicesPage() {
  const { customer, db } = await requireCustomer();

  const myInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.customerId, customer.id))
    .orderBy(desc(invoices.issueDate));

  const statusTone = (
    status: string,
  ): "green" | "amber" | "gray" => {
    if (status === "paid") return "green";
    if (status === "pending") return "amber";
    return "gray";
  };

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-500">
          Billing
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-stone-50">
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
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/4 px-3 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-stone-100">
                  {invoice.invoiceNumber}
                </p>
                <p className="text-xs text-stone-400">
                  {formatDate(invoice.issueDate)}
                </p>
                {invoice.notes && (
                  <p className="mt-0.5 text-xs text-stone-500 max-w-48 truncate">
                    {invoice.notes}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <p className="font-bold text-stone-100">
                  {formatCents(invoice.totalCents)}
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
