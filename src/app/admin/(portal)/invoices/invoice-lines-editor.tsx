"use client";

import { Plus, X } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, Input } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PACKAGE_TYPES, type PackageType } from "@/db/schema";
import { formatCurrency } from "@/lib/utils";
import type { InvoiceItemInput } from "@/server/validators/invoice";
import {
  centsToRinggit,
  defaultExpiry,
  PACKAGE_TYPE_LABEL,
  ringgitToCents,
  today,
} from "../admin-format";

/** A package type sells a package; "other" is money only — gloves, a fee. */
export type LineKind = PackageType | "other";

/** One line as the admin types it — strings, so a half-typed price stays. */
export type LineDraft = {
  /** React key. Stable across edits, unlike the index. */
  key: string;
  /** Set on a line that already exists on an issued invoice. */
  id?: string;
  kind: LineKind;
  description: string;
  amount: string;
  credits: string;
  /** Empty means the start date is not settled yet — it reads TBC. */
  validFrom: string;
  /** Empty means no end date — it reads TBC and expiry never closes it. */
  validUntil: string;
  /** Credits already burned on the package this line sold, if any. */
  usedCredits?: number;
};

export const newLine = (kind: LineKind = "credit"): LineDraft => ({
  key: crypto.randomUUID(),
  kind,
  description: "",
  amount: "",
  credits: "10",
  validFrom: today(),
  validUntil: defaultExpiry(today(), kind),
});

export const lineAmountCents = (line: LineDraft) => ringgitToCents(line.amount);

export const linesSubtotalCents = (lines: LineDraft[]) =>
  lines.reduce((sum, line) => sum + lineAmountCents(line), 0);

/** The first thing wrong with the lines, in the words the step would use. */
export function linesBlocker(lines: LineDraft[]) {
  for (const [index, line] of lines.entries()) {
    const n = index + 1;
    if (!line.description.trim()) return `Line ${n} needs a description.`;
    if (line.kind !== "other") {
      if (line.kind !== "unlimited" && !(Number(line.credits) >= 1))
        return `Line ${n} needs at least 1 credit.`;
      if (line.validFrom && line.validUntil && line.validUntil < line.validFrom)
        return `Line ${n} ends before it starts. Check the dates.`;
    }
  }
  if (linesSubtotalCents(lines) <= 0) return "Add a price.";
  return null;
}

/** The shape `invoice.create` and `invoice.update` take. */
export const lineToInput = (line: LineDraft): InvoiceItemInput => ({
  id: line.id,
  description: line.description.trim(),
  amountCents: lineAmountCents(line),
  package:
    line.kind === "other"
      ? undefined
      : {
          type: line.kind,
          totalCredits:
            line.kind === "unlimited" ? undefined : Number(line.credits),
          validFrom: line.validFrom || undefined,
          validUntil: line.validUntil || undefined,
        },
});

/** An issued invoice's lines, ready to edit. */
export const linesFromItems = (
  items: {
    id: string;
    description: string;
    amountCents: number;
    package: {
      type: PackageType;
      totalCredits: number | null;
      usedCredits: number;
      startDate: string | null;
      expiryDate: string | null;
    } | null;
  }[],
): LineDraft[] =>
  items.map((item) => ({
    key: item.id,
    id: item.id,
    kind: item.package?.type ?? "other",
    description: item.description,
    amount: centsToRinggit(item.amountCents),
    credits: String(item.package?.totalCredits ?? 10),
    validFrom: item.package?.startDate ?? "",
    validUntil: item.package?.expiryDate ?? "",
    usedCredits: item.package?.usedCredits,
  }));

/**
 * The lines of an invoice, one card each. Package lines carry their own
 * credits and window because each one opens its own package; an "Other" line
 * is just words and a price. The subtotal reads out underneath so the admin
 * sees the figure add up as she types.
 */
