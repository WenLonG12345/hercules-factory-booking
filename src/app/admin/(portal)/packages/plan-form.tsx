"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { PACKAGE_TYPES } from "@/db/schema";
import {
  centsToRinggit,
  PACKAGE_TYPE_LABEL,
  ringgitToCents,
} from "../admin-format";

export type PlanValues = {
  name: string;
  type: (typeof PACKAGE_TYPES)[number];
  totalCredits?: number;
  priceCents: number;
  validityDays: number;
  description?: string;
  isActive: boolean;
  sortOrder: number;
};

/** Shared by the add dialog and the inline edit row. */
export function PlanForm({
  plan,
  sortOrder,
  onSubmit,
  pending,
  submitLabel,
}: {
  plan?: {
    name: string;
    type: (typeof PACKAGE_TYPES)[number];
    totalCredits: number | null;
    priceCents: number;
    validityDays: number;
    description: string | null;
    isActive: boolean;
    sortOrder: number;
  };
  sortOrder?: number;
  onSubmit: (values: PlanValues) => void;
  pending: boolean;
  submitLabel: string;
}) {
  const [type, setType] = useState<(typeof PACKAGE_TYPES)[number]>(
    plan?.type ?? "credit",
  );

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onSubmit({
          name: String(fd.get("name")),
          type,
          totalCredits:
            type === "unlimited" ? undefined : Number(fd.get("totalCredits")),
          priceCents: ringgitToCents(fd.get("price")),
          validityDays: Number(fd.get("validityDays")),
          description: String(fd.get("description") ?? "") || undefined,
          isActive: plan?.isActive ?? true,
          sortOrder: plan?.sortOrder ?? sortOrder ?? 0,
        });
      }}
    >
      <Field label="Plan name">
        <Input
          defaultValue={plan?.name}
          name="name"
          placeholder="10-Class Pass"
          required
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Package type">
          <Select
            name="type"
            onChange={(e) =>
              setType(e.target.value as (typeof PACKAGE_TYPES)[number])
            }
            value={type}
          >
            {PACKAGE_TYPES.map((value) => (
              <option key={value} value={value}>
                {PACKAGE_TYPE_LABEL[value]}
              </option>
            ))}
          </Select>
        </Field>
        {type === "unlimited" ? (
          <div className="grid gap-2 text-sm font-medium text-stone-500">
            <span>Credits</span>
            <p className="pt-3">Unlimited — no credit total.</p>
          </div>
        ) : (
          <Field label={type === "pt" ? "PT sessions" : "Credits"}>
            <Input
              defaultValue={plan?.totalCredits ?? 10}
              min={1}
              name="totalCredits"
              required
              type="number"
            />
          </Field>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Price (RM)">
          <Input
            defaultValue={plan ? centsToRinggit(plan.priceCents) : ""}
            inputMode="decimal"
            name="price"
            required
          />
        </Field>
        <Field label="Valid for (days)">
          <Input
            defaultValue={
              plan?.validityDays ?? (type === "unlimited" ? 30 : 90)
            }
            key={plan ? "edit" : type}
            min={1}
            name="validityDays"
            required
            type="number"
          />
        </Field>
      </div>
      <Field label="Description">
        <Textarea
          defaultValue={plan?.description ?? ""}
          name="description"
          placeholder="Shown to the admin only — what this plan covers."
        />
      </Field>
      <Button disabled={pending} type="submit">
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
