"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  Dumbbell,
  FileText,
  Receipt,
  Tags,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { columnHelper, DataTable } from "@/components/ui/data-table";
import { api, type RouterOutputs } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { PACKAGE_TYPE_LABEL, packageStatus, remaining } from "./admin-format";

type Dashboard = RouterOutputs["report"]["dashboard"];

const expiring = columnHelper<Dashboard["expiring"][number]>();
const unpaid = columnHelper<Dashboard["unpaid"][number]>();
const trial = columnHelper<Dashboard["upcomingTrials"][number]>();

const expiringColumns = expiring.columns([
  expiring.display({
    id: "customer",
    header: "Customer",
    cell: ({ row }) => (
      <Link
        className="font-semibold text-red-700"
        href={`/admin/customers/${row.original.customerId}`}
      >
        {row.original.customer?.name}
      </Link>
    ),
  }),
  expiring.display({
    id: "package",
    header: "Package",
    cell: ({ row }) => {
      const left = remaining(row.original);
      return `${PACKAGE_TYPE_LABEL[row.original.type]}${left === null ? "" : ` · ${left} left`}`;
    },
  }),
  expiring.display({
    id: "expiry",
    header: "Expiry",
    cell: ({ row }) => (
      <Badge tone={packageStatus(row.original) === "expired" ? "red" : "amber"}>
        {row.original.expiryDate}
      </Badge>
    ),
  }),
]);

const unpaidColumns = unpaid.columns([
  unpaid.display({
    id: "invoice",
    header: "Invoice",
    cell: ({ row }) => (
      <Link className="font-semibold text-red-700" href="/admin/invoices">
        {row.original.invoiceNumber}
      </Link>
    ),
  }),
  unpaid.display({
    id: "customer",
    header: "Customer",
    cell: ({ row }) => row.original.customer?.name,
  }),
  unpaid.display({
    id: "amount",
    header: "Amount",
    cell: ({ row }) => formatCurrency(row.original.totalCents),
  }),
]);

const trialColumns = trial.columns([
  trial.display({
    id: "date",
    header: "Date",
    cell: ({ row }) => row.original.date,
  }),
  trial.display({
    id: "time",
    header: "Time",
    cell: ({ row }) => row.original.startTime,
  }),
  trial.display({
    id: "customer",
    header: "Customer",
    cell: ({ row }) => (
      <Link
        className="font-semibold text-red-700"
        href={`/admin/schedule/${row.original.id}`}
      >
        {row.original.attendees[0]?.customer?.name ?? "—"}
      </Link>
    ),
  }),
]);

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {["a", "b", "c", "d", "e", "f", "g", "h", "i"].map((k) => (
          <div key={k} className="h-24 rounded-lg bg-stone-200" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {["j", "k", "l"].map((k) => (
          <div key={k} className="h-64 rounded-lg bg-stone-200" />
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading } = api.report.dashboard.useQuery();

  if (isLoading || !data) return <DashboardSkeleton />;

  const todaySessions = data.todayClasses + data.todayPt + data.todayTrials;

  /**
   * One tile per sidebar destination, in sidebar order — the tile is the
   * shortcut to that page, and its number is the thing the admin would open
   * the page to check.
   */
  const tiles = [
    {
      href: "/admin/onboard",
      label: "New signup",
      icon: UserPlus,
      value: data.newCustomers,
      hint: `${data.monthNewCustomers} joined this month`,
    },
    {
      href: "/admin/schedule",
      label: "Schedule",
      icon: CalendarDays,
      value: todaySessions,
      hint: `${data.todayClasses} class · ${data.todayPt} PT · ${data.todayTrials} trial`,
    },
    {
      href: "/admin/invoices",
      label: "Customers",
      icon: Users,
      value: data.totalCustomers,
      hint: `${data.newCustomers} new today`,
    },
    {
      href: "/admin/packages",
      label: "Packages",
      icon: Tags,
      value: data.activePackages,
      hint:
        data.expiring.length > 0
          ? `${data.expiring.length} expiring or nearly out`
          : "Nothing expiring soon",
      accent: data.expiring.length > 0,
    },
    {
      href: "/admin/invoices",
      label: "Invoices",
      icon: FileText,
      value: formatCurrency(data.unpaidTotalCents),
      hint: `${data.unpaid.length} unpaid invoice${data.unpaid.length === 1 ? "" : "s"}`,
      accent: data.unpaid.length > 0,
    },
    {
      href: "/admin/daily-income",
      label: "Daily Income",
      icon: Wallet,
      value: formatCurrency(data.todayIncomeCents),
      hint: `${formatCurrency(data.todayExpenseCents)} spent today`,
    },
    {
      href: "/admin/coaches",
      label: "Coaches",
      icon: Dumbbell,
      value: data.activeCoaches,
      hint: "Active on the roster",
    },
    {
      href: "/admin/reports",
      label: "Reports",
      icon: TrendingUp,
      value: formatCurrency(data.monthNetCents),
      hint: `${formatCurrency(data.monthIncomeCents)} in · ${formatCurrency(data.monthExpenseCents)} out`,
      accent: data.monthNetCents < 0,
    },
    {
      href: "/admin/cms",
      label: "CMS",
      icon: WalletCards,
      value: data.pendingSubmissions,
      hint:
        data.pendingSubmissions > 0
          ? "Photo submissions to review"
          : "Landing page is up to date",
      accent: data.pendingSubmissions > 0,
    },
  ];

  return (
    <>
      <PageHeader eyebrow="Command center" title="Dashboard" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={tile.href} className="group block" href={tile.href}>
            <Card className="h-full p-4 transition group-hover:border-red-200 group-hover:shadow-md">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  <tile.icon className="size-3.5 shrink-0 text-red-700" />
                  {tile.label}
                </p>
                <ArrowUpRight className="size-3.5 shrink-0 text-red-700 opacity-0 transition group-hover:opacity-100" />
              </div>
              <p
                className={`mt-2 text-2xl font-black leading-tight tracking-tight ${
                  tile.accent ? "text-red-700" : ""
                }`}
              >
                {tile.value}
              </p>
              <p className="mt-0.5 truncate text-xs font-medium text-stone-500">
                {tile.hint}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-black">
            <AlertTriangle className="size-4 text-amber-500" />
            <Link className="hover:text-red-700" href="/admin/packages">
              Expiring packages
            </Link>
          </h2>
          <DataTable
            columns={expiringColumns}
            data={data.expiring}
            dense
            empty="Nothing expiring soon."
            getRowId={(pkg) => pkg.id}
          />
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-black">
            <Receipt className="size-4 text-red-700" />
            <Link className="hover:text-red-700" href="/admin/invoices">
              Unpaid / outstanding
            </Link>
            <span className="text-sm font-semibold text-stone-500">
              {formatCurrency(data.unpaidTotalCents)}
            </span>
          </h2>
          <DataTable
            columns={unpaidColumns}
            data={data.unpaid}
            dense
            empty="Everything is paid."
            getRowId={(invoice) => invoice.id}
          />
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-black">
            <CalendarClock className="size-4 text-red-700" />
            <Link className="hover:text-red-700" href="/admin/schedule">
              Upcoming Trial
            </Link>
          </h2>
          <DataTable
            columns={trialColumns}
            data={data.upcomingTrials}
            dense
            empty="No trials booked."
            getRowId={(session) => session.id}
          />
        </section>
      </div>
    </>
  );
}
