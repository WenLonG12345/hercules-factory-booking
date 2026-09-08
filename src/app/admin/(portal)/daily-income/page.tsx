/* Hallmark · genre: modern-minimal · scope: app page (AdminShell owns nav)
 * fingerprint: toolbar rail → close band → dense ledger
 * direction encoding: colour rail + tint + signed amount (never colour alone)
 * palette: admin stone/red-700 (preserved) · emerald = money in · rose = money out
 * motion: row-tint hover, segmented slide — colour/opacity only
 * pre-emit critique: P4 H5 E4 S5 R5 V4
 */
"use client";

import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
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

/**
 * Money in is emerald, money out is rose — the same pair the close band and the
 * KPI figures use, so a row's colour means the same thing everywhere on the
 * page. Colour never carries the direction alone: every row also gets a left
 * rail and a signed amount.
 */
const DIRECTION = {
  income: {
    row: "border-l-4 border-l-emerald-600 bg-emerald-50/70 hover:bg-emerald-100/70",
    ink: "text-emerald-800",
    chip: "bg-emerald-100 text-emerald-900",
    sign: "+",
    label: "In",
  },
  expense: {
    row: "border-l-4 border-l-rose-600 bg-rose-50/70 hover:bg-rose-100/70",
    ink: "text-rose-800",
    chip: "bg-rose-100 text-rose-900",
    sign: "−",
    label: "Out",
  },
} as const;

const TABS = [
  { key: "daily", label: "Daily book" },
  { key: "summary", label: "Monthly summary" },
] as const;

export default function DailyIncomePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("daily");

  return (
    <>
      <PageHeader eyebrow="Daily book" title="Daily Income">
        <Segmented onChange={setTab} options={TABS} label="View" value={tab} />
      </PageHeader>

      {tab === "daily" ? <DailyTab /> : <SummaryTab />}
    </>
  );
}

