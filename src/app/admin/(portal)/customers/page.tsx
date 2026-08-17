"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { BookTrialDialog } from "@/components/admin/book-trial-dialog";
import { CheckInDialog } from "@/components/admin/check-in-dialog";
import { SellPackageDialog } from "@/components/admin/sell-package-dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form";
import { TableWrap, tableClass, tdClass, thClass } from "@/components/ui/table";
import { api, type RouterOutputs } from "@/lib/trpc";
import { whatsappLink } from "@/lib/utils";
import {
  PACKAGE_TYPE_LABEL,
  packageStatus,
  remaining,
  SOURCE_LABEL,
  STATUS_TONE,
} from "../admin-format";
import { CreateCustomerDialog } from "./create-customer-dialog";

type Package = RouterOutputs["package"]["list"][number];
type Trial = RouterOutputs["trial"]["list"][number];

const TRIAL_TONE = {
  booked: "gray",
  attended: "green",
  no_show: "red",
  cancelled: "gray",
  converted: "amber",
} as const;

/** Fixed-height rows so a customer's packages line up across the columns. */
const stackClass =
  "grid justify-items-start gap-1.5 whitespace-nowrap [&>*]:flex [&>*]:h-6 [&>*]:items-center";

const linkClass = "text-sm font-semibold";

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
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [trialFilter, setTrialFilter] = useState("all");

  const { data: customers = [], isLoading } = api.customer.list.useQuery();
  const { data: packages = [] } = api.package.list.useQuery();
  const { data: trials = [] } = api.trial.list.useQuery();

  const invalidate = () => {
    utils.customer.list.invalidate();
    utils.package.list.invalidate();
    utils.trial.list.invalidate();
    utils.report.dashboard.invalidate();
  };

  const setAttendance = api.schedule.setAttendance.useMutation({
    onSuccess: () => {
      toast.success("Updated.");
      invalidate();
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

  // A trial seats exactly one customer, and `trial.list` comes back newest
  // first — so the first hit per customer is their latest trial.
  const trialFor = new Map<string, Trial>();
  for (const trial of trials) {
    const customerId = trial.attendees[0]?.customerId;
    if (customerId && !trialFor.has(customerId))
      trialFor.set(customerId, trial);
  }

  const total = trials.length;
  const converted = trials.filter((trial) =>
    trial.attendees.some((attendee) => attendee.status === "converted"),
  ).length;

  const term = search.trim().toLowerCase();
  const rows = customers
    .map((customer) => {
      const list = byCustomer.get(customer.id) ?? [];
      const trial = trialFor.get(customer.id) ?? null;
      return {
        customer,
        list,
        pkg: currentPackage(list),
        trial,
        attendee: trial?.attendees[0] ?? null,
      };
    })
    .filter(({ customer, pkg, attendee }) => {
      if (
        term &&
        !customer.name.toLowerCase().includes(term) &&
        !customer.phone.includes(term)
      ) {
        return false;
      }
      if (trialFilter === "none" && attendee) return false;
      if (
        trialFilter !== "all" &&
        trialFilter !== "none" &&
        attendee?.status !== trialFilter
      ) {
        return false;
      }
      if (status === "all") return true;
      if (status === "none") return pkg === null;
      return pkg !== null && packageStatus(pkg) === status;
    });

  return (
    <>
      <PageHeader eyebrow="CRM" title="Customers, trials & packages">
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
          <Select
            onChange={(e) => setTrialFilter(e.target.value)}
            value={trialFilter}
          >
            <option value="all">All trials</option>
            <option value="booked">Trial booked</option>
            <option value="attended">Trial attended</option>
            <option value="no_show">Trial no-show</option>
            <option value="converted">Trial converted</option>
            <option value="none">No trial</option>
          </Select>
          <SellPackageDialog onSuccess={invalidate} />
          <CreateCustomerDialog onSuccess={invalidate} />
        </div>
      </PageHeader>

      <Card className="mb-6">
        <p className="text-sm font-medium text-stone-500">Trial conversion</p>
        <p className="mt-2 text-3xl font-black tracking-tight">
          {converted} / {total}
          <span className="ml-2 text-base font-semibold text-stone-500">
            {total ? Math.round((converted / total) * 100) : 0}%
          </span>
        </p>
      </Card>

      <TableWrap>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Name</th>
              <th className={thClass}>Phone</th>
              <th className={thClass}>Trial</th>
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
                <td className={tdClass} colSpan={9}>
                  No customers found.
                </td>
              </tr>
            ) : (
              rows.map(({ customer, list, pkg, trial, attendee }) => {
                const left = pkg ? remaining(pkg) : null;
                const state = pkg ? packageStatus(pkg) : null;
                const openTrial = attendee && attendee.status !== "converted";
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
                    {/* The trial pipeline, one customer per row — a trial seats
                        exactly one person, so it folds into the CRM table. */}
                    <td className={tdClass}>
                      {trial && attendee ? (
                        <div className="grid justify-items-start gap-1 whitespace-nowrap">
                          <Badge tone={TRIAL_TONE[attendee.status]}>
                            {attendee.status}
                          </Badge>
                          <span className="text-xs text-stone-500">
                            {trial.date} {trial.startTime}
                            {trial.coach ? ` · ${trial.coach.name}` : ""}
                          </span>
                          {attendee.status === "booked" ? (
                            <div className="flex gap-2">
                              <button
                                className={`${linkClass} text-emerald-700`}
                                onClick={() =>
                                  setAttendance.mutate({
                                    attendeeId: attendee.id,
                                    status: "attended",
                                  })
                                }
                                type="button"
                              >
                                Attended
                              </button>
                              <button
                                className={`${linkClass} text-stone-500`}
                                onClick={() =>
                                  setAttendance.mutate({
                                    attendeeId: attendee.id,
                                    status: "no_show",
                                  })
                                }
                                type="button"
                              >
                                No show
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <BookTrialDialog
                          customerId={customer.id}
                          customerName={customer.name}
                          onSuccess={invalidate}
                          trigger={
                            <button
                              className={`${linkClass} text-stone-600`}
                              type="button"
                            >
                              Book trial
                            </button>
                          }
                        />
                      )}
                    </td>
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
                        {/* Selling off an open trial stamps the conversion on
                            that session — same call the pipeline used to make. */}
                        <SellPackageDialog
                          convertedFromSessionId={
                            openTrial ? trial?.id : undefined
                          }
                          customerId={customer.id}
                          customerName={customer.name}
                          onSuccess={invalidate}
                          trigger={
                            <button
                              className={`${linkClass} ${openTrial ? "text-red-700" : "text-stone-600"}`}
                              type="button"
                            >
                              {openTrial
                                ? "Convert"
                                : pkg
                                  ? "Renew"
                                  : "Sell package"}
                            </button>
                          }
                        />
                        <a
                          className={`${linkClass} text-emerald-700`}
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
