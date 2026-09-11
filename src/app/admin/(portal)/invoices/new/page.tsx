"use client";

import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import {
  PACKAGE_TYPES,
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@/db/schema";
import { api } from "@/lib/trpc";
import { cn, formatCurrency } from "@/lib/utils";
import {
  centsToRinggit,
  defaultExpiry,
  PACKAGE_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  ringgitToCents,
  shiftDays,
  today,
} from "../../admin-format";
import { InvoiceDraftPreview } from "./invoice-draft-preview";

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

/** The typed text minus the phone half the picker appends to a match. */
const typedName = (value: string) => value.split("—")[0].trim();

/** Unpaid is a deliberate choice here, not the absence of one — the admin has
 *  to say which, because saying "cash" is what books the income. */
type Payment = PaymentMethod | "unpaid";

/** One rung of the ledger: ordinal, heading, and its fields underneath. */
function Step({
  children,
  done,
  hint,
  index,
  title,
}: {
  children: React.ReactNode;
  done: boolean;
  hint?: string;
  index: number;
  title: string;
}) {
  return (
    <section className="border-t border-stone-200 py-5 first:border-t-0 first:pt-0">
      <header className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-full text-xs font-black tabular-nums transition",
            done ? "bg-red-700 text-white" : "bg-stone-200 text-stone-600",
          )}
        >
          {done ? <Check aria-hidden className="size-4" /> : index}
        </span>
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-stone-950">
          {title}
        </h2>
      </header>
      {hint ? (
        <p className="mt-2 text-sm text-stone-500 sm:pl-10">{hint}</p>
      ) : null}
      <div className="mt-4 grid gap-4 sm:pl-10">{children}</div>
    </section>
  );
}

