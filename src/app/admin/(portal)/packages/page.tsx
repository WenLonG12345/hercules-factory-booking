"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/admin/admin-shell";
import { SellPackageDialog } from "@/components/admin/sell-package-dialog";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/form";
import { TableWrap, tableClass, tdClass, thClass } from "@/components/ui/table";
import { PACKAGE_TYPES } from "@/db/schema";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import {
  PACKAGE_TYPE_LABEL,
  packageStatus,
  remaining,
  STATUS_TONE,
} from "../admin-format";

export default function PackagesPage() {
  const utils = api.useUtils();
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");

  const { data: packages = [], isLoading } = api.package.list.useQuery();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 rounded bg-stone-200" />
        <div className="h-64 rounded-xl bg-stone-200" />
      </div>
    );
  }

  const rows = packages.filter(
    (pkg) =>
      (type === "all" || pkg.type === type) &&
      (status === "all" || packageStatus(pkg) === status),
  );

  return (
    <>
      <PageHeader eyebrow="Sales" title="Packages">
        <div className="flex flex-wrap items-center gap-2">
          <Select onChange={(e) => setType(e.target.value)} value={type}>
            <option value="all">All types</option>
            {PACKAGE_TYPES.map((value) => (
              <option key={value} value={value}>
                {PACKAGE_TYPE_LABEL[value]}
              </option>
            ))}
          </Select>
          <Select onChange={(e) => setStatus(e.target.value)} value={status}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring</option>
            <option value="expired">Expired</option>
          </Select>
          <SellPackageDialog
            onSuccess={() => utils.package.list.invalidate()}
          />
        </div>
      </PageHeader>

      <TableWrap>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Customer</th>
              <th className={thClass}>Type</th>
              <th className={thClass}>Start</th>
              <th className={thClass}>Expiry</th>
              <th className={thClass}>Credits</th>
              <th className={thClass}>Paid</th>
              <th className={thClass}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className={tdClass} colSpan={7}>
                  No packages match this filter.
                </td>
              </tr>
            ) : (
              rows.map((pkg) => {
                const left = remaining(pkg);
                const state = packageStatus(pkg);
                const used =
                  pkg.totalCredits === null
                    ? 0
                    : Math.min(100, (pkg.usedCredits / pkg.totalCredits) * 100);
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
                    <td className={tdClass}>{PACKAGE_TYPE_LABEL[pkg.type]}</td>
                    <td className={tdClass}>{pkg.startDate}</td>
                    <td className={tdClass}>{pkg.expiryDate}</td>
                    <td className={tdClass}>
                      {left === null ? (
                        "Unlimited"
                      ) : (
                        <div className="min-w-36">
                          <p className="font-semibold">
                            Total {pkg.totalCredits} · Used {pkg.usedCredits} ·
                            Remaining {left}
                          </p>
                          <div className="mt-1 h-1.5 w-full rounded-full bg-stone-200">
                            <div
                              className="h-1.5 rounded-full bg-red-700"
                              style={{ width: `${used}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className={tdClass}>
                      {formatCurrency(pkg.amountPaidCents)}
                    </td>
                    <td className={tdClass}>
                      <Badge tone={STATUS_TONE[state]}>{state}</Badge>
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
