"use client";

import { use } from "react";
import { PageHeader } from "@/components/admin/admin-shell";
import { SellPackageDialog } from "@/components/admin/sell-package-dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TableWrap, tableClass, tdClass, thClass } from "@/components/ui/table";
import { api } from "@/lib/trpc";
import { formatCurrency, whatsappLink } from "@/lib/utils";
import {
  PACKAGE_TYPE_LABEL,
  packageStatus,
  remaining,
  SOURCE_LABEL,
  STATUS_TONE,
} from "../../admin-format";

export default function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const utils = api.useUtils();
  const { data, isLoading } = api.customer.profile.useQuery({ id });

  if (isLoading || !data?.customer) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-52 rounded bg-stone-200" />
        <div className="h-40 rounded-xl bg-stone-200" />
        <div className="h-64 rounded-xl bg-stone-200" />
      </div>
    );
  }

  const { customer, packages, invoices, history } = data;

  return (
    <>
      <PageHeader eyebrow="Customer" title={customer.name}>
        <div className="flex flex-wrap gap-2">
          <a
            className="inline-flex h-11 items-center rounded-md border border-stone-200 bg-white px-4 text-sm font-semibold text-emerald-700"
            href={whatsappLink(
              customer.phone,
              `Hi ${customer.name}, this is Hercules Factory 👊`,
            )}
            rel="noreferrer"
            target="_blank"
          >
            WhatsApp
          </a>
          <SellPackageDialog
            customerId={customer.id}
            customerName={customer.name}
            onSuccess={() => utils.customer.profile.invalidate({ id })}
          />
        </div>
      </PageHeader>

      <Card>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Phone", customer.phone],
            ["Age", customer.age ?? "—"],
            ["Gender", customer.gender ?? "—"],
            ["Emergency contact", customer.emergencyContact ?? "—"],
            ["Date joined", customer.dateJoined],
            ["Source", customer.source ? SOURCE_LABEL[customer.source] : "—"],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                {label}
              </dt>
              <dd className="mt-1 font-semibold text-stone-900">{value}</dd>
            </div>
          ))}
        </dl>
        {customer.notes ? (
          <p className="mt-4 border-t border-stone-100 pt-4 text-sm text-stone-600">
            {customer.notes}
          </p>
        ) : null}
      </Card>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-black">Packages</h2>
        <TableWrap>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Type</th>
                <th className={thClass}>Start</th>
                <th className={thClass}>Expiry</th>
                <th className={thClass}>Credits</th>
                <th className={thClass}>Paid</th>
                <th className={thClass}>Status</th>
              </tr>
            </thead>
            <tbody>
              {packages.length === 0 ? (
                <tr>
                  <td className={tdClass} colSpan={6}>
                    No packages yet.
                  </td>
                </tr>
              ) : (
                packages.map((pkg) => {
                  const left = remaining(pkg);
                  const status = packageStatus(pkg);
                  return (
                    <tr key={pkg.id}>
                      <td className={tdClass}>
                        {PACKAGE_TYPE_LABEL[pkg.type]}
                      </td>
                      <td className={tdClass}>{pkg.startDate}</td>
                      <td className={tdClass}>{pkg.expiryDate}</td>
                      <td className={tdClass}>
                        {left === null
                          ? "Unlimited"
                          : `Total ${pkg.totalCredits} · Used ${pkg.usedCredits} · Remaining ${left}`}
                      </td>
                      <td className={tdClass}>
                        {formatCurrency(pkg.amountPaidCents)}
                      </td>
                      <td className={tdClass}>
                        <Badge tone={STATUS_TONE[status]}>{status}</Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </TableWrap>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xl font-black">Invoices</h2>
          <TableWrap>
            <table className={`${tableClass} min-w-0`}>
              <thead>
                <tr>
                  <th className={thClass}>Number</th>
                  <th className={thClass}>Total</th>
                  <th className={thClass}>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td className={tdClass} colSpan={3}>
                      No invoices.
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className={tdClass}>{invoice.invoiceNumber}</td>
                      <td className={tdClass}>
                        {formatCurrency(invoice.totalCents)}
                      </td>
                      <td className={tdClass}>
                        <Badge
                          tone={invoice.status === "paid" ? "green" : "amber"}
                        >
                          {invoice.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableWrap>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-black">Attendance history</h2>
          <TableWrap>
            <table className={`${tableClass} min-w-0`}>
              <thead>
                <tr>
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Session</th>
                  <th className={thClass}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td className={tdClass} colSpan={3}>
                      No sessions yet.
                    </td>
                  </tr>
                ) : (
                  history.map((row) => (
                    <tr key={row.id}>
                      <td className={tdClass}>{row.session?.date}</td>
                      <td className={tdClass}>{row.session?.title}</td>
                      <td className={tdClass}>
                        <Badge
                          tone={
                            row.status === "attended"
                              ? "green"
                              : row.status === "no_show"
                                ? "red"
                                : "gray"
                          }
                        >
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableWrap>
        </div>
      </section>
    </>
  );
}
