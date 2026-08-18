"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { columnHelper, DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/form";
import { TableCell, TableRow } from "@/components/ui/table";
import { api, type RouterOutputs } from "@/lib/trpc";
import { cn, formatCurrency } from "@/lib/utils";
import { centsToRinggit, currentMonth, downloadCsv } from "../admin-format";

type Monthly = RouterOutputs["report"]["monthly"];
type Annual = RouterOutputs["report"]["annual"];

const category = columnHelper<Monthly["incomeByCategory"][number]>();
const coach = columnHelper<Monthly["perCoach"][number]>();
const annualRow = columnHelper<Annual["months"][number]>();

const categoryColumns = category.columns([
  category.accessor("category", { header: "Category" }),
  category.accessor("totalCents", {
    header: "Amount",
    cell: (info) => formatCurrency(Number(info.getValue())),
  }),
]);

const coachColumns = coach.columns([
  coach.accessor("coachName", { header: "Coach" }),
  coach.accessor("sessionCount", { header: "Sessions taught" }),
  coach.accessor("headcount", { header: "Headcount" }),
  coach.accessor("salaryCents", {
    header: "Salary paid",
    cell: (info) => formatCurrency(info.getValue()),
  }),
]);

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

  const annualColumns = annualRow.columns([
    annualRow.accessor("month", { header: "Month" }),
    annualRow.accessor("incomeCents", {
      header: "Income",
      cell: (info) => formatCurrency(info.getValue()),
    }),
    annualRow.accessor("expenseCents", {
      header: "Expenses",
      cell: (info) => formatCurrency(info.getValue()),
    }),
    annualRow.accessor("netCents", {
      header: "Net profit",
      cell: (info) => (
        <span
          className={cn("font-semibold", info.getValue() < 0 && "text-red-700")}
        >
          {formatCurrency(info.getValue())}
        </span>
      ),
    }),
    annualRow.display({
      id: "trend",
      header: "Trend",
      cell: ({ row }) => (
        <div className="h-2 w-full min-w-24 rounded-full bg-stone-100">
          <div
            className={cn(
              "h-2 rounded-full",
              row.original.netCents < 0 ? "bg-red-600" : "bg-emerald-600",
            )}
            style={{
              width: `${(Math.abs(row.original.netCents) / peak) * 100}%`,
            }}
          />
        </div>
      ),
    }),
  ]);

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
                ...monthly.incomeByCategory.map((row) => [
                  "Income",
                  row.category,
                  centsToRinggit(Number(row.totalCents)),
                ]),
                ...monthly.expenseByCategory.map((row) => [
                  "Expense",
                  row.category,
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
          <h2 className="mb-3 text-xl font-black">Income by category</h2>
          <DataTable
            columns={categoryColumns}
            data={monthly.incomeByCategory}
            dense
            empty="No income this month."
            getRowId={(row) => row.categoryId}
          />
        </section>

        <section>
          <h2 className="mb-3 text-xl font-black">Expenses by category</h2>
          <DataTable
            columns={categoryColumns}
            data={monthly.expenseByCategory}
            dense
            empty="No expenses this month."
            getRowId={(row) => row.categoryId}
          />
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-black">Coaches</h2>
        <DataTable
          columns={coachColumns}
          data={monthly.perCoach}
          empty="No coaches yet."
          getRowId={(row) => row.coachId}
          sortable
        />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-black">{year} Annual Report</h2>
        <DataTable
          columns={annualColumns}
          data={annual?.months}
          empty="No entries for this year."
          footer={
            <TableRow>
              <TableCell className="font-black">Total</TableCell>
              <TableCell className="font-black">
                {formatCurrency(annual?.totalIncomeCents ?? 0)}
              </TableCell>
              <TableCell className="font-black">
                {formatCurrency(annual?.totalExpenseCents ?? 0)}
              </TableCell>
              <TableCell className="font-black" colSpan={2}>
                {formatCurrency(annual?.netCents ?? 0)}
              </TableCell>
            </TableRow>
          }
          getRowId={(row) => row.month}
        />
      </section>
    </>
  );
}
