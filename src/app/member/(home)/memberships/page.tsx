import { asc, desc, eq } from "drizzle-orm";
import { requestMembershipAction } from "@/app/member/actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { memberships, packages } from "@/db/schema";
import { formatCents, formatDate, requireCustomer } from "../member-data";
import { RequestMembershipForm } from "./request-form";

const BANK_NAME = process.env.NEXT_PUBLIC_PAYMENT_BANK_NAME ?? "";
const BANK_ACCOUNT = process.env.NEXT_PUBLIC_PAYMENT_BANK_ACCOUNT ?? "";
const ACCOUNT_NAME = process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME ?? "";
const TNG_NUMBER = process.env.NEXT_PUBLIC_PAYMENT_TNG_NUMBER ?? "";

export default async function MembershipsPage() {
  const { customer, db } = await requireCustomer();
  const today = new Date().toISOString().split("T")[0];

  const myMemberships = await db
    .select({ membership: memberships, package: packages })
    .from(memberships)
    .innerJoin(packages, eq(packages.id, memberships.packageId))
    .where(eq(memberships.customerId, customer.id))
    .orderBy(desc(memberships.createdAt));

  const availablePackages = await db
    .select()
    .from(packages)
    .where(eq(packages.isActive, true))
    .orderBy(asc(packages.sortOrder));

  const activeMembership = myMemberships.find(
    (m) =>
      m.membership.status === "active" &&
      (m.membership.expiryDate === null || m.membership.expiryDate >= today),
  );

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
                  {formatCents(pkg.priceCents)}
                </p>
              </div>
              <div className="mt-3">
                <RequestMembershipForm
                  packageId={pkg.id}
                  action={requestMembershipAction}
                  paymentInfo={{
                    bankName: BANK_NAME,
                    bankAccount: BANK_ACCOUNT,
                    accountName: ACCOUNT_NAME,
                    tngNumber: TNG_NUMBER,
                  }}
                />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
