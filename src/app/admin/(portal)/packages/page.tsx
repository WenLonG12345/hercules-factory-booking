"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { TableWrap, tableClass, tdClass, thClass } from "@/components/ui/table";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { PACKAGE_TYPE_LABEL } from "../admin-format";
import { AddPlanDialog } from "./add-plan-dialog";
import { PlanForm } from "./plan-form";

/**
 * The price list. A plan is a template — selling one copies its numbers onto
 * the customer's package, so editing a plan never rewrites a past sale.
 */
export default function PackagePlansPage() {
  const utils = api.useUtils();
  const [editing, setEditing] = useState<string | null>(null);

  const { data: plans = [], isLoading } = api.packagePlan.list.useQuery();

  const invalidate = () => {
    utils.packagePlan.list.invalidate();
    utils.package.list.invalidate();
  };

  const update = api.packagePlan.update.useMutation({
    onSuccess: () => {
      toast.success("Plan saved.");
      setEditing(null);
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const remove = api.packagePlan.delete.useMutation({
    onSuccess: () => {
      toast.success("Plan removed.");
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

  return (
    <>
      <PageHeader eyebrow="Sales" title="Packages">
        <AddPlanDialog onSuccess={invalidate} sortOrder={plans.length} />
      </PageHeader>

      <p className="mb-4 max-w-2xl text-sm text-stone-500">
        Set what the gym sells here. The sell dialog on Customers picks a plan
        and fills in credits, price and expiry — editing a plan changes future
        sales only.
      </p>

      <TableWrap>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Plan</th>
              <th className={thClass}>Type</th>
              <th className={thClass}>Credits</th>
              <th className={thClass}>Price</th>
              <th className={thClass}>Valid for</th>
              <th className={thClass}>Sold</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 ? (
              <tr>
                <td className={tdClass} colSpan={8}>
                  No plans yet — add the first one to start selling from a price
                  list.
                </td>
              </tr>
            ) : (
              plans.flatMap((plan) => {
                const rows = [
                  <tr key={plan.id}>
                    <td className={tdClass}>
                      <span className="font-semibold text-stone-950">
                        {plan.name}
                      </span>
                      {plan.description ? (
                        <span className="block text-stone-500">
                          {plan.description}
                        </span>
                      ) : null}
                    </td>
                    <td className={tdClass}>{PACKAGE_TYPE_LABEL[plan.type]}</td>
                    <td className={tdClass}>
                      {plan.totalCredits === null
                        ? "Unlimited"
                        : plan.totalCredits}
                    </td>
                    <td className={tdClass}>
                      {formatCurrency(plan.priceCents)}
                    </td>
                    <td className={tdClass}>{plan.validityDays} days</td>
                    <td className={tdClass}>{plan.soldCount}</td>
                    <td className={tdClass}>
                      <button
                        onClick={() =>
                          update.mutate({
                            id: plan.id,
                            name: plan.name,
                            type: plan.type,
                            totalCredits: plan.totalCredits ?? undefined,
                            priceCents: plan.priceCents,
                            validityDays: plan.validityDays,
                            description: plan.description ?? undefined,
                            sortOrder: plan.sortOrder,
                            isActive: !plan.isActive,
                          })
                        }
                        type="button"
                      >
                        <Badge tone={plan.isActive ? "green" : "gray"}>
                          {plan.isActive ? "On sale" : "Retired"}
                        </Badge>
                      </button>
                    </td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          className="font-semibold text-stone-600 underline-offset-4 hover:underline"
                          onClick={() =>
                            setEditing(editing === plan.id ? null : plan.id)
                          }
                          type="button"
                        >
                          {editing === plan.id ? "Close" : "Edit"}
                        </button>
                        <button
                          className="font-semibold text-red-700 underline-offset-4 hover:underline"
                          onClick={() => remove.mutate({ id: plan.id })}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>,
                ];

                if (editing === plan.id) {
                  rows.push(
                    <tr key={`${plan.id}-edit`}>
                      <td
                        className="border-b border-stone-100 bg-stone-50 px-4 py-4"
                        colSpan={8}
                      >
                        <PlanForm
                          key={plan.id}
                          onSubmit={(values) =>
                            update.mutate({ ...values, id: plan.id })
                          }
                          pending={update.isPending}
                          plan={plan}
                          submitLabel="Save plan"
                        />
                      </td>
                    </tr>,
                  );
                }

                return rows;
              })
            )}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
}
