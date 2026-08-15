"use client";

import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  Dumbbell,
  Receipt,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TableWrap, tableClass, tdClass, thClass } from "@/components/ui/table";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { PACKAGE_TYPE_LABEL, packageStatus, remaining } from "./admin-format";

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {["a", "b", "c", "d", "e", "f", "g", "h"].map((k) => (
          <div key={k} className="h-28 rounded-xl bg-stone-200" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {["i", "j", "k"].map((k) => (
          <div key={k} className="h-64 rounded-xl bg-stone-200" />
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading } = api.report.dashboard.useQuery();

  if (isLoading || !data) return <DashboardSkeleton />;

  const tiles = [
    {
      label: "Classes today",
      value: data.todayClasses,
      icon: Dumbbell,
    },
    { label: "PT today", value: data.todayPt, icon: Users },
    { label: "Trials today", value: data.todayTrials, icon: Sparkles },
    {
      label: "New customers today",
      value: data.newCustomers,
      icon: UserPlus,
    },
    {
      label: "Income today",
      value: formatCurrency(data.todayIncomeCents),
      icon: Banknote,
    },
    {
      label: "Income this month",
      value: formatCurrency(data.monthIncomeCents),
      icon: TrendingUp,
    },
    {
      label: "Expenses this month",
      value: formatCurrency(data.monthExpenseCents),
      icon: TrendingDown,
    },
    {
      label: "Net this month",
      value: formatCurrency(data.monthNetCents),
      icon: Wallet,
      accent: data.monthNetCents < 0,
    },
  ];

  return (
    <>
      <PageHeader eyebrow="Command center" title="Dashboard" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-stone-500">{tile.label}</p>
              <tile.icon className="size-5 shrink-0 text-red-700" />
            </div>
            <p
              className={`mt-5 text-3xl font-black tracking-tight ${
                tile.accent ? "text-red-700" : ""
              }`}
            >
              {tile.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-black">
            <AlertTriangle className="size-4 text-amber-500" />
            Expiring packages
          </h2>
          <TableWrap>
            <table className={`${tableClass} min-w-0`}>
              <thead>
                <tr>
                  <th className={thClass}>Customer</th>
                  <th className={thClass}>Package</th>
                  <th className={thClass}>Expiry</th>
                </tr>
              </thead>
              <tbody>
                {data.expiring.length === 0 ? (
                  <tr>
                    <td className={tdClass} colSpan={3}>
                      Nothing expiring soon.
                    </td>
                  </tr>
                ) : (
                  data.expiring.map((pkg) => {
                    const left = remaining(pkg);
                    return (
                      <tr key={pkg.id}>
                        <td className={tdClass}>
                          <Link
                            className="font-semibold text-red-700"
                            href={`/admin/customers/${pkg.customerId}`}
                          >
                            {pkg.customer?.name}
                          </Link>
                        </td>
                        <td className={tdClass}>
                          {PACKAGE_TYPE_LABEL[pkg.type]}
                          {left === null ? "" : ` · ${left} left`}
                        </td>
                        <td className={tdClass}>
                          <Badge
                            tone={
                              packageStatus(pkg) === "expired" ? "red" : "amber"
                            }
                          >
                            {pkg.expiryDate}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </TableWrap>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-black">
            <Receipt className="size-4 text-red-700" />
            Unpaid / outstanding
            <span className="text-sm font-semibold text-stone-500">
              {formatCurrency(data.unpaidTotalCents)}
            </span>
          </h2>
          <TableWrap>
            <table className={`${tableClass} min-w-0`}>
              <thead>
                <tr>
                  <th className={thClass}>Invoice</th>
                  <th className={thClass}>Customer</th>
                  <th className={thClass}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.unpaid.length === 0 ? (
                  <tr>
                    <td className={tdClass} colSpan={3}>
                      Everything is paid.
                    </td>
                  </tr>
                ) : (
                  data.unpaid.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className={tdClass}>
                        <Link
                          className="font-semibold text-red-700"
                          href="/admin/invoices"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className={tdClass}>{invoice.customer?.name}</td>
                      <td className={tdClass}>
                        {formatCurrency(invoice.totalCents)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableWrap>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-black">
            <CalendarClock className="size-4 text-red-700" />
            Upcoming Trial
          </h2>
          <TableWrap>
            <table className={`${tableClass} min-w-0`}>
              <thead>
                <tr>
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Time</th>
                  <th className={thClass}>Customer</th>
                </tr>
              </thead>
              <tbody>
                {data.upcomingTrials.length === 0 ? (
                  <tr>
                    <td className={tdClass} colSpan={3}>
                      No trials booked.
                    </td>
                  </tr>
                ) : (
                  data.upcomingTrials.map((session) => (
                    <tr key={session.id}>
                      <td className={tdClass}>{session.date}</td>
                      <td className={tdClass}>{session.startTime}</td>
                      <td className={tdClass}>
                        <Link
                          className="font-semibold text-red-700"
                          href="/admin/trials"
                        >
                          {session.attendees[0]?.customer?.name ?? "—"}
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableWrap>
        </section>
      </div>
    </>
  );
}
