"use client";

import { PageHeader } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { TableWrap, tableClass, tdClass, thClass } from "@/components/ui/table";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";

export default function ReportsPage() {
  const { data: report, isLoading } = api.report.revenueReport.useQuery();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-stone-200" />
        <div className="grid gap-4 md:grid-cols-3">
          {["a", "b", "c"].map((k) => (
            <div key={k} className="h-28 rounded-xl bg-stone-200" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-stone-200" />
      </div>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Finance" title="Revenue reports" />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-medium text-stone-500">Daily revenue</p>
          <p className="mt-4 text-3xl font-black">
            {formatCurrency(report?.dailyRevenueCents ?? 0)}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-stone-500">Monthly revenue</p>
          <p className="mt-4 text-3xl font-black">
            {formatCurrency(report?.monthlyRevenueCents ?? 0)}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-stone-500">Package mix</p>
          <div className="mt-4 grid gap-2 text-sm">
            {report?.byPackage.map((item) => (
              <div className="flex justify-between" key={item.packageType}>
                <span>{item.packageType}</span>
                <strong>{formatCurrency(Number(item.totalCents ?? 0))}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <section className="mt-8">
        <h2 className="mb-4 text-xl font-black">Payment history</h2>
        <TableWrap>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Customer</th>
                <th className={thClass}>Method</th>
                <th className={thClass}>Reference</th>
                <th className={thClass}>Amount</th>
                <th className={thClass}>Paid date</th>
              </tr>
            </thead>
            <tbody>
              {report?.payments.map((payment) => (
                <tr key={payment.id}>
                  <td className={tdClass}>{payment.customer?.name}</td>
                  <td className={tdClass}>{payment.method}</td>
                  <td className={tdClass}>{payment.reference}</td>
                  <td className={tdClass}>
                    {formatCurrency(payment.amountCents)}
                  </td>
                  <td className={tdClass}>{payment.paidDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </section>
    </>
  );
}
