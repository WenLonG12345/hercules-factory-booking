"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { TableWrap, tableClass, tdClass, thClass } from "@/components/ui/table";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import {
  centsToRinggit,
  currentMonth,
  downloadCsv,
  EXPENSE_CATEGORY_LABEL,
  PACKAGE_TYPE_LABEL,
} from "../admin-format";

export default function ReportsPage() {
  const [month, setMonth] = useState(currentMonth());
  const year = Number(month.slice(0, 4));

  const { data: monthly, isLoading } = api.report.monthly.useQuery({ month });
  const { data: annual } = api.report.annual.useQuery({ year });

  if (isLoading || !monthly) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 rounded bg-stone-200" />
        <div className="grid gap-4 md:grid-cols-3">
          {["a", "b", "c"].map((k) => (
            <div key={k} className="h-28 rounded-xl bg-stone-200" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-stone-200" />
      </div>
    );
  }

  const peak = Math.max(
    1,
    ...(annual?.months.map((row) => Math.abs(row.netCents)) ?? [1]),
  );

  return (
    <>
      <PageHeader eyebrow="Books" title="Reports">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            onChange={(e) => setMonth(e.target.value || currentMonth())}
            type="month"
            value={month}
          />
          <Button
            onClick={() =>
              downloadCsv(`hercules-${month}.csv`, [
                ["Section", "Label", "Amount (RM)"],
                ...monthly.incomeByType.map((row) => [
                  "Income",
                  row.type,
                  centsToRinggit(Number(row.totalCents)),
                ]),
                ...monthly.expenseByCategory.map((row) => [
                  "Expense",
                  EXPENSE_CATEGORY_LABEL[row.category],
                  centsToRinggit(Number(row.totalCents)),
                ]),
                ["Total", "Income", centsToRinggit(monthly.totalIncomeCents)],
                [
                  "Total",
                  "Expenses",
                  centsToRinggit(monthly.totalExpenseCents),
                ],
                ["Total", "Net profit", centsToRinggit(monthly.netCents)],
              ])
            }
            type="button"
            variant="quiet"
          >
            <Download className="size-4" />
            Month CSV
          </Button>
          <Button
            disabled={!annual}
            onClick={() =>
              annual &&
              downloadCsv(`hercules-${year}.csv`, [
                ["Month", "Income (RM)", "Expenses (RM)", "Net (RM)"],
                ...annual.months.map((row) => [
                  row.month,
                  centsToRinggit(row.incomeCents),
                  centsToRinggit(row.expenseCents),
                  centsToRinggit(row.netCents),
                ]),
                [
                  "Total",
                  centsToRinggit(annual.totalIncomeCents),
                  centsToRinggit(annual.totalExpenseCents),
                  centsToRinggit(annual.netCents),
                ],
              ])
            }
            type="button"
            variant="quiet"
          >
            <Download className="size-4" />
            {year} CSV
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Total Income", monthly.totalIncomeCents, "text-emerald-700"],
          ["Total Expenses", monthly.totalExpenseCents, "text-red-700"],
          [
            "Net Profit",
            monthly.netCents,
            monthly.netCents < 0 ? "text-red-700" : "text-stone-950",
          ],
        ].map(([label, value, tone]) => (
          <Card key={String(label)}>
            <p className="text-sm font-medium text-stone-500">{label}</p>
            <p className={`mt-4 text-3xl font-black tracking-tight ${tone}`}>
              {formatCurrency(Number(value))}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-medium text-stone-500">New customers</p>
          <p className="mt-3 text-2xl font-black">{monthly.newCustomers}</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-stone-500">Trials</p>
          <p className="mt-3 text-2xl font-black">{monthly.trialsTotal}</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-stone-500">Trial conversion</p>
          <p className="mt-3 text-2xl font-black">
            {monthly.trialsConverted}
            <span className="ml-2 text-base font-semibold text-stone-500">
              {monthly.trialsTotal
                ? Math.round(
                    (monthly.trialsConverted / monthly.trialsTotal) * 100,
                  )
                : 0}
              %
            </span>
          </p>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-xl font-black">Income by package</h2>
          <TableWrap>
            <table className={`${tableClass} min-w-0`}>
              <thead>
                <tr>
                  <th className={thClass}>Package</th>
                  <th className={thClass}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {monthly.incomeByType.length === 0 ? (
                  <tr>
                    <td className={tdClass} colSpan={2}>
                      No income this month.
                    </td>
                  </tr>
                ) : (
                  monthly.incomeByType.map((row) => (
                    <tr key={row.type}>
                      <td className={tdClass}>
                        {row.type in PACKAGE_TYPE_LABEL
                          ? PACKAGE_TYPE_LABEL[
                              row.type as keyof typeof PACKAGE_TYPE_LABEL
                            ]
                          : "Other"}
                      </td>
                      <td className={tdClass}>
                        {formatCurrency(Number(row.totalCents))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableWrap>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-black">Expenses by category</h2>
          <TableWrap>
            <table className={`${tableClass} min-w-0`}>
              <thead>
                <tr>
                  <th className={thClass}>Category</th>
                  <th className={thClass}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {monthly.expenseByCategory.length === 0 ? (
                  <tr>
                    <td className={tdClass} colSpan={2}>
                      No expenses this month.
                    </td>
                  </tr>
                ) : (
                  monthly.expenseByCategory.map((row) => (
                    <tr key={row.category}>
                      <td className={tdClass}>
                        {EXPENSE_CATEGORY_LABEL[row.category]}
                      </td>
                      <td className={tdClass}>
                        {formatCurrency(Number(row.totalCents))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableWrap>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-black">Coaches</h2>
        <TableWrap>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Coach</th>
                <th className={thClass}>Sessions taught</th>
                <th className={thClass}>Headcount</th>
                <th className={thClass}>Salary paid</th>
              </tr>
            </thead>
            <tbody>
              {monthly.perCoach.length === 0 ? (
                <tr>
                  <td className={tdClass} colSpan={4}>
                    No coaches yet.
                  </td>
                </tr>
              ) : (
                monthly.perCoach.map((row) => (
                  <tr key={row.coachId}>
                    <td className={tdClass}>{row.coachName}</td>
                    <td className={tdClass}>{row.sessionCount}</td>
                    <td className={tdClass}>{row.headcount}</td>
                    <td className={tdClass}>
                      {formatCurrency(row.salaryCents)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableWrap>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-black">{year} Annual Report</h2>
        <TableWrap>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Month</th>
                <th className={thClass}>Income</th>
                <th className={thClass}>Expenses</th>
                <th className={thClass}>Net profit</th>
                <th className={thClass}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {annual?.months.map((row) => (
                <tr key={row.month}>
                  <td className={tdClass}>{row.month}</td>
                  <td className={tdClass}>{formatCurrency(row.incomeCents)}</td>
                  <td className={tdClass}>
                    {formatCurrency(row.expenseCents)}
                  </td>
                  <td
                    className={`${tdClass} font-semibold ${
                      row.netCents < 0 ? "text-red-700" : ""
                    }`}
                  >
                    {formatCurrency(row.netCents)}
                  </td>
                  <td className={tdClass}>
                    <div className="h-2 w-full min-w-24 rounded-full bg-stone-100">
                      <div
                        className={`h-2 rounded-full ${
                          row.netCents < 0 ? "bg-red-600" : "bg-emerald-600"
                        }`}
                        style={{
                          width: `${(Math.abs(row.netCents) / peak) * 100}%`,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className={`${tdClass} font-black`}>Total</td>
                <td className={`${tdClass} font-black`}>
                  {formatCurrency(annual?.totalIncomeCents ?? 0)}
                </td>
                <td className={`${tdClass} font-black`}>
                  {formatCurrency(annual?.totalExpenseCents ?? 0)}
                </td>
                <td className={`${tdClass} font-black`} colSpan={2}>
                  {formatCurrency(annual?.netCents ?? 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </TableWrap>
      </section>
    </>
  );
}
