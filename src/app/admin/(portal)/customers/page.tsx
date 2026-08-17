"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { CheckInDialog } from "@/components/admin/check-in-dialog";
import { SellPackageDialog } from "@/components/admin/sell-package-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { TableWrap, tableClass, tdClass, thClass } from "@/components/ui/table";
import { CUSTOMER_SOURCES, GENDERS } from "@/db/schema";
import { api, type RouterOutputs } from "@/lib/trpc";
import { whatsappLink } from "@/lib/utils";
import {
  PACKAGE_TYPE_LABEL,
  packageStatus,
  remaining,
  SOURCE_LABEL,
  STATUS_TONE,
  today,
} from "../admin-format";

type Package = RouterOutputs["package"]["list"][number];

/** Fixed-height rows so a customer's packages line up across the columns. */
const stackClass =
  "grid justify-items-start gap-1.5 whitespace-nowrap [&>*]:flex [&>*]:h-6 [&>*]:items-center";

/**
 * The package a customer is actually on: the live one expiring soonest — the
 * same pick `activePackageFor` makes server-side when a credit is burnt. Falls
 * back to the most recent expired one so the row still says something useful.
 */
function currentPackage(list: Package[]) {
  const active = list
    .filter((pkg) => packageStatus(pkg) !== "expired")
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  return active[0] ?? list[0] ?? null;
}

