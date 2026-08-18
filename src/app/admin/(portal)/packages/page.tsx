"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { columnHelper, DataTable } from "@/components/ui/data-table";
import { api, type RouterOutputs } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { PACKAGE_TYPE_LABEL } from "../admin-format";
import { AddPlanDialog } from "./add-plan-dialog";
import { PlanForm } from "./plan-form";

type Plan = RouterOutputs["packagePlan"]["list"][number];

const helper = columnHelper<Plan>();

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

  const columns = helper.columns([
    helper.accessor("name", {
      header: "Plan",
      cell: ({ row }) => (
        <>
          <span className="font-semibold text-stone-950">
            {row.original.name}
          </span>
          {row.original.description ? (
            <span className="block text-stone-500">
              {row.original.description}
            </span>
          ) : null}
        </>
      ),
    }),
    helper.accessor("type", {
      header: "Type",
      cell: (info) => PACKAGE_TYPE_LABEL[info.getValue()],
    }),
    helper.accessor("totalCredits", {
      header: "Credits",
      cell: (info) => info.getValue() ?? "Unlimited",
    }),
    helper.accessor("priceCents", {
      header: "Price",
      cell: (info) => formatCurrency(info.getValue()),
    }),
    helper.accessor("validityDays", {
      header: "Valid for",
      cell: (info) => `${info.getValue()} days`,
    }),
    helper.accessor("soldCount", { header: "Sold" }),
    helper.display({
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const plan = row.original;
        return (
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
        );
      },
    }),
    helper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const plan = row.original;
        return (
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="font-semibold text-stone-600 underline-offset-4 hover:underline"
              onClick={() => setEditing(editing === plan.id ? null : plan.id)}
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
        );
      },
    }),
  ]);

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

      <DataTable
        columns={columns}
        data={plans}
        empty="No plans yet — add the first one to start selling from a price list."
        getRowId={(plan) => plan.id}
        renderSubRow={(plan) =>
          editing === plan.id ? (
            <PlanForm
              key={plan.id}
              onSubmit={(values) => update.mutate({ ...values, id: plan.id })}
              pending={update.isPending}
              plan={plan}
              submitLabel="Save plan"
            />
          ) : null
        }
        sortable
      />
    </>
  );
}
