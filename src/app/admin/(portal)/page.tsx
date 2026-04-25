import { Banknote, CalendarCheck, Receipt, Users } from "lucide-react";
import { PageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TableWrap, tableClass, tdClass, thClass } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { getDashboardStats } from "@/server/services/queries";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();
  const cards = [
    { label: "Total customers", value: stats.totalCustomers, icon: Users },
    {
      label: "Active memberships",
      value: stats.activeMemberships,
      icon: Receipt,
    },
    {
      label: "Monthly revenue",
      value: formatCurrency(stats.monthlyRevenueCents),
      icon: Banknote,
    },
    {
      label: "Today's bookings",
      value: stats.todayBookings,
      icon: CalendarCheck,
    },
  ];

  return (
    <>
      <PageHeader eyebrow="Command center" title="Dashboard" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-stone-500">{card.label}</p>
              <card.icon className="size-5 text-red-700" />
            </div>
            <p className="mt-5 text-3xl font-black tracking-tight">
              {card.value}
            </p>
          </Card>
        ))}
      </div>
      <section className="mt-8">
        <h2 className="mb-4 text-xl font-black">Recent payments</h2>
        <TableWrap>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Customer</th>
                <th className={thClass}>Invoice</th>
                <th className={thClass}>Method</th>
                <th className={thClass}>Amount</th>
                <th className={thClass}>Paid date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentPayments.map((payment) => (
                <tr key={payment.id}>
                  <td className={tdClass}>{payment.customer?.name}</td>
                  <td className={tdClass}>{payment.invoice?.invoiceNumber}</td>
                  <td className={tdClass}>
                    <Badge tone="amber">{payment.method}</Badge>
                  </td>
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