export default function CustomersPage() {
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const { data: customers = [], isLoading } = api.customer.list.useQuery();
  const { data: packages = [] } = api.package.list.useQuery();

  const invalidate = () => {
    utils.customer.list.invalidate();
    utils.package.list.invalidate();
  };

  const createCustomer = api.customer.create.useMutation({
    onSuccess: () => {
      utils.customer.list.invalidate();
      setOpen(false);
      toast.success("Customer created.");
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 rounded bg-stone-200" />
        <div className="h-64 rounded-xl bg-stone-200" />
      </div>
    );
  }

  const byCustomer = new Map<string, Package[]>();
  for (const pkg of packages) {
    const list = byCustomer.get(pkg.customerId);
    if (list) list.push(pkg);
    else byCustomer.set(pkg.customerId, [pkg]);
  }

  const term = search.trim().toLowerCase();
  const rows = customers
    .map((customer) => {
      const list = byCustomer.get(customer.id) ?? [];
      return { customer, list, pkg: currentPackage(list) };
    })
    .filter(({ customer, pkg }) => {
      if (
        term &&
        !customer.name.toLowerCase().includes(term) &&
        !customer.phone.includes(term)
      ) {
        return false;
      }
      if (status === "all") return true;
      if (status === "none") return pkg === null;
      return pkg !== null && packageStatus(pkg) === status;
    });

  return (
    <>
      <PageHeader eyebrow="CRM" title="Customers & packages">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="w-56"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or phone"
            value={search}
          />
          <Select onChange={(e) => setStatus(e.target.value)} value={status}>
            <option value="all">All packages</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring</option>
            <option value="expired">Expired</option>
            <option value="none">No package</option>
          </Select>
          <SellPackageDialog onSuccess={invalidate} />
          <Dialog onOpenChange={setOpen} open={open}>
            <DialogTrigger asChild>
              <Button type="button" variant="quiet">
                Create customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create customer</DialogTitle>
                <DialogDescription>
                  Where they came from matters — the source feeds the monthly
                  report.
                </DialogDescription>
              </DialogHeader>
              <form
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const age = String(fd.get("age") ?? "");
                  createCustomer.mutate({
                    name: String(fd.get("name")),
                    phone: String(fd.get("phone")),
                    age: age ? Number(age) : undefined,
                    gender:
                      (String(fd.get("gender")) as
                        | (typeof GENDERS)[number]
                        | "") || undefined,
                    emergencyContact:
                      String(fd.get("emergencyContact") ?? "") || undefined,
                    dateJoined: String(fd.get("dateJoined")),
                    source:
                      (String(fd.get("source")) as
                        | (typeof CUSTOMER_SOURCES)[number]
                        | "") || undefined,
                    notes: String(fd.get("notes") ?? "") || undefined,
                  });
                }}
              >
                <Field label="Name">
                  <Input name="name" required />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="WhatsApp phone">
                    <Input name="phone" required />
                  </Field>
                  <Field label="Age">
                    <Input max={100} min={3} name="age" type="number" />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Gender">
                    <Select defaultValue="" name="gender">
                      <option value="">Not set</option>
                      {GENDERS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Date joined">
                    <Input
                      defaultValue={today()}
                      name="dateJoined"
                      required
                      type="date"
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Emergency contact">
                    <Input name="emergencyContact" />
                  </Field>
                  <Field label="Source">
                    <Select defaultValue="" name="source">
                      <option value="">Not set</option>
                      {CUSTOMER_SOURCES.map((value) => (
                        <option key={value} value={value}>
                          {SOURCE_LABEL[value]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label="Notes">
                  <Textarea name="notes" />
                </Field>
                <Button disabled={createCustomer.isPending} type="submit">
                  {createCustomer.isPending ? "Saving…" : "Create customer"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <TableWrap>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Name</th>
              <th className={thClass}>Phone</th>
              <th className={thClass}>Package</th>
              <th className={thClass}>Start</th>
              <th className={thClass}>Expiry</th>
              <th className={thClass}>Credits</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className={tdClass} colSpan={8}>
                  No customers found.
                </td>
              </tr>
            ) : (
              rows.map(({ customer, list, pkg }) => {
                const left = pkg ? remaining(pkg) : null;
                const state = pkg ? packageStatus(pkg) : null;
                return (
                  <tr key={customer.id}>
                    <td className={tdClass}>
                      <Link
                        className="font-semibold text-red-700"
                        href={`/admin/customers/${customer.id}`}
                      >
                        {customer.name}
                      </Link>
                      {customer.source ? (
                        <p className="mt-0.5 text-xs text-stone-500">
                          {SOURCE_LABEL[customer.source]}
                        </p>
                      ) : null}
                    </td>
                    <td className={tdClass}>{customer.phone}</td>
                    {/* One line per package, aligned across the next four
                        columns — newest first, same order as package.list. */}
                    <td className={tdClass}>
                      {list.length === 0 ? (
                        "—"
                      ) : (
                        <div className={stackClass}>
                          {list.map((row) => (
                            <span key={row.id}>
                              {PACKAGE_TYPE_LABEL[row.type]}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className={tdClass}>
                      <div className={stackClass}>
                        {list.map((row) => (
                          <span key={row.id}>{row.startDate}</span>
                        ))}
                      </div>
                    </td>
                    <td className={tdClass}>
                      <div className={stackClass}>
                        {list.map((row) => (
                          <span key={row.id}>{row.expiryDate}</span>
                        ))}
                      </div>
                    </td>
                    <td className={tdClass}>
                      <div className={stackClass}>
                        {list.map((row) => {
                          const rowLeft = remaining(row);
                          return (
                            <span key={row.id}>
                              {rowLeft === null
                                ? "Unlimited"
                                : `${rowLeft} of ${row.totalCredits} left`}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className={tdClass}>
                      {list.length === 0 ? (
                        <Badge tone="gray">no package</Badge>
                      ) : (
                        <div className={stackClass}>
                          {list.map((row) => {
                            const rowState = packageStatus(row);
                            return (
                              <Badge key={row.id} tone={STATUS_TONE[rowState]}>
                                {rowState}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap items-center gap-3">
                        {pkg && left !== null && state !== "expired" ? (
                          <CheckInDialog
                            onSuccess={invalidate}
                            pkg={{ ...pkg, customer }}
                          />
                        ) : null}
                        <SellPackageDialog
                          customerId={customer.id}
                          customerName={customer.name}
                          onSuccess={invalidate}
                          trigger={
                            <button
                              className="text-sm font-semibold text-stone-600"
                              type="button"
                            >
                              {pkg ? "Renew" : "Sell package"}
                            </button>
                          }
                        />
                        <a
                          className="text-sm font-semibold text-emerald-700"
                          href={whatsappLink(
                            customer.phone,
                            `Hi ${customer.name}, this is Hercules Factory 👊`,
                          )}
                          rel="noreferrer"
                          target="_blank"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
}
