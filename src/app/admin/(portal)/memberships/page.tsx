"use client";

import { useState } from "react";
import {
  createPackageAction,
  updatePackageAction,
} from "@/app/admin/(portal)/actions";
import { PageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";

const packageTypeLabel: Record<string, string> = {
  single: "Single class",
  ten_class: "10-class pack",
  unlimited: "Unlimited monthly",
};

export default function MembershipsPage() {
  const utils = api.useUtils();
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: pkgs = [], isLoading } = api.membership.packages.useQuery();

  const refetch = () => utils.membership.packages.invalidate();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 rounded bg-stone-200" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {["a", "b", "c"].map((k) => (
            <div key={k} className="h-48 rounded-xl bg-stone-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Packages" title="Memberships">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button type="button">Add package</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add package</DialogTitle>
            </DialogHeader>
            <form
              className="grid gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                await createPackageAction(new FormData(e.currentTarget));
                refetch();
                setAddOpen(false);
              }}
            >
              <Field label="Name">
                <Input name="name" required />
              </Field>
              <Field label="Type">
                <Select name="type" required>
                  <option value="single">Single class</option>
                  <option value="ten_class">10-class pack</option>
                  <option value="unlimited">Unlimited monthly</option>
                </Select>
              </Field>
              <Field label="Price (RM)">
                <Input
                  name="priceRinggit"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                />
              </Field>
              <Field label="Class credits (blank = unlimited)">
                <Input name="classCredits" type="number" min="1" />
              </Field>
              <Field label="Validity days (blank = no expiry)">
                <Input name="validityDays" type="number" min="1" />
              </Field>
              <Field label="Duration (minutes, blank = not applicable)">
                <Input name="durationMinutes" type="number" min="1" />
              </Field>
              <Field label="Description (optional)">
                <Textarea name="description" rows={3} />
              </Field>
              <Button type="submit">Create package</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {pkgs.map((pkg) => (
          <Card key={pkg.id}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-lg">{pkg.name}</p>
                <p className="text-sm text-stone-500">
                  {packageTypeLabel[pkg.type] ?? pkg.type}
                </p>
              </div>
              <Badge tone={pkg.isActive ? "green" : "gray"}>
                {pkg.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            {pkg.description && (
              <p className="mb-3 text-sm text-stone-600">{pkg.description}</p>
            )}
            <dl className="grid gap-2 text-sm mb-5">
              <div className="flex justify-between">
                <dt className="text-stone-500">Price</dt>
                <dd className="font-semibold">
                  {formatCurrency(pkg.priceCents)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Credits</dt>
                <dd className="font-semibold">
                  {pkg.classCredits ?? "Unlimited"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Validity</dt>
                <dd className="font-semibold">
                  {pkg.validityDays ? `${pkg.validityDays} days` : "No expiry"}
                </dd>
              </div>
              {pkg.durationMinutes && (
                <div className="flex justify-between">
                  <dt className="text-stone-500">Duration</dt>
                  <dd className="font-semibold">{pkg.durationMinutes} min</dd>
                </div>
              )}
            </dl>
            <Dialog
              open={editId === pkg.id}
              onOpenChange={(open) => setEditId(open ? pkg.id : null)}
            >
              <DialogTrigger asChild>
                <Button type="button" variant="quiet">
                  Edit package
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit — {pkg.name}</DialogTitle>
                </DialogHeader>
                <form
                  className="grid gap-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await updatePackageAction(new FormData(e.currentTarget));
                    refetch();
                    setEditId(null);
                  }}
                >
                  <input type="hidden" name="id" value={pkg.id} />
                  <Field label="Name">
                    <Input name="name" defaultValue={pkg.name} required />
                  </Field>
                  <Field label="Price (RM)">
                    <Input
                      name="priceRinggit"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={(pkg.priceCents / 100).toFixed(2)}
                      required
                    />
                  </Field>
                  <Field label="Class credits (blank = unlimited)">
                    <Input
                      name="classCredits"
                      type="number"
                      min="1"
                      defaultValue={pkg.classCredits ?? ""}
                    />
                  </Field>
                  <Field label="Validity days (blank = no expiry)">
                    <Input
                      name="validityDays"
                      type="number"
                      min="1"
                      defaultValue={pkg.validityDays ?? ""}
                    />
                  </Field>
                  <Field label="Duration (minutes, blank = not applicable)">
                    <Input
                      name="durationMinutes"
                      type="number"
                      min="1"
                      defaultValue={pkg.durationMinutes ?? ""}
                    />
                  </Field>
                  <Field label="Description (optional)">
                    <Textarea
                      name="description"
                      rows={3}
                      defaultValue={pkg.description ?? ""}
                    />
                  </Field>
                  <Field label="Status">
                    <Select
                      name="isActive"
                      defaultValue={pkg.isActive ? "true" : "false"}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </Select>
                  </Field>
                  <Button type="submit">Save changes</Button>
                </form>
              </DialogContent>
            </Dialog>
          </Card>
        ))}
      </div>
    </>
  );
}
