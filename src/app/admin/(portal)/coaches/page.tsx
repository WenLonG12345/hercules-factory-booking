"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/form";
import { TableWrap, tableClass, tdClass, thClass } from "@/components/ui/table";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { currentMonth } from "../admin-format";

export default function CoachesPage() {
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);
  const month = currentMonth();

  const { data: coaches = [], isLoading } = api.coach.list.useQuery();
  const { data: report } = api.report.monthly.useQuery({ month });

  const create = api.coach.create.useMutation({
    onSuccess: () => {
      toast.success("Coach added.");
      setOpen(false);
      utils.coach.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const update = api.coach.update.useMutation({
    onSuccess: () => {
      toast.success("Coach updated.");
      utils.coach.list.invalidate();
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
      <PageHeader eyebrow="Team" title="Coaches">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button">Add coach</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add coach</DialogTitle>
              <DialogDescription>
                Coaches are assigned to sessions and to coach-salary expenses.
              </DialogDescription>
            </DialogHeader>
            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                create.mutate({
                  name: String(fd.get("name")),
                  phone: String(fd.get("phone") ?? "") || undefined,
                  photoUrl: String(fd.get("photoUrl") ?? "") || undefined,
                  bio: String(fd.get("bio") ?? "") || undefined,
                  isActive: true,
                  sortOrder: coaches.length,
                });
              }}
            >
              <Field label="Name">
                <Input name="name" required />
              </Field>
              <Field label="Phone">
                <Input name="phone" />
              </Field>
              <Field label="Photo URL">
                <Input name="photoUrl" placeholder="Uploaded via CMS or R2" />
              </Field>
              <Field label="Bio">
                <Textarea name="bio" />
              </Field>
              <Button disabled={create.isPending} type="submit">
                {create.isPending ? "Saving…" : "Add coach"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <TableWrap>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Name</th>
              <th className={thClass}>Phone</th>
              <th className={thClass}>Sessions ({month})</th>
              <th className={thClass}>Headcount</th>
              <th className={thClass}>Salary paid</th>
              <th className={thClass}>Status</th>
            </tr>
          </thead>
          <tbody>
            {coaches.length === 0 ? (
              <tr>
                <td className={tdClass} colSpan={6}>
                  No coaches yet.
                </td>
              </tr>
            ) : (
              coaches.map((coach) => {
                const stats = report?.perCoach.find(
                  (row) => row.coachId === coach.id,
                );
                return (
                  <tr key={coach.id}>
                    <td className={tdClass}>{coach.name}</td>
                    <td className={tdClass}>{coach.phone ?? "—"}</td>
                    <td className={tdClass}>{stats?.sessionCount ?? 0}</td>
                    <td className={tdClass}>{stats?.headcount ?? 0}</td>
                    <td className={tdClass}>
                      {formatCurrency(stats?.salaryCents ?? 0)}
                    </td>
                    <td className={tdClass}>
                      <button
                        onClick={() =>
                          update.mutate({
                            id: coach.id,
                            name: coach.name,
                            phone: coach.phone ?? undefined,
                            photoUrl: coach.photoUrl ?? undefined,
                            bio: coach.bio ?? undefined,
                            sortOrder: coach.sortOrder,
                            isActive: !coach.isActive,
                          })
                        }
                        type="button"
                      >
                        <Badge tone={coach.isActive ? "green" : "gray"}>
                          {coach.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
}
