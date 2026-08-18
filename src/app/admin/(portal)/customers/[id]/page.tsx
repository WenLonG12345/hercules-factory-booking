"use client";

import { use } from "react";
import { PageHeader } from "@/components/admin/admin-shell";
import { SellPackageDialog } from "@/components/admin/sell-package-dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { columnHelper, DataTable } from "@/components/ui/data-table";
import { api, type RouterOutputs } from "@/lib/trpc";
import { formatCurrency, whatsappLink } from "@/lib/utils";
import {
  PACKAGE_TYPE_LABEL,
  packageStatus,
  remaining,
  SOURCE_LABEL,
  STATUS_TONE,
} from "../../admin-format";

type Profile = RouterOutputs["customer"]["profile"];

const pkg = columnHelper<Profile["packages"][number]>();
const invoice = columnHelper<Profile["invoices"][number]>();
const attendance = columnHelper<Profile["history"][number]>();

const packageColumns = pkg.columns([
  pkg.display({
    id: "type",
    header: "Type",
    cell: ({ row }) => PACKAGE_TYPE_LABEL[row.original.type],
  }),
  pkg.accessor("startDate", { header: "Start" }),
  pkg.accessor("expiryDate", { header: "Expiry" }),
  pkg.display({
    id: "credits",
    header: "Credits",
    cell: ({ row }) => {
      const left = remaining(row.original);
      return left === null
        ? "Unlimited"
        : `Total ${row.original.totalCredits} \u00b7 Used ${row.original.usedCredits} \u00b7 Remaining ${left}`;
    },
  }),
  pkg.accessor("amountPaidCents", {
    header: "Paid",
    cell: (info) => formatCurrency(info.getValue()),
  }),
  pkg.display({
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = packageStatus(row.original);
      return <Badge tone={STATUS_TONE[status]}>{status}</Badge>;
    },
  }),
]);

const invoiceColumns = invoice.columns([
  invoice.accessor("invoiceNumber", { header: "Number" }),
  invoice.accessor("totalCents", {
    header: "Total",
    cell: (info) => formatCurrency(info.getValue()),
  }),
  invoice.display({
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge tone={row.original.status === "paid" ? "green" : "amber"}>
        {row.original.status}
      </Badge>
    ),
  }),
]);

const historyColumns = attendance.columns([
  attendance.display({
    id: "date",
    header: "Date",
    cell: ({ row }) => row.original.session?.date,
  }),
  attendance.display({
    id: "session",
    header: "Session",
    cell: ({ row }) => row.original.session?.title,
  }),
  attendance.display({
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        tone={
          row.original.status === "attended"
            ? "green"
            : row.original.status === "no_show"
              ? "red"
              : "gray"
        }
      >
        {row.original.status}
      </Badge>
    ),
  }),
]);

export default function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const utils = api.useUtils();
  const { data, isLoading } = api.customer.profile.useQuery({ id });

  if (isLoading || !data?.customer) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-52 rounded bg-stone-200" />
        <div className="h-40 rounded-xl bg-stone-200" />
        <div className="h-64 rounded-xl bg-stone-200" />
      </div>
    );
  }

  const { customer, packages, invoices, history } = data;

  return (
    <>
      <PageHeader eyebrow="Customer" title={customer.name}>
        <div className="flex flex-wrap gap-2">
          <a
            className="inline-flex h-11 items-center rounded-md border border-stone-200 bg-white px-4 text-sm font-semibold text-emerald-700"
            href={whatsappLink(
              customer.phone,
              `Hi ${customer.name}, this is Hercules Factory 👊`,
            )}
            rel="noreferrer"
            target="_blank"
          >
            WhatsApp
          </a>
          <SellPackageDialog
            customerId={customer.id}
            customerName={customer.name}
            onSuccess={() => utils.customer.profile.invalidate({ id })}
          />
        </div>
      </PageHeader>

      <Card>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Phone", customer.phone],
            ["Age", customer.age ?? "—"],
            ["Gender", customer.gender ?? "—"],
            ["Emergency contact", customer.emergencyContact ?? "—"],
            ["Date joined", customer.dateJoined],
            ["Source", customer.source ? SOURCE_LABEL[customer.source] : "—"],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                {label}
              </dt>
              <dd className="mt-1 font-semibold text-stone-900">{value}</dd>
            </div>
          ))}
        </dl>
        {customer.notes ? (
          <p className="mt-4 border-t border-stone-100 pt-4 text-sm text-stone-600">
            {customer.notes}
          </p>
        ) : null}
      </Card>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-black">Packages</h2>
        <DataTable
          columns={packageColumns}
          data={packages}
          empty="No packages yet."
          getRowId={(row) => row.id}
          sortable
        />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xl font-black">Invoices</h2>
          <DataTable
            columns={invoiceColumns}
            data={invoices}
            dense
            empty="No invoices."
            getRowId={(row) => row.id}
          />
        </div>

        <div>
          <h2 className="mb-3 text-xl font-black">Attendance history</h2>
          <DataTable
            columns={historyColumns}
            data={history}
            dense
            empty="No sessions yet."
            getRowId={(row) => row.id}
          />
        </div>
      </section>
    </>
  );
}
