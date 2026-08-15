"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { TableWrap, tableClass, tdClass, thClass } from "@/components/ui/table";
import { EXPENSE_CATEGORIES } from "@/db/schema";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import {
  currentMonth,
  EXPENSE_CATEGORY_LABEL,
  ringgitToCents,
  today,
} from "../admin-format";

export default function ExpensesPage() {
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(currentMonth());
  const [category, setCategory] = useState("all");
  const [isSalary, setIsSalary] = useState(false);

  const { data: expenses = [], isLoading } = api.expense.list.useQuery({
    month,
  });
  const { data: coaches = [] } = api.coach.list.useQuery();

  const create = api.expense.create.useMutation({
    onSuccess: () => {
      toast.success("Expense recorded.");
      setOpen(false);
      utils.expense.list.invalidate();
      utils.report.dashboard.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const remove = api.expense.delete.useMutation({
    onSuccess: () => {
      toast.success("Expense deleted.");
      utils.expense.list.invalidate();
      utils.report.dashboard.invalidate();
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

  const rows =
    category === "all"
      ? expenses
      : expenses.filter((expense) => expense.category === category);

  const total = rows.reduce((sum, expense) => sum + expense.amountCents, 0);
  const byCategory = EXPENSE_CATEGORIES.map((key) => ({
    key,
    total: expenses
      .filter((expense) => expense.category === key)
      .reduce((sum, expense) => sum + expense.amountCents, 0),
  })).filter((row) => row.total > 0);

  return (
    <>
      <PageHeader eyebrow="Money out" title="Expenses">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            onChange={(e) => setMonth(e.target.value)}
            type="month"
            value={month}
          />
          <Select
            onChange={(e) => setCategory(e.target.value)}
            value={category}
          >
            <option value="all">All categories</option>
            {EXPENSE_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {EXPENSE_CATEGORY_LABEL[value]}
              </option>
            ))}
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button">Add expense</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add expense</DialogTitle>
                <DialogDescription>
                  Coach salary rows carry the coach, so per-coach reporting
                  works without a payroll table.
                </DialogDescription>
              </DialogHeader>
              <form
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  create.mutate({
                    date: String(fd.get("date")),
                    category: String(
                      fd.get("category"),
                    ) as (typeof EXPENSE_CATEGORIES)[number],
                    amountCents: ringgitToCents(fd.get("amount")),
                    coachId: String(fd.get("coachId") ?? "") || undefined,
                    vendor: String(fd.get("vendor") ?? "") || undefined,
                    notes: String(fd.get("notes") ?? "") || undefined,
                  });
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Date">
                    <Input
                      defaultValue={today()}
                      name="date"
                      required
                      type="date"
                    />
                  </Field>
                  <Field label="Amount (RM)">
                    <Input inputMode="decimal" name="amount" required />
                  </Field>
                </div>
                <Field label="Category">
                  <Select
                    defaultValue="rent"
                    name="category"
                    onChange={(e) =>
                      setIsSalary(e.target.value === "coach_salary")
                    }
                  >
                    {EXPENSE_CATEGORIES.map((value) => (
                      <option key={value} value={value}>
                        {EXPENSE_CATEGORY_LABEL[value]}
                      </option>
                    ))}
                  </Select>
                </Field>
                {isSalary ? (
                  <Field label="Coach">
                    <Select defaultValue="" name="coachId">
                      <option value="">Not set</option>
                      {coaches.map((coach) => (
                        <option key={coach.id} value={coach.id}>
                          {coach.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}
                <Field label="Vendor">
                  <Input name="vendor" />
                </Field>
                <Field label="Notes">
                  <Textarea name="notes" />
                </Field>
                <Button disabled={create.isPending} type="submit">
                  {create.isPending ? "Saving…" : "Add expense"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <Card className="mb-6">
        <p className="text-sm font-medium text-stone-500">Total for {month}</p>
        <p className="mt-2 text-3xl font-black tracking-tight">
          {formatCurrency(total)}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {byCategory.map((row) => (
            <Badge key={row.key} tone="gray">
              {EXPENSE_CATEGORY_LABEL[row.key]} {formatCurrency(row.total)}
            </Badge>
          ))}
        </div>
      </Card>

      <TableWrap>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Date</th>
              <th className={thClass}>Category</th>
              <th className={thClass}>Coach</th>
              <th className={thClass}>Vendor</th>
              <th className={thClass}>Amount</th>
              <th className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className={tdClass} colSpan={6}>
                  Nothing recorded for this month.
                </td>
              </tr>
            ) : (
              rows.map((expense) => (
                <tr key={expense.id}>
                  <td className={tdClass}>{expense.date}</td>
                  <td className={tdClass}>
                    {EXPENSE_CATEGORY_LABEL[expense.category]}
                  </td>
                  <td className={tdClass}>{expense.coach?.name ?? "—"}</td>
                  <td className={tdClass}>{expense.vendor ?? "—"}</td>
                  <td className={tdClass}>
                    {formatCurrency(expense.amountCents)}
                  </td>
                  <td className={tdClass}>
                    <button
                      className="text-sm font-semibold text-red-700"
                      onClick={() => remove.mutate({ id: expense.id })}
                      type="button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className={`${tdClass} font-black`} colSpan={4}>
                Total
              </td>
              <td className={`${tdClass} font-black`} colSpan={2}>
                {formatCurrency(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </TableWrap>
    </>
  );
}
