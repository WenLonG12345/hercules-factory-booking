"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { TableWrap, tableClass, tdClass, thClass } from "@/components/ui/table";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";

const PACKAGE_TYPE_LABELS: Record<string, string> = {
  single: "Drop-in",
  ten_class: "10-Class",
  unlimited: "Unlimited",
};

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  tng: "Touch 'n Go",
  cash: "Cash",
  card: "Card",
  other: "Other",
};

function formatMonthLabel(ym: string) {
  return new Date(`${ym}-01`).toLocaleDateString("en-MY", {
    month: "long",
    year: "numeric",
  });
}

export default function ReportsPage() {
  const { data: report, isLoading } = api.report.revenueReport.useQuery();

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const months = useMemo(() => {
    const set = new Set(
      (report?.payments ?? []).map((p) => p.paidDate.slice(0, 7)),
    );
    return Array.from(set).sort().reverse();
  }, [report?.payments]);

  const filteredPayments = useMemo(
    () =>
      (report?.payments ?? []).filter((p) =>
        p.paidDate.startsWith(selectedMonth),
      ),
    [report?.payments, selectedMonth],
  );

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
                <span>
                  {PACKAGE_TYPE_LABELS[item.packageType] ?? item.packageType}
                </span>
                <strong>{formatCurrency(Number(item.totalCents ?? 0))}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-black">Payment history</h2>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
            {months.length === 0 && (
              <option value={currentMonth}>
                {formatMonthLabel(currentMonth)}
              </option>
            )}
          </select>
        </div>
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
              {filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td className={tdClass}>{payment.customer?.name}</td>
                  <td className={tdClass}>
                    {METHOD_LABELS[payment.method] ?? payment.method}
                  </td>
                  <td className={tdClass}>{payment.reference ?? "—"}</td>
                  <td className={tdClass}>
                    {formatCurrency(payment.amountCents)}
                  </td>
                  <td className={tdClass}>{payment.paidDate}</td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td className={tdClass} colSpan={5}>
                    <span className="text-stone-400">
                      No payments for {formatMonthLabel(selectedMonth)}.
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableWrap>
      </section>
    </>
  );
}