export default function NewInvoicePage() {
  const router = useRouter();
  const utils = api.useUtils();

  const [customerQuery, setCustomerQuery] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [planId, setPlanId] = useState("");
  const [packageType, setPackageType] =
    useState<(typeof PACKAGE_TYPES)[number]>("credit");
  const [credits, setCredits] = useState("10");
  const [description, setDescription] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [discount, setDiscount] = useState("0");
  // Prefills from the plan, but only until the admin overrides them by hand.
  const [descriptionTouched, setDescriptionTouched] = useState(false);
  const [subtotalTouched, setSubtotalTouched] = useState(false);

  const [payment, setPayment] = useState<Payment | null>(null);
  const [paidDate, setPaidDate] = useState(today());

  const [issueDate, setIssueDate] = useState(today());
  const [validFrom, setValidFrom] = useState(today());
  // Empty means "whatever the plan or the package type works out to".
  const [expiryOverride, setExpiryOverride] = useState("");
  const [notes, setNotes] = useState("");

  const { data: customers = [], isLoading: loadingCustomers } =
    api.customer.list.useQuery();
  const { data: plans = [], isLoading: loadingPlans } =
    api.packagePlan.list.useQuery();

  const createInvoice = api.invoice.create.useMutation({
    onSuccess: (rows) => {
      toast.success(
        `Invoice ${rows[0]?.invoiceNumber ?? ""} created${
          rows[0]?.status === "paid" ? ". Money added to Daily Income." : "."
        }`,
      );
      utils.invoice.list.invalidate();
      utils.customer.list.invalidate();
      utils.package.list.invalidate();
      utils.ledger.list.invalidate();
      utils.report.dashboard.invalidate();
      router.push(`/admin/invoices/${rows[0].id}`);
    },
    onError: (error) => toast.error(error.message),
  });

  if (loadingCustomers || loadingPlans) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-stone-200" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
          {["steps", "preview"].map((key) => (
            <div className="h-96 rounded-lg bg-stone-200" key={key} />
          ))}
        </div>
      </div>
    );
  }

  const byLabel = new Map(
    customers.map((c) => [labelKey(customerLabel(c)), c.id]),
  );
  const matched = customers.find((c) => c.id === customerId);
  const plan = plans.find((item) => item.id === planId);
  const type = plan?.type ?? packageType;

  const name = matched?.name ?? typedName(customerQuery);
  const isNewCustomer = !matched && name.length >= 2;

  const resolvedDescription =
    descriptionTouched || !plan ? description : plan.name;
  const resolvedSubtotal =
    subtotalTouched || !plan ? subtotal : centsToRinggit(plan.priceCents);

  const subtotalCents = ringgitToCents(resolvedSubtotal);
  const discountCents = ringgitToCents(discount);
  const totalCredits = plan
    ? (plan.totalCredits ?? undefined)
    : type === "unlimited"
      ? undefined
      : Number(credits);
  const validUntil =
    expiryOverride ||
    (plan
      ? shiftDays(validFrom, plan.validityDays)
      : defaultExpiry(validFrom, type));

  const packageLine = plan
    ? `${PACKAGE_TYPE_LABEL[plan.type]} · ${
        plan.totalCredits === null
          ? "Unlimited sessions"
          : `${plan.totalCredits} ${plan.type === "pt" ? "PT sessions" : "credits"}`
      }`
    : `${PACKAGE_TYPE_LABEL[type]} · ${
        type === "unlimited"
          ? "Unlimited sessions"
          : `${totalCredits ?? 0} ${type === "pt" ? "PT sessions" : "credits"}`
      }`;

  const customerDone = !!matched || isNewCustomer;
  const lineDone = resolvedDescription.trim().length > 0 && subtotalCents > 0;
  const paidDateDone = payment === "unpaid" || (!!payment && !!paidDate);

  // Every reason the invoice cannot be issued yet, in the order the steps ask.
  const blocker = !customerDone
    ? "Step 1 — type the customer name."
    : !lineDone
      ? "Step 2 — add a description and a price."
      : discountCents > subtotalCents
        ? "Step 2 — the discount is bigger than the price."
        : payment === null
          ? "Step 3 — pick how they paid."
          : !paidDateDone
            ? "Step 4 — pick the date they paid."
            : validUntil < validFrom
              ? "Step 2 — the package ends before it starts. Check the dates."
              : null;

  const submit = () => {
    if (blocker) {
      toast.error(blocker);
      return;
    }
    createInvoice.mutate({
      customerId: matched?.id,
      newCustomer: matched
        ? undefined
        : { name, phone: newPhone.trim() || undefined },
      planId: planId || undefined,
      packageType: type,
      totalCredits,
      description: resolvedDescription.trim(),
      subtotalCents,
      discountCents,
      issueDate,
      validFrom,
      validUntil,
      paymentMethod: payment === "unpaid" ? undefined : (payment ?? undefined),
      paidDate: payment === "unpaid" ? undefined : paidDate,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <>
      <PageHeader eyebrow="Invoices" title="Create invoice">
        <Link
          className="inline-flex items-center gap-1 text-sm font-semibold text-stone-600 transition hover:text-stone-950"
          href="/admin/invoices"
        >
          <ArrowLeft className="size-4" />
          Back to invoices
        </Link>
      </PageHeader>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
        {/* The work: four rungs, top to bottom, each ticked once it is answered. */}
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm md:p-6">
          <Step
            done={customerDone}
            hint="Type the name. Pick it from the list, or type a new name to add them."
            index={1}
            title="Customer"
          >
            {/* 200+ customers is more than a dropdown can show — the datalist
                filters as you type, for free and natively. */}
            <Field label="Customer name">
              <Input
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                autoFocus
                list="new-invoice-customer-options"
                onChange={(e) => {
                  setCustomerQuery(e.target.value);
                  setCustomerId(byLabel.get(labelKey(e.target.value)) ?? "");
                }}
                placeholder="Type a name, phone or IC…"
                spellCheck={false}
                value={customerQuery}
              />
              <datalist id="new-invoice-customer-options">
                {customers.map((customer) => (
                  <option key={customer.id} value={customerLabel(customer)}>
                    {customer.name}
                  </option>
                ))}
              </datalist>
            </Field>
            {matched ? (
              <p className="text-sm font-semibold text-emerald-700">
                Already a customer · {matched.phone ?? matched.ic ?? "no phone"}
              </p>
            ) : isNewCustomer ? (
              <div className="grid gap-3 rounded-md border border-amber-300 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">
                  New customer. “{name}” will be added when you create the
                  invoice.
                </p>
                <Field label="Phone (optional)">
                  <Input
                    inputMode="tel"
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="012-345 6789"
                    value={newPhone}
                  />
                </Field>
              </div>
            ) : null}
          </Step>

          <Step
            done={lineDone}
            hint="Pick the package. Price, credits and dates fill in by themselves."
            index={2}
            title="What they bought"
          >
            <Field label="Package">
              <Select
                onChange={(e) => {
                  setPlanId(e.target.value);
                  const next = plans.find((item) => item.id === e.target.value);
                  if (next) setPackageType(next.type);
                }}
                value={planId}
              >
                <option value="">Something else — I will type it</option>
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
            {plan ? null : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Type">
                  <Select
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
                {type === "unlimited" ? null : (
                  <Field label={type === "pt" ? "PT sessions" : "Credits"}>
                    <Input
                      min={1}
                      onChange={(e) => setCredits(e.target.value)}
                      type="number"
                      value={credits}
                    />
                  </Field>
                )}
              </div>
            )}
            <Field label="Description">
              <Input
                onChange={(e) => {
                  setDescriptionTouched(true);
                  setDescription(e.target.value);
                }}
                placeholder="10 credit package"
                value={resolvedDescription}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price (RM)">
                <Input
                  inputMode="decimal"
                  onChange={(e) => {
                    setSubtotalTouched(true);
                    setSubtotal(e.target.value);
                  }}
                  placeholder="0.00"
                  value={resolvedSubtotal}
                />
              </Field>
              <Field label="Less discount (RM)">
                <Input
                  inputMode="decimal"
                  onChange={(e) => setDiscount(e.target.value)}
                  value={discount}
                />
              </Field>
            </div>
            {/* The package window is worked out from the plan. It stays out of
                the way, and opens when a sale needs different dates. */}
            <details className="rounded-md border border-stone-200 bg-stone-50 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-stone-700">
                Dates are set already. Tap to change.
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Field label="Invoice date">
                  <Input
                    onChange={(e) => setIssueDate(e.target.value)}
                    type="date"
                    value={issueDate}
                  />
                </Field>
                <Field label="Package starts on">
                  <Input
                    onChange={(e) => setValidFrom(e.target.value)}
                    type="date"
                    value={validFrom}
                  />
                </Field>
                <Field label="Package ends on">
                  <Input
                    onChange={(e) => setExpiryOverride(e.target.value)}
                    type="date"
                    value={validUntil}
                  />
                </Field>
              </div>
            </details>
          </Step>

          <Step
            done={payment !== null}
            hint="Pick one. This marks the invoice paid and adds the money to Daily Income."
            index={3}
            title="How they paid"
          >
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  aria-pressed={payment === method}
                  className={cn(
                    "h-11 rounded-md border px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600",
                    payment === method
                      ? "border-red-700 bg-red-700 text-white"
                      : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50",
                  )}
                  key={method}
                  onClick={() => setPayment(method)}
                  type="button"
                >
                  {PAYMENT_METHOD_LABEL[method]}
                </button>
              ))}
              <button
                aria-pressed={payment === "unpaid"}
                className={cn(
                  "h-11 rounded-md border px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600",
                  payment === "unpaid"
                    ? "border-stone-950 bg-stone-950 text-white"
                    : "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:bg-stone-50",
                )}
                onClick={() => setPayment("unpaid")}
                type="button"
              >
                Not paid yet
              </button>
            </div>
          </Step>

          <Step
            done={paidDateDone}
            hint={
              payment === "unpaid"
                ? undefined
                : "The day the money came in. Daily Income counts it on this day."
            }
            index={4}
            title="Date paid"
          >
            {payment === "unpaid" ? (
              <p className="text-sm text-stone-500">
                No date needed. The invoice is saved as unpaid — mark it paid
                later, when the money comes in.
              </p>
            ) : (
              <Field className="sm:max-w-xs" label="Date paid">
                <Input
                  disabled={payment === null}
                  onChange={(e) => setPaidDate(e.target.value)}
                  type="date"
                  value={paidDate}
                />
              </Field>
            )}
            <Field label="Notes (only you see this)">
              <Textarea
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything you want to remember about this sale."
                value={notes}
              />
            </Field>
          </Step>
        </div>

        {/* The document, filling in as she types. On a phone it sits under the
            four rungs, so the read-then-create order still holds. */}
        <div className="grid gap-4 lg:sticky lg:top-24">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
            Preview
          </p>
          <InvoiceDraftPreview
            draft={{
              customerName: name,
              customerPhone: matched?.phone ?? newPhone,
              description: resolvedDescription,
              discountCents,
              issueDate,
              paid: !!payment && payment !== "unpaid",
              subtotalCents,
              validFrom,
              validUntil,
            }}
          />
          {/* True of the draft, not of the document — so it sits beside the
              sheet rather than being printed on it. */}
          <div className="grid gap-1 text-xs text-stone-500">
            <p>{packageLine}</p>
            {isNewCustomer ? (
              <p className="font-semibold text-amber-700">
                “{name}” will be added as a new customer.
              </p>
            ) : null}
          </div>
          <Button
            className="w-full"
            disabled={!!blocker || createInvoice.isPending}
            onClick={submit}
            type="button"
          >
            {createInvoice.isPending ? "Creating…" : "Create invoice"}
          </Button>
          <p className="text-xs text-stone-500">
            {blocker ??
              (payment === "unpaid"
                ? "Saves the invoice and gives the customer their package. Nothing goes into Daily Income until you mark it paid."
                : "Saves the invoice, gives the customer their package, and adds the money to Daily Income.")}
          </p>
        </div>
      </div>
    </>
  );
}
