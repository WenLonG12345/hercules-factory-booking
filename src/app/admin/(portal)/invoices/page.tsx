"use client";

import Link from "next/link";
import {
  debounce,
  parseAsIndex,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { CreateCustomerDialog } from "@/components/admin/create-customer-dialog";
import { PlanSummary } from "@/components/admin/plan-summary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { columnHelper, DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { PACKAGE_TYPES } from "@/db/schema";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import {
  centsToRinggit,
  defaultExpiry,
  PACKAGE_TYPE_LABEL,
  ringgitToCents,
  shiftDays,
  today,
} from "../admin-format";
import { type Invoice, InvoiceActions } from "./invoice-actions";

const helper = columnHelper<Invoice>();

const STATUSES = ["all", "pending", "paid", "cancelled"] as const;

const statusTone = {
  paid: "green",
  pending: "amber",
  cancelled: "gray",
} as const;

/** What the customer picker shows and matches on — unique per customer. */
const customerLabel = (customer: {
  name: string;
  phone: string | null;
  ic: string | null;
}) => `${customer.name} — ${customer.phone ?? customer.ic ?? "—"}`;

/** Match on this, not the raw text: a tablet keyboard capitalises and trims
 *  as it pleases, and the typed label still has to find its customer. */
const labelKey = (label: string) =>
  label.trim().toLowerCase().replace(/\s+/g, " ");

export default function InvoicesPage() {
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [planId, setPlanId] = useState("");
  const [packageType, setPackageType] =
    useState<(typeof PACKAGE_TYPES)[number]>("credit");
  const [validFrom, setValidFrom] = useState(today());

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
  const { data: customers = [] } = api.customer.list.useQuery();
  const { data: plans = [] } = api.packagePlan.list.useQuery();

  const invalidate = () => {
    utils.invoice.list.invalidate();
    utils.customer.list.invalidate();
    utils.package.list.invalidate();
    utils.report.dashboard.invalidate();
  };

  const createInvoice = api.invoice.create.useMutation({
    onSuccess: () => {
      toast.success("Invoice created.");
      setOpen(false);
      setCustomerId("");
      setCustomerQuery("");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-32 rounded bg-stone-200" />
        <div className="h-64 rounded-xl bg-stone-200" />
      </div>
    );
  }

  const byLabel = new Map(
    customers.map((c) => [labelKey(customerLabel(c)), c.id]),
  );
  const plan = plans.find((item) => item.id === planId);
  const type = plan?.type ?? packageType;

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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button">Create invoice</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create invoice</DialogTitle>
                <DialogDescription>
                  Issuing an invoice sells the package it is for. Marking it
                  paid is what books the income — there is no separate entry.
                </DialogDescription>
              </DialogHeader>
              <form
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  if (!customerId) {
                    toast.error("Pick a customer from the list.");
                    return;
                  }
                  createInvoice.mutate({
                    customerId,
                    planId: planId || undefined,
                    packageType: type,
                    totalCredits:
                      type === "unlimited"
                        ? undefined
                        : plan
                          ? (plan.totalCredits ?? undefined)
                          : Number(fd.get("totalCredits")),
                    description:
                      String(fd.get("description") ?? "") || undefined,
                    subtotalCents: ringgitToCents(fd.get("subtotal")),
                    discountCents: ringgitToCents(fd.get("discount")),
                    issueDate: String(fd.get("issueDate")),
                    dueDate: String(fd.get("dueDate") ?? "") || undefined,
                    validFrom: String(fd.get("validFrom")),
                    validUntil: String(fd.get("validUntil")),
                    notes: String(fd.get("notes") ?? "") || undefined,
                  });
                }}
              >
                {/* 200+ customers is more than a dropdown can show — the
                    datalist filters as you type, for free and natively.
                    ponytail: swap in a shadcn combobox only if the admin ever
                    needs fuzzy matching or search on more than the label. */}
                <Field label="Customer">
                  <Input
                    autoCapitalize="off"
                    autoComplete="off"
                    autoCorrect="off"
                    list="invoice-customer-options"
                    onChange={(e) => {
                      setCustomerQuery(e.target.value);
                      setCustomerId(
                        byLabel.get(labelKey(e.target.value)) ?? "",
                      );
                    }}
                    placeholder="Type a name, phone or IC…"
                    required
                    spellCheck={false}
                    value={customerQuery}
                  />
                  <datalist id="invoice-customer-options">
                    {customers.map((customer) => (
                      <option key={customer.id} value={customerLabel(customer)}>
                        {customer.name}
                      </option>
                    ))}
                  </datalist>
                </Field>
                {/* Issuing the invoice sells the package — pick it off the
                    price list or set it by hand. */}
                <Field label="Plan">
                  <Select
                    onChange={(e) => {
                      setPlanId(e.target.value);
                      const next = plans.find(
                        (item) => item.id === e.target.value,
                      );
                      if (next) setPackageType(next.type);
                    }}
                    value={planId}
                  >
                    <option value="">Custom — set everything by hand</option>
                    {plans
                      .filter((item) => item.isActive)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} — {formatCurrency(item.priceCents)}
                          {item.totalCredits === null
                            ? ""
                            : ` · ${item.totalCredits} credits`}
                        </option>
                      ))}
                  </Select>
                </Field>
                {plan ? (
                  <PlanSummary plan={plan} />
                ) : (
                  <Field label="Package type">
                    <Select
                      name="packageType"
                      onChange={(e) =>
                        setPackageType(
                          e.target.value as (typeof PACKAGE_TYPES)[number],
                        )
                      }
                      value={packageType}
                    >
                      {PACKAGE_TYPES.map((value) => (
                        <option key={value} value={value}>
                          {PACKAGE_TYPE_LABEL[value]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
                {plan || type === "unlimited" ? null : (
                  <Field label={type === "pt" ? "PT sessions" : "Credits"}>
                    <Input
                      defaultValue={10}
                      key={type}
                      min={1}
                      name="totalCredits"
                      required
                      type="number"
                    />
                  </Field>
                )}
                <Field label="Description">
                  <Input name="description" placeholder="10 credit package" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Subtotal (RM)">
                    <Input
                      defaultValue={
                        plan ? centsToRinggit(plan.priceCents) : undefined
                      }
                      inputMode="decimal"
                      key={planId}
                      name="subtotal"
                      required
                    />
                  </Field>
                  <Field label="Discount (RM)">
                    <Input
                      defaultValue="0"
                      inputMode="decimal"
                      name="discount"
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Issue date">
                    <Input
                      defaultValue={today()}
                      name="issueDate"
                      required
                      type="date"
                    />
                  </Field>
                  <Field label="Due date">
                    <Input name="dueDate" type="date" />
                  </Field>
                </div>
                {/* The invoice's validity window is the package window. */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Package starts">
                    <Input
                      name="validFrom"
                      onChange={(e) => setValidFrom(e.target.value)}
                      required
                      type="date"
                      value={validFrom}
                    />
                  </Field>
                  <Field label="Package expires">
                    <Input
                      defaultValue={
                        plan
                          ? shiftDays(validFrom, plan.validityDays)
                          : defaultExpiry(validFrom, type)
                      }
                      key={`${validFrom}-${type}-${planId}`}
                      name="validUntil"
                      required
                      type="date"
                    />
                  </Field>
                </div>
                <Field label="Notes">
                  <Textarea name="notes" />
                </Field>
                <Button disabled={createInvoice.isPending} type="submit">
                  {createInvoice.isPending ? "Saving…" : "Create invoice"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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
