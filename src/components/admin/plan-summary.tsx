import { PACKAGE_TYPE_LABEL } from "@/app/admin/(portal)/admin-format";
import { formatCurrency } from "@/lib/utils";

/**
 * What the chosen plan gives, read-only. The plan is the source of truth for
 * the type and the credit total, so those are shown rather than asked for.
 */
export function PlanSummary({
  plan,
}: {
  plan: {
    name: string;
    type: keyof typeof PACKAGE_TYPE_LABEL;
    totalCredits: number | null;
    priceCents: number;
    validityDays: number;
    description: string | null;
  };
}) {
  return (
    <div className="grid gap-1 rounded-md border border-stone-200 bg-stone-50 p-4 text-sm">
      <p className="font-semibold text-stone-950">{plan.name}</p>
      <p className="text-stone-600">
        {PACKAGE_TYPE_LABEL[plan.type]} ·{" "}
        {plan.totalCredits === null
          ? "Unlimited sessions"
          : `${plan.totalCredits} ${plan.type === "pt" ? "PT sessions" : "credits"}`}{" "}
        · valid {plan.validityDays} days · {formatCurrency(plan.priceCents)}
      </p>
      {plan.description ? (
        <p className="text-stone-500">{plan.description}</p>
      ) : null}
    </div>
  );
}
