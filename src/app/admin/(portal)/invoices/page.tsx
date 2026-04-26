import { RiWhatsappLine } from "react-icons/ri";
import {
  CreateInvoiceDialog,
  RecordPaymentDialog,
} from "@/app/admin/(portal)/invoices/invoice-dialogs";
import { PageHeader } from "@/components/admin/admin-shell";
import { ApproveMembershipDialog } from "@/components/admin/approve-membership-dialog";
import { Badge } from "@/components/ui/badge";
import { TableWrap, tableClass, tdClass, thClass } from "@/components/ui/table";
import { formatCurrency, whatsappLink } from "@/lib/utils";
import {
  getCustomers,
  getInvoices,
  getPackages,
} from "@/server/services/queries";

const PORTAL_PREFIX = "Customer self-request via portal: ";

function parsePortalPackageName(notes: string | null): string | null {
  if (!notes?.startsWith(PORTAL_PREFIX)) return null;
  return notes.slice(PORTAL_PREFIX.length);
}

const statusTone: Record<string, "green" | "amber" | "gray"> = {
  paid: "green",
  pending: "amber",
  overdue: "gray",
};

export default async function InvoicesPage() {
  const [invoices, customers, packages] = await Promise.all([
    getInvoices(),
    getCustomers(),
    getPackages(),
  ]);

  const activePackages = packages.filter((p) => p.isActive);
  const pendingPortalRequests = invoices.filter(
    (inv) =>
      inv.status === "pending" && parsePortalPackageName(inv.notes ?? null),
  );
  const otherInvoices = invoices.filter(
    (inv) =>
      !(inv.status === "pending" && parsePortalPackageName(inv.notes ?? null)),
  );

  return (
    <>
      <PageHeader eyebrow="Payments" title="Invoices">
        <div className="flex items-center gap-2">
          <CreateInvoiceDialog customers={customers} />
          <RecordPaymentDialog
            invoices={invoices.map((inv) => ({
              id: inv.id,
              invoiceNumber: inv.invoiceNumber,
              customerId: inv.customerId,
              customer: inv.customer ?? null,
            }))}
          />
        </div>
      </PageHeader>

      {pendingPortalRequests.length > 0 && (
        <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
            Pending membership requests — {pendingPortalRequests.length}
          </p>
          <div className="grid gap-2">
            {pendingPortalRequests.map((inv) => {
              const pkgName = parsePortalPackageName(inv.notes ?? null) ?? "";
              return (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-4 rounded-md bg-white px-4 py-3 shadow-sm ring-1 ring-amber-100"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-stone-900">
                      {inv.customer?.name}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {pkgName} · {formatCurrency(inv.totalCents)} ·{" "}
                      {inv.invoiceNumber}
                    </p>
                  </div>
                  <ApproveMembershipDialog
                    invoiceId={inv.id}
                    customerName={inv.customer?.name ?? ""}
                    totalCents={inv.totalCents}
                    requestedPackageName={pkgName}
                    packages={activePackages.map((p) => ({
                      id: p.id,
                      name: p.name,
                    }))}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <TableWrap>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Invoice</th>
              <th className={thClass}>Customer</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Amount</th>
              <th className={thClass}>Notes</th>
              <th className={thClass}>Date</th>
              <th className={thClass} />
            </tr>
          </thead>
          <tbody>
            {otherInvoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className={tdClass}>
                  <span className="font-mono text-xs">
                    {invoice.invoiceNumber}
                  </span>
                </td>
                <td className={tdClass}>{invoice.customer?.name ?? "—"}</td>
                <td className={tdClass}>
                  <Badge tone={statusTone[invoice.status] ?? "gray"}>
                    {invoice.status}
                  </Badge>
                </td>
                <td className={tdClass}>
                  {formatCurrency(invoice.totalCents)}
                </td>
                <td className={tdClass}>
                  <span className="block max-w-45 truncate text-xs text-stone-500">
                    {invoice.notes ?? "—"}
                  </span>
                </td>
                <td className={tdClass}>
                  <span className="text-xs text-stone-500">
                    {invoice.issueDate}
                  </span>
                </td>
                <td className={tdClass}>
                  {invoice.customer ? (
                    <a
                      href={whatsappLink(
                        invoice.customer.phone,
                        `Hi ${invoice.customer.name}, your Hercules Factory invoice ${invoice.invoiceNumber} is ${formatCurrency(invoice.totalCents)}.`,
                      )}
                      rel="noreferrer"
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                    >
                      <RiWhatsappLine className="size-3.5" />
                      Send
                    </a>
                  ) : null}
                </td>
              </tr>
            ))}
            {otherInvoices.length === 0 && (
              <tr>
                <td className={tdClass} colSpan={7}>
                  <span className="text-stone-400">No invoices yet.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
}
