"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { PlanSummary } from "@/components/admin/plan-summary";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import {
  CUSTOMER_SOURCES,
  GENDERS,
  PACKAGE_TYPES,
  PAYMENT_METHODS,
} from "@/db/schema";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import {
  centsToRinggit,
  defaultExpiry,
  PACKAGE_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  ringgitToCents,
  SOURCE_LABEL,
  shiftDays,
  today,
} from "../admin-format";

const sectionClass =
  "grid gap-4 rounded-xl border border-stone-200 bg-white p-5 md:p-6";

function SectionTitle({
  step,
  title,
  hint,
}: {
  step: number;
  title: string;
  hint: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-700">
        Step {step}
      </p>
      <h2 className="mt-1 text-lg font-black tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-stone-500">{hint}</p>
    </div>
  );
}

/**
 * The whole signup in one submit: customer → package → invoice. The package
 * mutation already writes the invoice, so this page only has to create the
 * customer first and hand its id over.
 */
export default function OnboardPage() {
  const utils = api.useUtils();
  const [type, setType] = useState<string>("credit");
  const [startDate, setStartDate] = useState(today());
  const [planId, setPlanId] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ id: string; name: string } | null>(null);

  const { data: plans = [] } = api.packagePlan.list.useQuery();
  const sellable = plans.filter((item) => item.isActive);
  const plan = plans.find((item) => item.id === planId);

  const createCustomer = api.customer.create.useMutation();
  const sellPackage = api.package.create.useMutation();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      const age = String(fd.get("age") ?? "");
      const [customer] = await createCustomer.mutateAsync({
        name: String(fd.get("name")),
        phone: String(fd.get("phone")),
        age: age ? Number(age) : undefined,
        gender:
          (String(fd.get("gender")) as (typeof GENDERS)[number] | "") ||
          undefined,
        emergencyContact: String(fd.get("emergencyContact") ?? "") || undefined,
        dateJoined: String(fd.get("dateJoined")),
        source:
          (String(fd.get("source")) as
            | (typeof CUSTOMER_SOURCES)[number]
            | "") || undefined,
        notes: String(fd.get("customerNotes") ?? "") || undefined,
      });

      // On a plan the type and credits come from the plan, not the form —
      // those fields are not rendered.
      const packageType =
        plan?.type ??
        (String(fd.get("type")) as (typeof PACKAGE_TYPES)[number]);
      await sellPackage.mutateAsync({
        customerId: customer.id,
        planId: planId || undefined,
        type: packageType,
        startDate: String(fd.get("startDate")),
        expiryDate: String(fd.get("expiryDate")),
        totalCredits:
          packageType === "unlimited"
            ? undefined
            : plan
              ? (plan.totalCredits ?? undefined)
              : Number(fd.get("totalCredits")),
        amountPaidCents: ringgitToCents(fd.get("amountPaid")),
        paymentMethod: String(
          fd.get("paymentMethod"),
        ) as (typeof PAYMENT_METHODS)[number],
        notes: String(fd.get("packageNotes") ?? "") || undefined,
        createInvoice: fd.get("createInvoice") === "on",
        discountCents: ringgitToCents(fd.get("discount")),
        markInvoicePaid: fd.get("markInvoicePaid") === "on",
      });

      utils.customer.list.invalidate();
      utils.package.list.invalidate();
      utils.invoice.list.invalidate();
      utils.report.dashboard.invalidate();
      toast.success(`${customer.name} is signed up.`);
      setDone({ id: customer.id, name: customer.name });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not complete signup.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <>
        <PageHeader eyebrow="Front desk" title="Signed up" />
        <div className={sectionClass}>
          <p className="text-sm text-stone-600">
            {done.name} now has a customer record, a package, and (if you ticked
            it) an invoice.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/admin/customers/${done.id}`}>
              <Button type="button">Open profile</Button>
            </Link>
            <Link href="/admin/invoices">
              <Button type="button" variant="quiet">
                Go to invoices
              </Button>
            </Link>
            <Button onClick={() => setDone(null)} type="button" variant="quiet">
              Sign up another
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Front desk" title="New signup" />
      <form className="grid gap-6" onSubmit={onSubmit}>
        <section className={sectionClass}>
          <SectionTitle
            hint="Source feeds the monthly report — fill it in while they are standing there."
            step={1}
            title="Customer"
          />
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
          <Field label="Customer notes">
            <Textarea name="customerNotes" />
          </Field>
        </section>

        <section className={sectionClass}>
          <SectionTitle
            hint="Pick a plan and the type, credits and price come with it. Start and expiry print on the invoice PDF, so set them properly."
            step={2}
            title="Package"
          />
          {/* A plan already says what the package is, so the type and credit
              fields only appear for a one-off custom sale. */}
          <Field label="Plan">
            <Select
              onChange={(e) => {
                const next = plans.find((item) => item.id === e.target.value);
                setPlanId(e.target.value);
                if (next) setType(next.type);
              }}
              value={planId}
            >
              <option value="">Custom — set everything by hand</option>
              {sellable.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {formatCurrency(item.priceCents)}
                  {item.totalCredits === null
                    ? ""
                    : ` · ${item.totalCredits} credits`}
                </option>
              ))}
            </Select>
          </Field>
          {plans.length === 0 ? (
            <p className="text-sm text-stone-500">
              No plans on the price list yet —{" "}
              <Link className="font-semibold underline" href="/admin/packages">
                add one
              </Link>{" "}
              to stop typing credits and prices by hand.
            </p>
          ) : null}
          {plan ? (
            <PlanSummary plan={plan} />
          ) : (
            <>
              <Field label="Package type">
                <Select
                  name="type"
                  onChange={(e) => setType(e.target.value)}
                  value={type}
                >
                  {PACKAGE_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {PACKAGE_TYPE_LABEL[value]}
                    </option>
                  ))}
                </Select>
              </Field>
              {type === "unlimited" ? null : (
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
            </>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start date">
              <Input
                name="startDate"
                onChange={(e) => setStartDate(e.target.value)}
                required
                type="date"
                value={startDate}
              />
            </Field>
            <Field label="Expiry date">
              <Input
                defaultValue={
                  plan
                    ? shiftDays(startDate, plan.validityDays)
                    : defaultExpiry(startDate, type)
                }
                key={`${startDate}-${type}-${planId}`}
                name="expiryDate"
                required
                type="date"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount paid (RM)">
              <Input
                defaultValue={plan ? centsToRinggit(plan.priceCents) : ""}
                inputMode="decimal"
                key={planId}
                name="amountPaid"
                required
              />
            </Field>
            <Field label="Payment method">
              <Select defaultValue="cash" name="paymentMethod">
                {PAYMENT_METHODS.map((value) => (
                  <option key={value} value={value}>
                    {PAYMENT_METHOD_LABEL[value]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Package notes">
            <Textarea name="packageNotes" />
          </Field>
        </section>

        <section className={sectionClass}>
          <SectionTitle
            hint="Marking it paid is what books the income — there is no separate income entry."
            step={3}
            title="Invoice"
          />
          <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
            <input
              className="size-4"
              defaultChecked
              name="createInvoice"
              type="checkbox"
            />
            Create invoice
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Discount (RM)">
              <Input defaultValue="0" inputMode="decimal" name="discount" />
            </Field>
            <label className="flex items-end gap-2 pb-3 text-sm font-medium text-stone-700">
              <input
                className="size-4"
                defaultChecked
                name="markInvoicePaid"
                type="checkbox"
              />
              Mark as paid (books income)
            </label>
          </div>
        </section>

        <div>
          <Button disabled={saving} type="submit">
            {saving ? "Saving…" : "Create customer, package & invoice"}
          </Button>
        </div>
      </form>
    </>
  );
}