/** One segmented control, used for the view tabs and the direction filter. */
function Segmented<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: readonly { key: T; label: string }[];
  value: T;
}) {
  return (
    <div
      aria-label={label}
      className="inline-flex gap-1 rounded-md bg-stone-100 p-1"
      role="tablist"
    >
      {options.map((option) => (
        <button
          aria-selected={value === option.key}
          className={cn(
            "rounded px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600",
            value === option.key
              ? "bg-white text-stone-950 shadow-sm"
              : "text-stone-500 hover:text-stone-900",
          )}
          key={option.key}
          onClick={() => onChange(option.key)}
          role="tab"
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const DIRECTION_FILTERS = [
  { key: "all", label: "All" },
  { key: "income", label: "In" },
  { key: "expense", label: "Out" },
] as const;

function DailyTab() {
  const utils = api.useUtils();
  const [month, setMonth] = useState(currentMonth());
  const [category, setCategory] = useState("all");
  const [direction, setDirection] =
    useState<(typeof DIRECTION_FILTERS)[number]["key"]>("all");
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data: entries = [], isLoading } = api.ledger.list.useQuery({ month });
  const { data: categories = [] } = api.ledger.categories.list.useQuery({
    includeArchived: true,
  });

  const remove = api.ledger.delete.useMutation({
    onSuccess: () => {
      toast.success("Entry deleted.");
      setConfirmId(null);
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const refresh = () => {
    utils.ledger.list.invalidate();
    utils.report.dashboard.invalidate();
    utils.report.monthly.invalidate();
    utils.report.annual.invalidate();
  };

  const needle = search.trim().toLowerCase();
  const rows = entries
    .filter(
      (row) =>
        (category === "all" || row.categoryId === category) &&
        (direction === "all" || row.direction === direction) &&
        (!needle ||
          [
            row.notes,
            row.vendor,
            row.customer?.name,
            row.coach?.name,
            row.category.name,
          ].some((field) => field?.toLowerCase().includes(needle))),
    )
    // The team reads their book oldest-first, the way the spreadsheet ran.
    .sort((a, b) => a.date.localeCompare(b.date));

  const incomeCents = sumBy(rows, "income");
  const expenseCents = sumBy(rows, "expense");

  // Repeated dates are dimmed rather than blanked — a day's first row reads as
  // a heading, the rest stay searchable and copyable.
  const firstOfDay = new Set(
    rows
      .filter((row, i) => row.date !== rows[i - 1]?.date)
      .map((row) => row.id),
  );

  const entry = columnHelper<Entry>();
  const columns = entry.columns([
    entry.display({
      id: "date",
      header: "Date",
      cell: ({ row }) => (
        <span
          className={cn(
            "tabular-nums",
            firstOfDay.has(row.original.id)
              ? "font-semibold text-stone-900"
              : "text-stone-400",
          )}
        >
          {row.original.date.slice(8)}{" "}
          {MONTH_NAMES[Number(row.original.date.slice(5, 7)) - 1]?.slice(0, 3)}
        </span>
      ),
    }),
    entry.display({
      id: "category",
      header: "Category",
      cell: ({ row }) => {
        const tone = DIRECTION[row.original.direction];
        return (
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide",
                tone.chip,
              )}
            >
              {tone.label}
            </span>
            <span className="font-medium text-stone-900">
              {row.original.category.name}
            </span>
          </span>
        );
      },
    }),
    entry.display({
      id: "notes",
      header: "Purpose / Notes",
      cell: ({ row }) => (
        <span className="flex flex-wrap items-center gap-2">
          {row.original.notes ??
            row.original.vendor ??
            row.original.customer?.name ??
            "—"}
          {row.original.invoiceId ? <Badge tone="gray">Invoice</Badge> : null}
          {row.original.coach ? (
            <Badge tone="gray">{row.original.coach.name}</Badge>
          ) : null}
        </span>
      ),
    }),
    entry.display({
      id: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const tone = DIRECTION[row.original.direction];
        return (
          <span
            className={cn(
              "block text-right font-semibold tabular-nums",
              tone.ink,
            )}
          >
            {tone.sign}
            {formatCurrency(row.original.amountCents)}
          </span>
        );
      },
    }),
    entry.display({
      id: "actions",
      header: "",
      cell: ({ row }) =>
        row.original.invoiceId ? (
          <span
            className="text-xs text-stone-400"
            title="Booked by a paid invoice — edit it there."
          >
            Locked
          </span>
        ) : confirmId === row.original.id ? (
          <span className="flex items-center gap-2 text-sm">
            <button
              className="font-semibold text-red-700 hover:underline disabled:opacity-50"
              disabled={remove.isPending}
              onClick={() => remove.mutate({ id: row.original.id })}
              type="button"
            >
              Confirm
            </button>
            <button
              className="text-stone-500 hover:text-stone-900"
              onClick={() => setConfirmId(null)}
              type="button"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            className="text-sm font-semibold text-stone-500 hover:text-red-700"
            onClick={() => setConfirmId(row.original.id)}
            type="button"
          >
            Delete
          </button>
        ),
    }),
  ]);

  return (
    <>
      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <MonthStepper onChange={setMonth} value={month} />
          <span className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <Input
              aria-label="Search entries"
              className="w-full pl-9"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes, member, category"
              type="search"
              value={search}
            />
          </span>
          <Segmented
            label="Direction"
            onChange={setDirection}
            options={DIRECTION_FILTERS}
            value={direction}
          />
          <Select
            aria-label="Category"
            onChange={(e) => setCategory(e.target.value)}
            value={category}
          >
            <option value="all">All categories</option>
            {categories.map((option) => (
              <option key={option.id} value={option.id}>
                {option.direction === "income" ? "In" : "Out"} · {option.name}
              </option>
            ))}
          </Select>
          <span className="ml-auto flex flex-wrap items-center gap-2">
            <CategoryManagerDialog
              categories={categories}
              onSuccess={refresh}
            />
            <Button
              onClick={() =>
                downloadCsv(`daily-income-${month}.csv`, [
                  ["Date", "Direction", "Category", "Amount", "Purpose/Notes"],
                  ...rows.map((row) => [
                    row.date,
                    row.direction === "income" ? "Income" : "Expense",
                    row.category.name,
                    centsToRinggit(row.amountCents),
                    row.notes ?? "",
                  ]),
                  ["Total", "Income", "", centsToRinggit(incomeCents), ""],
                  ["Total", "Expense", "", centsToRinggit(expenseCents), ""],
                  [
                    "Total",
                    "Net",
                    "",
                    centsToRinggit(incomeCents - expenseCents),
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
          </span>
        </div>
      </Card>

      {isLoading ? (
        <Skeleton />
      ) : (
        <>
          <CloseBand
            count={rows.length}
            expenseCents={expenseCents}
            incomeCents={incomeCents}
            label={monthLabel(month)}
          />

          <DataTable
            columns={columns}
            data={rows}
            empty={
              entries.length
                ? "No entries match these filters."
                : "Nothing recorded for this month yet."
            }
            footer={
              <TableRow>
                <TableCell className="font-black" colSpan={2}>
                  {monthLabel(month)} total
                </TableCell>
                <TableCell className="text-stone-500">
                  {rows.length} {rows.length === 1 ? "entry" : "entries"} · in{" "}
                  {formatCurrency(incomeCents)} · out{" "}
                  {formatCurrency(expenseCents)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right text-base font-black tabular-nums",
                    incomeCents - expenseCents < 0
                      ? "text-rose-800"
                      : "text-emerald-800",
                  )}
                >
                  {formatCurrency(incomeCents - expenseCents)}
                </TableCell>
                <TableCell />
              </TableRow>
            }
            getRowId={(row) => row.id}
            pageSize={60}
            rowClassName={(row) => DIRECTION[row.direction].row}
          />
        </>
      )}
    </>
  );
}

/** ‹ November 2025 › — a month at a time, which is how the book is read. */
function MonthStepper({
  onChange,
  value,
}: {
  onChange: (month: string) => void;
  value: string;
}) {
  const step = (delta: number) => {
    const [year, month] = value.split("-").map(Number);
    const at = new Date(Date.UTC(year, month - 1 + delta, 1));
    onChange(at.toISOString().slice(0, 7));
  };

  return (
    <span className="flex items-center gap-1">
      <StepButton label="Previous month" onClick={() => step(-1)}>
        <ChevronLeft className="size-4" />
      </StepButton>
      <Input
        aria-label="Month"
        className="w-40"
        onChange={(e) => onChange(e.target.value || currentMonth())}
        type="month"
        value={value}
      />
      <StepButton label="Next month" onClick={() => step(1)}>
        <ChevronRight className="size-4" />
      </StepButton>
    </span>
  );
}

function StepButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex size-11 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

/**
 * The month's answer in one band: what came in, what went out, what is left,
 * with a bar showing how much of the income the expenses ate.
 */
function CloseBand({
  count,
  expenseCents,
  incomeCents,
  label,
}: {
  count: number;
  expenseCents: number;
  incomeCents: number;
  label: string;
}) {
  const netCents = incomeCents - expenseCents;
  const spent =
    incomeCents > 0 ? Math.min(100, (expenseCents / incomeCents) * 100) : 0;

  return (
    <Card className="mb-4 p-0">
      <div className="grid gap-px bg-stone-200 sm:grid-cols-[1fr_1fr_1.2fr]">
        <Figure
          className="text-emerald-800"
          label={`Money in · ${label}`}
          value={incomeCents}
        />
        <Figure
          className="text-rose-800"
          label={`Money out · ${label}`}
          value={expenseCents}
        />
        <div className="bg-white p-5">
          <p className="text-sm font-medium text-stone-500">
            Net · {count} {count === 1 ? "entry" : "entries"}
          </p>
          <p
            className={cn(
              "mt-2 text-4xl font-black tracking-tight tabular-nums",
              netCents < 0 ? "text-rose-800" : "text-stone-950",
            )}
          >
            {formatCurrency(netCents)}
          </p>
          <div
            aria-hidden
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-200"
          >
            <div
              className="h-full bg-rose-500"
              style={{ width: `${spent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-stone-500">
            {incomeCents > 0
              ? `Expenses took ${Math.round(spent)}% of income`
              : "No income recorded this month"}
          </p>
        </div>
      </div>
    </Card>
  );
}

function Figure({
  className,
  label,
  value,
}: {
  className: string;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white p-5">
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <p
        className={cn(
          "mt-2 text-3xl font-black tracking-tight tabular-nums",
          className,
        )}
      >
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function SummaryTab() {
  const [year, setYear] = useState(Number(currentMonth().slice(0, 4)));
  const { data, isLoading } = api.report.annual.useQuery({ year });

  const summary = columnHelper<AnnualMonth>();
  const peak = Math.max(
    1,
    ...(data?.months.map((row) =>
      Math.max(row.incomeCents, row.expenseCents),
    ) ?? [1]),
  );

  const summaryColumns = summary.columns([
    summary.display({
      id: "month",
      header: "Month",
      cell: ({ row }) => (
        <span className="font-semibold text-stone-900">
          {MONTH_NAMES[Number(row.original.month.slice(5, 7)) - 1]}
        </span>
      ),
    }),
    summary.accessor("incomeCents", {
      header: "Money in",
      cell: (info) => (
        <span className="block text-right font-semibold tabular-nums text-emerald-800">
          {formatCurrency(info.getValue())}
        </span>
      ),
    }),
    summary.accessor("expenseCents", {
      header: "Money out",
      cell: (info) => (
        <span className="block text-right font-semibold tabular-nums text-rose-800">
          {formatCurrency(info.getValue())}
        </span>
      ),
    }),
    summary.accessor("netCents", {
      header: "Net",
      cell: (info) => (
        <span
          className={cn(
            "block text-right font-black tabular-nums",
            info.getValue() < 0 ? "text-rose-800" : "text-stone-950",
          )}
        >
          {formatCurrency(info.getValue())}
        </span>
      ),
    }),
    summary.display({
      id: "shape",
      header: "In vs out",
      cell: ({ row }) => (
        <span aria-hidden className="flex w-40 flex-col gap-1">
          <span className="h-1.5 rounded-full bg-stone-100">
            <span
              className="block h-full rounded-full bg-emerald-600"
              style={{ width: `${(row.original.incomeCents / peak) * 100}%` }}
            />
          </span>
          <span className="h-1.5 rounded-full bg-stone-100">
            <span
              className="block h-full rounded-full bg-rose-500"
              style={{ width: `${(row.original.expenseCents / peak) * 100}%` }}
            />
          </span>
        </span>
      ),
    }),
  ]);

  if (isLoading || !data) return <Skeleton />;

  return (
    <>
      <Card className="mb-4 flex flex-wrap items-center gap-2 p-3">
        <Select
          aria-label="Year"
          onChange={(e) => setYear(Number(e.target.value))}
          value={year}
        >
          {yearOptions().map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
        <Button
          className="ml-auto"
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
      </Card>

      <CloseBand
        count={
          data.months.filter((row) => row.incomeCents || row.expenseCents)
            .length
        }
        expenseCents={data.totalExpenseCents}
        incomeCents={data.totalIncomeCents}
        label={String(year)}
      />

      <DataTable
        columns={summaryColumns}
        data={data.months}
        empty="No entries for this year."
        footer={
          <TableRow>
            <TableCell className="font-black">{year} total</TableCell>
            <TableCell className="text-right font-black tabular-nums text-emerald-800">
              {formatCurrency(data.totalIncomeCents)}
            </TableCell>
            <TableCell className="text-right font-black tabular-nums text-rose-800">
              {formatCurrency(data.totalExpenseCents)}
            </TableCell>
            <TableCell
              className={cn(
                "text-right font-black tabular-nums",
                data.netCents < 0 ? "text-rose-800" : "text-stone-950",
              )}
            >
              {formatCurrency(data.netCents)}
            </TableCell>
            <TableCell />
          </TableRow>
        }
        getRowId={(row) => row.month}
      />
    </>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-28 rounded-lg bg-stone-200" />
      <div className="h-96 rounded-lg bg-stone-200" />
    </div>
  );
}

function monthLabel(month: string) {
  return `${MONTH_NAMES[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
}

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
