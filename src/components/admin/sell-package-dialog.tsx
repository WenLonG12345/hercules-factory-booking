"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  centsToRinggit,
  defaultExpiry,
  PACKAGE_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  ringgitToCents,
  shiftDays,
  today,
} from "@/app/admin/(portal)/admin-format";
import { PlanSummary } from "@/components/admin/plan-summary";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/form";
import {
  SELECT_NONE,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PACKAGE_TYPES, PAYMENT_METHODS } from "@/db/schema";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";

export function SellPackageDialog({
  customerId,
  customerName,
  convertedFromSessionId,
  trigger,
  onSuccess,
}: {
  customerId?: string;
  customerName?: string;
  convertedFromSessionId?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("credit");
  const [startDate, setStartDate] = useState(today());
  const [expiryDate, setExpiryDate] = useState(() =>
    defaultExpiry(today(), "credit"),
  );
  const [planId, setPlanId] = useState("");

  const { data: customers = [] } = api.customer.list.useQuery(undefined, {
    enabled: open && !customerId,
  });
  const { data: plans = [] } = api.packagePlan.list.useQuery(undefined, {
    enabled: open,
  });

  const sellable = plans.filter((item) => item.isActive);
  const plan = plans.find((item) => item.id === planId);

  /** The expiry the plan (or the type) works out to. Empty when TBC. */
  const derivedExpiry = (
    start: string,
    kind: string,
    from?: (typeof plans)[number],
  ) => {
    if (!start) return "";
    return from
      ? shiftDays(start, from.validityDays)
      : defaultExpiry(start, kind);
  };

  /**
   * Moving the start date, the type or the plan re-derives the expiry — but a
   * cleared expiry is the admin saying it is TBC, and that survives the change.
   */
  const reprice = (
    start: string,
    kind: string,
    from?: (typeof plans)[number],
  ) => {
    setStartDate(start);
    setType(kind);
    if (expiryDate) setExpiryDate(derivedExpiry(start, kind, from));
  };

  const sell = api.package.create.useMutation({
    onSuccess: () => {
      toast.success("Package sold.");
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button type="button">Sell package</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sell package</DialogTitle>
          <DialogDescription>
            {customerName
              ? `For ${customerName}.`
              : "Pick a customer and record what they paid."}
            {" Ticking “create invoice” books the income at the same time."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            // On a plan the type and credits come from the plan, not the form —
            // those fields are not rendered.
            const packageType =
              plan?.type ??
              (String(fd.get("type")) as (typeof PACKAGE_TYPES)[number]);
            sell.mutate({
              customerId: customerId ?? String(fd.get("customerId")),
              planId: planId || undefined,
              type: packageType,
              // Blank on either end means "not settled yet" — the invoice
              // reads TBC and the date gets filled in later.
              startDate: String(fd.get("startDate") ?? "") || undefined,
              expiryDate: String(fd.get("expiryDate") ?? "") || undefined,
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
              notes: String(fd.get("notes") ?? "") || undefined,
              convertedFromSessionId,
              createInvoice: fd.get("createInvoice") === "on",
              discountCents: ringgitToCents(fd.get("discount")),
              markInvoicePaid: fd.get("markInvoicePaid") === "on",
            });
          }}
        >
          {customerId ? null : (
            <Field label="Customer">
              <Select name="customerId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer…" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} — {customer.phone ?? customer.ic ?? "—"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          {/* A plan already says what the package is, so the type and credit
              fields only appear for a one-off custom sale. */}
          <Field label="Plan">
            <Select
              onValueChange={(picked) => {
                const id = picked === SELECT_NONE ? "" : picked;
                const next = plans.find((item) => item.id === id);
                setPlanId(id);
                reprice(startDate, next?.type ?? type, next);
              }}
              value={planId || SELECT_NONE}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_NONE}>
                  Custom — set everything by hand
                </SelectItem>
                {sellable.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} — {formatCurrency(item.priceCents)}
                    {item.totalCredits === null
                      ? ""
                      : ` · ${item.totalCredits} credits`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {plan ? (
            <PlanSummary plan={plan} />
          ) : (
            <Field label="Package type">
              <Select
                name="type"
                onValueChange={(next) => reprice(startDate, next, plan)}
                value={type}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PACKAGE_TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {PACKAGE_TYPE_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start date">
              <DatePicker
                clearable
                name="startDate"
                onValueChange={(next) => reprice(next, type, plan)}
                placeholder="TBC"
                value={startDate}
              />
            </Field>
            <Field label="Expiry date">
              <DatePicker
                clearable
                name="expiryDate"
                onValueChange={setExpiryDate}
                placeholder="TBC"
                value={expiryDate}
              />
              <span className="text-xs font-normal text-stone-500">
                Clear either date (×) to leave it TBC.
              </span>
            </Field>
          </div>
          {plan || type === "unlimited" ? null : (
            <Field label={type === "pt" ? "PT sessions" : "Credits"}>
              <Input
                name="totalCredits"
                type="number"
                min={1}
                defaultValue={10}
                key={type}
                required
              />
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount paid (RM)">
              <Input
                name="amountPaid"
                inputMode="decimal"
                defaultValue={plan ? centsToRinggit(plan.priceCents) : ""}
                key={planId}
                required
              />
            </Field>
            <Field label="Payment method">
              <Select defaultValue="cash" name="paymentMethod">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {PAYMENT_METHOD_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid gap-3 rounded-md border border-stone-200 bg-stone-50 p-4">
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
                <Input name="discount" inputMode="decimal" defaultValue="0" />
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
          </div>
          <Field label="Notes">
            <Textarea name="notes" />
          </Field>
          <Button disabled={sell.isPending} type="submit">
            {sell.isPending ? "Saving…" : "Sell package"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
