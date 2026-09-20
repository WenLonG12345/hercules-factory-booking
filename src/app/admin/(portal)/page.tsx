"use client";

/* Hallmark · genre: modern-minimal · macrostructure: Day Sheet (Stat-Led, app
 * family) · theme: admin system (stone · white cards · red-700) · nav: rail
 * (AdminShell) · enrichment: none · designed-as-app · tablet-first
 * pre-emit critique: P4 H5 E4 S4 R5 V4 */

import {
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  FileText,
  Package,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { PACKAGE_TYPE_LABEL, packageStatus, remaining } from "./admin-format";

const longDate = new Intl.DateTimeFormat("en-MY", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** A finger-sized list row: 56px tall, whole row is the tap target. */
function Row({
  href,
  title,
  meta,
  right,
}: {
  href?: string;
  title: ReactNode;
  meta?: ReactNode;
  right?: ReactNode;
}) {
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-stone-950">
          {title}
        </span>
        {meta ? (
          <span className="block truncate text-xs text-stone-500">{meta}</span>
        ) : null}
      </span>
      {right}
      {href ? (
        <ChevronRight className="size-4 shrink-0 text-stone-400" />
      ) : null}
    </>
  );
  const className =
    "flex min-h-14 items-center gap-3 border-b border-stone-100 px-4 py-2 last:border-b-0";
  return href ? (
    <Link className={`${className} active:bg-stone-50`} href={href}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function ListCard({
  icon,
  title,
  count,
  empty,
  children,
}: {
  icon: ReactNode;
  title: string;
  count: number;
  empty: string;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <h2 className="flex items-center gap-2 border-b border-stone-200 px-4 py-3 text-base font-black">
        {icon}
        {title}
        <span className="ml-auto text-sm font-semibold text-stone-500">
          {count}
        </span>
      </h2>
      {count === 0 ? (
        <p className="px-4 py-6 text-sm text-stone-500">{empty}</p>
      ) : (
        children
      )}
    </Card>
  );
}

function MoneyCard({
  label,
  incomeCents,
  expenseCents,
}: {
  label: string;
  incomeCents: number;
  expenseCents: number;
}) {
  return (
    <Link className="block" href="/admin/daily-income">
      <Card className="h-full p-5 active:bg-stone-50">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          {label}
        </p>
        <p className="mt-1 text-4xl font-black leading-none tracking-tight">
          {formatCurrency(incomeCents)}
        </p>
        <p className="mt-2 text-sm text-stone-500">
          Spent {formatCurrency(expenseCents)} · Net{" "}
          <span className="font-semibold text-stone-950">
            {formatCurrency(incomeCents - expenseCents)}
          </span>
        </p>
      </Card>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-40 rounded bg-stone-200" />
      <div className="grid gap-3 md:grid-cols-2">
        {["a", "b"].map((k) => (
          <div key={k} className="h-28 rounded-lg bg-stone-200" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {["c", "d", "e", "f"].map((k) => (
          <div key={k} className="h-24 rounded-lg bg-stone-200" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {["g", "h"].map((k) => (
          <div key={k} className="h-72 rounded-lg bg-stone-200" />
        ))}
      </div>
    </div>
  );
}

const MAX_ROWS = 8;

export default function AdminDashboardPage() {
  const { data, isLoading } = api.report.dashboard.useQuery();

  if (isLoading || !data) return <DashboardSkeleton />;

  const tiles = [
    {
      href: "/admin/invoices",
      label: "Customers",
      icon: Users,
      value: data.totalCustomers,
      hint: `${data.newCustomers} new today · ${data.monthNewCustomers} this month`,
    },
    {
      href: "/admin/invoices?status=pending",
      label: "Unpaid",
      icon: FileText,
      value: formatCurrency(data.unpaidTotalCents),
      hint: `${data.unpaid.length} invoice${data.unpaid.length === 1 ? "" : "s"}`,
      accent: data.unpaid.length > 0,
    },
    {
      href: "/admin/invoices",
      label: "Active packages",
      icon: Package,
      value: data.activePackages,
      hint: `${data.expiring.length} expiring soon`,
      accent: data.expiring.length > 0,
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

  const actionCount = data.unpaid.length + data.expiring.length;
  const unpaidRows = data.unpaid.slice(0, MAX_ROWS);
  const expiringRows = data.expiring.slice(0, MAX_ROWS);
  const hidden = actionCount - unpaidRows.length - expiringRows.length;

  return (
    <>
      <PageHeader eyebrow={longDate.format(new Date())} title="Dashboard" />

      <div className="grid gap-3 md:grid-cols-2">
        <MoneyCard
          expenseCents={data.todayExpenseCents}
          incomeCents={data.todayIncomeCents}
          label="Today"
        />
        <MoneyCard
          expenseCents={data.monthExpenseCents}
          incomeCents={data.monthIncomeCents}
          label="This month"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link key={tile.label} className="block" href={tile.href}>
            <Card className="h-full p-4 active:bg-stone-50">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
                <tile.icon className="size-4 shrink-0 text-red-700" />
                {tile.label}
              </p>
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

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ListCard
          count={actionCount}
          empty="Nothing waiting — every invoice is paid, no package is running out."
          icon={<AlertTriangle className="size-4 text-amber-500" />}
          title="Needs action"
        >
          {unpaidRows.map((invoice) => (
            <Row
              href={`/admin/invoices/${invoice.id}`}
              key={invoice.id}
              meta={`${invoice.invoiceNumber} · issued ${invoice.issueDate}`}
              right={
                <Badge tone="amber">{formatCurrency(invoice.totalCents)}</Badge>
              }
              title={invoice.customer?.name ?? "—"}
            />
          ))}
          {expiringRows.map((pkg) => {
            const left = remaining(pkg);
            return (
              <Row
                href={`/admin/customers/${pkg.customerId}`}
                key={pkg.id}
                meta={`${PACKAGE_TYPE_LABEL[pkg.type]}${left === null ? "" : ` · ${left} left`}`}
                right={
                  <Badge
                    tone={packageStatus(pkg) === "expired" ? "red" : "amber"}
                  >
                    {pkg.expiryDate ?? "No expiry"}
                  </Badge>
                }
                title={pkg.customer?.name ?? "—"}
              />
            );
          })}
          {hidden > 0 ? (
            <p className="px-4 py-3 text-xs text-stone-500">
              {hidden} more not shown.
            </p>
          ) : null}
        </ListCard>

        <ListCard
          count={data.upcomingTrials.length}
          empty="No trials booked."
          icon={<CalendarClock className="size-4 text-red-700" />}
          title="Upcoming trials"
        >
          {data.upcomingTrials.map((session) => {
            const customer = session.attendees[0]?.customer;
            return (
              <Row
                href={customer ? `/admin/customers/${customer.id}` : undefined}
                key={session.id}
                meta={`${session.date} · ${session.startTime}`}
                title={customer?.name ?? "—"}
              />
            );
          })}
        </ListCard>
      </div>
    </>
  );
}
