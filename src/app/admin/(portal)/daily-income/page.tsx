"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { columnHelper, DataTable } from "@/components/ui/data-table";
import { Input, Select } from "@/components/ui/form";
import { TableCell, TableRow } from "@/components/ui/table";
import { api, type RouterOutputs } from "@/lib/trpc";
import { cn, formatCurrency } from "@/lib/utils";
import { centsToRinggit, currentMonth, downloadCsv } from "../admin-format";
import { CategoryManagerDialog } from "./category-manager";
import { AddEntryDialog } from "./entry-dialog";

type Entry = RouterOutputs["ledger"]["list"][number];
type AnnualMonth = RouterOutputs["report"]["annual"]["months"][number];

const entry = columnHelper<Entry>();
const summary = columnHelper<AnnualMonth>();

const summaryColumns = summary.columns([
  summary.display({
    id: "year",
    header: "Year",
    cell: ({ row }) => (
      <span className="font-semibold">
        {row.index === 0 ? row.original.month.slice(0, 4) : ""}
      </span>
    ),
  }),
  summary.display({
    id: "month",
    header: "Month",
    cell: ({ row }) => MONTH_NAMES[Number(row.original.month.slice(5, 7)) - 1],
  }),
  summary.accessor("incomeCents", {
    header: "Income",
    cell: (info) => formatCurrency(info.getValue()),
  }),
  summary.accessor("expenseCents", {
    header: "Expense",
    cell: (info) => formatCurrency(info.getValue()),
  }),
  summary.accessor("netCents", {
    header: "Net",
    cell: (info) => (
      <span
        className={cn("font-semibold", info.getValue() < 0 && "text-red-700")}
      >
        {formatCurrency(info.getValue())}
      </span>
    ),
  }),
]);

const TABS = [
  { key: "daily", label: "Daily" },
  { key: "summary", label: "Monthly summary" },
] as const;

