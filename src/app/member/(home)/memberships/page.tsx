"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { formatDate } from "../member-format";

const BANK_NAME = process.env.NEXT_PUBLIC_PAYMENT_BANK_NAME ?? "";
const BANK_ACCOUNT = process.env.NEXT_PUBLIC_PAYMENT_BANK_ACCOUNT ?? "";
const ACCOUNT_NAME = process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME ?? "";
const TNG_NUMBER = process.env.NEXT_PUBLIC_PAYMENT_TNG_NUMBER ?? "";

export default function MembershipsPage() {
  const utils = api.useUtils();
  const [requestingPackageId, setRequestingPackageId] = useState<string | null>(
    null,
  );
  const [successData, setSuccessData] = useState<{
    invoiceNumber: string;
  } | null>(null);

  const { data: myMemberships = [], isLoading: membershipsLoading } =
    api.portal.myMemberships.useQuery();
  const { data: availablePackages = [], isLoading: packagesLoading } =
    api.portal.packages.useQuery();
  const requestMembership = api.portal.requestMembership.useMutation({
    onSuccess: (data) => {
      setSuccessData({ invoiceNumber: data.invoice.invoiceNumber });
      setRequestingPackageId(null);
      utils.portal.myMemberships.invalidate();
      utils.portal.myInvoices.invalidate();
    },
  });

  const isLoading = membershipsLoading || packagesLoading;

  const today = new Date().toISOString().split("T")[0];
  const activeMembership = myMemberships.find(
    (m) =>
      m.membership.status === "active" &&
      (m.membership.expiryDate === null || m.membership.expiryDate >= today),
  );

  if (isLoading) {
    return (
      <div className="animate-pulse grid gap-5">
        <div className="h-8 w-40 rounded bg-white/10" />
        <div className="h-24 rounded-xl bg-white/10" />
        <div className="h-32 rounded-xl bg-white/10" />
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-500">
          Membership
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-stone-50">
          Your membership
        </h1>
      </div>

      {/* Active membership */}
      {activeMembership ? (
        <Card className="p-4 border-green-500/30 bg-green-900/20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-400">
            Active
          </p>
          <p className="mt-1 font-bold text-stone-100">
            {activeMembership.package.name}
          </p>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-stone-300">
            {activeMembership.membership.expiryDate && (
              <span>
                Expires {formatDate(activeMembership.membership.expiryDate)}
              </span>
            )}
            {activeMembership.membership.remainingCredits !== null && (
              <span className="font-semibold text-amber-300">
                {activeMembership.membership.remainingCredits} classes remaining
              </span>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-4 border-white/10 bg-white/4">
          <p className="text-sm text-stone-400">No active membership.</p>
        </Card>
      )}

      {/* History */}
      {myMemberships.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold text-stone-300">History</h2>
          <div className="grid gap-2">
            {myMemberships.map(({ membership, package: pkg }) => (
              <div
                key={membership.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/4 px-3 py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium text-stone-100">{pkg.name}</p>
                  <p className="text-xs text-stone-400">
                    Started {formatDate(membership.startDate)}
                    {membership.expiryDate
                      ? ` · Expires ${formatDate(membership.expiryDate)}`
                      : ""}
                  </p>
                </div>
                <Badge
                  tone={
                    membership.status === "active"
                      ? "green"
                      : membership.status === "expired"
                        ? "gray"
                        : "red"
                  }
                >
                  {membership.status}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Success message */}
      {successData && (
        <div className="rounded-lg bg-amber-900/30 p-3 ring-1 ring-amber-500/30">
          <p className="text-sm font-semibold text-amber-300">
            Request submitted! Invoice {successData.invoiceNumber}
          </p>
          <p className="mt-1 text-xs text-amber-400">
            Please transfer payment using one of the methods below:
          </p>
          {BANK_ACCOUNT || TNG_NUMBER ? (
            <div className="mt-2 grid gap-1 text-xs text-amber-400">
              {BANK_ACCOUNT && (
                <p>
                  <span className="font-medium">Bank transfer:</span>{" "}
                  {BANK_NAME} · {BANK_ACCOUNT}
                  {ACCOUNT_NAME && ` (${ACCOUNT_NAME})`}
                </p>
              )}
              {TNG_NUMBER && (
                <p>
                  <span className="font-medium">TNG:</span> {TNG_NUMBER}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-1 text-xs text-amber-400">
              Please contact us on WhatsApp for payment details.
            </p>
          )}
          <p className="mt-2 text-xs text-stone-400">
            Admin will activate your membership once payment is confirmed.
          </p>
        </div>
      )}

      {/* Request new package */}
      <section>
        <h2 className="mb-1 text-sm font-bold text-stone-100">
          Request a package
        </h2>
        <p className="mb-3 text-xs text-stone-400">
          Select a package below and make payment. Admin will activate your
          membership after confirming payment.
        </p>
        <div className="grid gap-3">
          {availablePackages.map((pkg) => (
            <Card key={pkg.id} className="p-4 border-white/10 bg-white/4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-stone-100">{pkg.name}</p>
                  <p className="mt-0.5 text-xs text-stone-400">
                    {pkg.type === "ten_class"
                      ? `${pkg.classCredits} classes`
                      : pkg.type === "unlimited"
                        ? "Unlimited classes"
                        : "Single class"}
                    {pkg.validityDays ? ` · ${pkg.validityDays} days` : ""}
                  </p>
                </div>
                <p className="shrink-0 font-black text-amber-300">
                  {formatCurrency(pkg.priceCents)}
                </p>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  disabled={
                    requestMembership.isPending &&
                    requestingPackageId === pkg.id
                  }
                  onClick={() => {
                    setRequestingPackageId(pkg.id);
                    requestMembership.mutate({ packageId: pkg.id });
                  }}
                  className="rounded-md bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-stone-700 disabled:opacity-60"
                >
                  {requestMembership.isPending && requestingPackageId === pkg.id
                    ? "Submitting…"
                    : "Request this package"}
                </button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