export function InvoiceLinesEditor({
  lines,
  onChange,
}: {
  lines: LineDraft[];
  onChange: (lines: LineDraft[]) => void;
}) {
  const patch = (key: string, values: Partial<LineDraft>) =>
    onChange(
      lines.map((line) => (line.key === key ? { ...line, ...values } : line)),
    );

  /**
   * Moving the start date or the type re-derives the expiry off the new
   * values — but only while both ends are still filled in. A blank date is the
   * admin saying it is not settled yet, and that survives the edit.
   */
  const patchWindow = (line: LineDraft, values: Partial<LineDraft>) => {
    const next = { ...line, ...values };
    patch(line.key, {
      ...values,
      validUntil:
        line.validUntil && next.validFrom
          ? defaultExpiry(next.validFrom, next.kind)
          : line.validUntil,
    });
  };

  return (
    <div className="grid gap-3">
      {lines.map((line, index) => (
        <div
          className="grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4"
          key={line.key}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
              Line {index + 1}
            </p>
            {lines.length > 1 ? (
              <button
                aria-label={`Remove line ${index + 1}`}
                className="grid size-8 place-items-center rounded-md text-stone-500 transition hover:bg-stone-200 hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                onClick={() =>
                  onChange(lines.filter((item) => item.key !== line.key))
                }
                type="button"
              >
                <X aria-hidden className="size-4" />
              </button>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-[11rem_minmax(0,1fr)_8rem]">
            <Field label="Type">
              <Select
                onValueChange={(kind) =>
                  patchWindow(line, { kind: kind as LineKind })
                }
                value={line.kind}
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
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Description">
              <Input
                onChange={(e) =>
                  patch(line.key, { description: e.target.value })
                }
                placeholder={
                  line.kind === "other" ? "Boxing gloves" : "10 credit package"
                }
                value={line.description}
              />
            </Field>
            <Field label="Price (RM)">
              <Input
                inputMode="decimal"
                onChange={(e) => patch(line.key, { amount: e.target.value })}
                placeholder="0.00"
                value={line.amount}
              />
            </Field>
          </div>

          {line.kind === "other" ? null : (
            <div className="grid gap-4 sm:grid-cols-3">
              {line.kind === "unlimited" ? (
                <Field label="Sessions">
                  <Input disabled readOnly value="Unlimited" />
                </Field>
              ) : (
                <Field label={line.kind === "pt" ? "PT sessions" : "Credits"}>
                  <Input
                    min={line.usedCredits || 1}
                    onChange={(e) =>
                      patch(line.key, { credits: e.target.value })
                    }
                    type="number"
                    value={line.credits}
                  />
                  {line.usedCredits ? (
                    <span className="text-xs font-normal text-stone-500">
                      {line.usedCredits} already used — cannot go below that.
                    </span>
                  ) : null}
                </Field>
              )}
              <Field label="Starts on">
                <DatePicker
                  clearable
                  onValueChange={(validFrom) =>
                    patchWindow(line, { validFrom })
                  }
                  placeholder="TBC"
                  value={line.validFrom}
                />
              </Field>
              <Field label="Ends on">
                <DatePicker
                  clearable
                  onValueChange={(validUntil) =>
                    patch(line.key, { validUntil })
                  }
                  placeholder="TBC"
                  value={line.validUntil}
                />
              </Field>
              <p className="text-xs text-stone-500 sm:col-span-3">
                {line.validFrom && line.validUntil
                  ? "Clear either date (×) to leave it TBC — you can set it on the invoice later."
                  : "TBC on the invoice. Credits still work; with no end date, expiry never blocks check-in."}
              </p>
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          className="inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          onClick={() => onChange([...lines, newLine("other")])}
          type="button"
        >
          <Plus aria-hidden className="size-4" />
          Add another line
        </button>
        <p className="text-sm text-stone-600">
          Subtotal{" "}
          <span className="font-semibold tabular-nums text-stone-950">
            {formatCurrency(linesSubtotalCents(lines))}
          </span>
        </p>
      </div>
    </div>
  );
}