export default function DailyIncomePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("daily");

  return (
    <>
      <PageHeader eyebrow="Daily book" title="Daily Income">
        <div className="flex gap-1 rounded-md bg-stone-100 p-1">
          {TABS.map((item) => (
            <button
              key={item.key}
              className={cn(
                "rounded px-3 py-2 text-sm font-semibold transition",
                tab === item.key
                  ? "bg-white text-stone-950 shadow-sm"
                  : "text-stone-500 hover:text-stone-800",
              )}
              onClick={() => setTab(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </PageHeader>

      {tab === "daily" ? <DailyTab /> : <SummaryTab />}
    </>
  );
}

function DailyTab() {
  const utils = api.useUtils();
  const [month, setMonth] = useState(currentMonth());
  const [filter, setFilter] = useState("all");

  const { data: entries = [], isLoading } = api.ledger.list.useQuery({ month });
  const { data: categories = [] } = api.ledger.categories.list.useQuery({
    includeArchived: true,
  });

  const remove = api.ledger.delete.useMutation({
    onSuccess: () => {
      toast.success("Entry deleted.");
      utils.ledger.list.invalidate();
      utils.report.dashboard.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const refresh = () => {
    utils.ledger.list.invalidate();
    utils.report.dashboard.invalidate();
    utils.report.monthly.invalidate();
    utils.report.annual.invalidate();
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 rounded bg-stone-200" />
        <div className="h-64 rounded-xl bg-stone-200" />
      </div>
    );
  }

  const rows = entries
    .filter((entry) => filter === "all" || entry.categoryId === filter)
    // The team reads their book oldest-first, the way the spreadsheet ran.
    .sort((a, b) => a.date.localeCompare(b.date));

  const incomeCents = sumBy(rows, "income");
  const expenseCents = sumBy(rows, "expense");

  const columns = entry.columns([
    entry.accessor("date", { header: "Date" }),
    entry.display({
      id: "incomeCategory",
      header: "Income (Category)",
      cell: ({ row }) =>
        row.original.direction === "income"
          ? row.original.category.name
          : "\u2014",
    }),
    entry.display({
      id: "incomeAmount",
      header: "Income Amount",
      cell: ({ row }) => (
        <span className="font-semibold">
          {row.original.direction === "income"
            ? formatCurrency(row.original.amountCents)
            : "\u2014"}
        </span>
      ),
    }),
    entry.display({
      id: "expenseCategory",
      header: "Expense (Category)",
      cell: ({ row }) =>
        row.original.direction === "income"
          ? "\u2014"
          : row.original.category.name,
    }),
    entry.display({
      id: "expenseAmount",
      header: "Expense Amount",
      cell: ({ row }) => (
        <span className="font-semibold">
          {row.original.direction === "income"
            ? "\u2014"
            : formatCurrency(row.original.amountCents)}
        </span>
      ),
    }),
    entry.display({
      id: "notes",
      header: "Purpose / Notes",
      cell: ({ row }) => (
        <span className="flex flex-wrap items-center gap-2">
          {row.original.notes ??
            row.original.vendor ??
            row.original.customer?.name ??
            "\u2014"}
          {row.original.invoiceId ? <Badge tone="gray">Invoice</Badge> : null}
          {row.original.coach ? (
            <Badge tone="gray">{row.original.coach.name}</Badge>
          ) : null}
        </span>
      ),
    }),
    entry.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) =>
        row.original.invoiceId ? (
          <span className="text-sm text-stone-400">Locked</span>
        ) : (
          <button
            className="text-sm font-semibold text-red-700"
            onClick={() => remove.mutate({ id: row.original.id })}
            type="button"
          >
            Delete
          </button>
        ),
    }),
  ]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Input
          onChange={(e) => setMonth(e.target.value || currentMonth())}
          type="month"
          value={month}
        />
        <Select onChange={(e) => setFilter(e.target.value)} value={filter}>
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.direction === "income" ? "In" : "Out"} · {category.name}
            </option>
          ))}
        </Select>
        <CategoryManagerDialog categories={categories} onSuccess={refresh} />
        <Button
          onClick={() =>
            downloadCsv(`daily-income-${month}.csv`, [
              [
                "Date",
                "Income (Category)",
                "Income Amount",
                "Expense (Category)",
                "Expense Amount",
                "Purpose/Notes",
              ],
              ...rows.map((entry) => [
                entry.date,
                entry.direction === "income" ? entry.category.name : "",
                entry.direction === "income"
                  ? centsToRinggit(entry.amountCents)
                  : "",
                entry.direction === "expense" ? entry.category.name : "",
                entry.direction === "expense"
                  ? centsToRinggit(entry.amountCents)
                  : "",
                entry.notes ?? "",
              ]),
              [
                "Total",
                "",
                centsToRinggit(incomeCents),
                "",
                centsToRinggit(expenseCents),
                "",
              ],
            ])
          }
          type="button"
          variant="quiet"
        >
          <Download className="size-4" />
          CSV
        </Button>
        <AddEntryDialog categories={categories} onSuccess={refresh} />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {[
          ["Income", incomeCents, "text-emerald-700"],
          ["Expenses", expenseCents, "text-red-700"],
          [
            "Net",
            incomeCents - expenseCents,
            incomeCents - expenseCents < 0 ? "text-red-700" : "text-stone-950",
          ],
        ].map(([label, value, tone]) => (
          <Card key={String(label)}>
            <p className="text-sm font-medium text-stone-500">
              {label} · {month}
            </p>
            <p className={`mt-2 text-3xl font-black tracking-tight ${tone}`}>
              {formatCurrency(Number(value))}
            </p>
          </Card>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={rows}
        empty="Nothing recorded for this month."
        footer={
          <TableRow>
            <TableCell className="font-black" colSpan={2}>
              Total
            </TableCell>
            <TableCell className="font-black">
              {formatCurrency(incomeCents)}
            </TableCell>
            <TableCell />
            <TableCell className="font-black">
              {formatCurrency(expenseCents)}
            </TableCell>
            <TableCell className="font-black" colSpan={2}>
              Net {formatCurrency(incomeCents - expenseCents)}
            </TableCell>
          </TableRow>
        }
        getRowId={(row) => row.id}
        rowClassName={(row) =>
          row.direction === "income" ? "bg-amber-50/40" : "bg-emerald-50/40"
        }
      />
    </>
  );
}

function SummaryTab() {
  const [year, setYear] = useState(Number(currentMonth().slice(0, 4)));
  const { data, isLoading } = api.report.annual.useQuery({ year });

  if (isLoading || !data) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 rounded bg-stone-200" />
        <div className="h-96 rounded-xl bg-stone-200" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Select onChange={(e) => setYear(Number(e.target.value))} value={year}>
          {yearOptions().map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
        <Button
          onClick={() =>
            downloadCsv(`daily-income-summary-${year}.csv`, [
              ["Year", "Month", "Income", "Expense", "Net"],
              ...data.months.map((row) => [
                year,
                MONTH_NAMES[Number(row.month.slice(5, 7)) - 1],
                centsToRinggit(row.incomeCents),
                centsToRinggit(row.expenseCents),
                centsToRinggit(row.netCents),
              ]),
              [
                "",
                "Total",
                centsToRinggit(data.totalIncomeCents),
                centsToRinggit(data.totalExpenseCents),
                centsToRinggit(data.netCents),
              ],
            ])
          }
          type="button"
          variant="quiet"
        >
          <Download className="size-4" />
          CSV
        </Button>
      </div>

      <DataTable
        columns={summaryColumns}
        data={data.months}
        empty="No entries for this year."
        footer={
          <TableRow>
            <TableCell className="font-black" colSpan={2}>
              Total
            </TableCell>
            <TableCell className="font-black">
              {formatCurrency(data.totalIncomeCents)}
            </TableCell>
            <TableCell className="font-black">
              {formatCurrency(data.totalExpenseCents)}
            </TableCell>
            <TableCell className="font-black">
              {formatCurrency(data.netCents)}
            </TableCell>
          </TableRow>
        }
        getRowId={(row) => row.month}
      />
    </>
  );
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function yearOptions() {
  const now = Number(currentMonth().slice(0, 4));
  return [now + 1, now, now - 1, now - 2];
}

function sumBy(
  rows: { direction: string; amountCents: number }[],
  direction: string,
) {
  return rows
    .filter((row) => row.direction === direction)
    .reduce((sum, row) => sum + row.amountCents, 0);
}
