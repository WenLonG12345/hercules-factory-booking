"use client";

import Link from "next/link";
import {
  debounce,
  parseAsIndex,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { PageHeader } from "@/components/admin/admin-shell";
import { CreateCustomerDialog } from "@/components/admin/create-customer-dialog";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { columnHelper, DataTable } from "@/components/ui/data-table";
import { Input, Select } from "@/components/ui/form";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { type Invoice, InvoiceActions } from "./invoice-actions";

const helper = columnHelper<Invoice>();

const STATUSES = ["all", "pending", "paid", "cancelled"] as const;

const statusTone = {
  paid: "green",
  pending: "amber",
  cancelled: "gray",
} as const;

export default function InvoicesPage() {
  const utils = api.useUtils();

  // Filters live in the URL, so a filtered list can be bookmarked and shared.
  const [{ q: search, status, page }, setFilters] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      status: parseAsStringLiteral(STATUSES).withDefault("all"),
      // 1-based in the URL, 0-based here — that is what parseAsIndex is for.
      page: parseAsIndex.withDefault(0),
    },
    { history: "replace" },
  );

  const { data: invoices = [], isLoading } = api.invoice.list.useQuery();

  const invalidate = () => {
    utils.invoice.list.invalidate();
    utils.customer.list.invalidate();
    utils.package.list.invalidate();
    utils.report.dashboard.invalidate();
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-32 rounded bg-stone-200" />
        <div className="h-64 rounded-xl bg-stone-200" />
      </div>
    );
  }

  const term = search.trim().toLowerCase();
  const rows = invoices.filter((invoice) => {
    if (status !== "all" && invoice.status !== status) return false;
    if (!term) return true;
    return (
      invoice.customer?.name.toLowerCase().includes(term) ||
      invoice.customer?.phone?.includes(term) ||
      invoice.invoiceNumber.toLowerCase().includes(term)
    );
  });

  const columns = helper.columns([
    helper.accessor("invoiceNumber", {
      header: "Number",
      cell: ({ row }) => (
        <Link
          className="font-semibold text-red-700"
          href={`/admin/invoices/${row.original.id}`}
        >
          {row.original.invoiceNumber}
        </Link>
      ),
    }),
    helper.accessor((row) => row.customer?.name, {
      id: "customer",
      header: "Customer",
      cell: ({ row }) =>
        row.original.customer ? (
          <>
            <Link
              className="font-semibold"
              href={`/admin/customers/${row.original.customer.id}`}
            >
              {row.original.customer.name}
            </Link>
            <p className="mt-0.5 text-xs text-stone-500">
              {row.original.customer.phone ?? "—"}
            </p>
          </>
        ) : (
          "—"
        ),
    }),
    helper.accessor("issueDate", { header: "Issued" }),
    helper.accessor("subtotalCents", {
      header: "Subtotal",
      cell: (info) => formatCurrency(info.getValue()),
    }),
    helper.accessor("discountCents", {
      header: "Discount",
      cell: (info) => formatCurrency(info.getValue()),
    }),
    helper.accessor("totalCents", {
      header: "Total",
      cell: (info) => formatCurrency(info.getValue()),
    }),
    helper.accessor("status", {
      header: "Status",
      cell: ({ row }) => (
        <Badge tone={statusTone[row.original.status]}>
          {row.original.status}
          {row.original.paidDate ? ` · ${row.original.paidDate}` : ""}
        </Badge>
      ),
    }),
    helper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <InvoiceActions invoice={row.original} onSuccess={invalidate} />
      ),
    }),
  ]);

  return (
    <>
      <PageHeader title="Invoices">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="w-56"
            onChange={(e) =>
              setFilters(
                { q: e.target.value || null, page: null },
                // The keystrokes land in state at once; the URL catches up.
                { limitUrlUpdates: debounce(300) },
              )
            }
            placeholder="Search name or phone"
            value={search}
          />
          <Select
            onChange={(e) =>
              setFilters({
                status: e.target.value as (typeof STATUSES)[number],
                page: null,
              })
            }
            value={status}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <CreateCustomerDialog onSuccess={invalidate} />
          <ButtonLink href="/admin/invoices/new">Create invoice</ButtonLink>
        </div>
      </PageHeader>

      <DataTable
        columns={columns}
        data={rows}
        defaultSort={{ id: "invoiceNumber", desc: true }}
        empty="No invoices found."
        getRowId={(invoice) => invoice.id}
        onPageChange={(next) => setFilters({ page: next })}
        pageIndex={page}
        pageSize={25}
        sortable
      />
    </>
  );
}
