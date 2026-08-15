"use client";

import Link from "next/link";
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
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { TableWrap, tableClass, tdClass, thClass } from "@/components/ui/table";
import { CUSTOMER_SOURCES, GENDERS } from "@/db/schema";
import { api } from "@/lib/trpc";
import { whatsappLink } from "@/lib/utils";
import { SOURCE_LABEL, today } from "../admin-format";

export default function CustomersPage() {
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: customers = [], isLoading } = api.customer.list.useQuery();

  const createCustomer = api.customer.create.useMutation({
    onSuccess: () => {
      utils.customer.list.invalidate();
      setOpen(false);
      toast.success("Customer created.");
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

  const term = search.trim().toLowerCase();
  const rows = term
    ? customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(term) ||
          customer.phone.includes(term),
      )
    : customers;

  return (
    <>
      <PageHeader eyebrow="CRM" title="Customers">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="w-56"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or phone"
            value={search}
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button">Create customer</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create customer</DialogTitle>
                <DialogDescription>
                  Where they came from matters — the source feeds the monthly
                  report.
                </DialogDescription>
              </DialogHeader>
              <form
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const age = String(fd.get("age") ?? "");
                  createCustomer.mutate({
                    name: String(fd.get("name")),
                    phone: String(fd.get("phone")),
                    age: age ? Number(age) : undefined,
                    gender:
                      (String(fd.get("gender")) as
                        | (typeof GENDERS)[number]
                        | "") || undefined,
                    emergencyContact:
                      String(fd.get("emergencyContact") ?? "") || undefined,
                    dateJoined: String(fd.get("dateJoined")),
                    source:
                      (String(fd.get("source")) as
                        | (typeof CUSTOMER_SOURCES)[number]
                        | "") || undefined,
                    notes: String(fd.get("notes") ?? "") || undefined,
                  });
                }}
              >
                <Field label="Name">
                  <Input name="name" required />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="WhatsApp phone">
                    <Input name="phone" required />
                  </Field>
                  <Field label="Age">
                    <Input name="age" type="number" min={3} max={100} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Gender">
                    <Select name="gender" defaultValue="">
                      <option value="">Not set</option>
                      {GENDERS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Date joined">
                    <Input
                      defaultValue={today()}
                      name="dateJoined"
                      required
                      type="date"
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Emergency contact">
                    <Input name="emergencyContact" />
                  </Field>
                  <Field label="Source">
                    <Select name="source" defaultValue="">
                      <option value="">Not set</option>
                      {CUSTOMER_SOURCES.map((value) => (
                        <option key={value} value={value}>
                          {SOURCE_LABEL[value]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label="Notes">
                  <Textarea name="notes" />
                </Field>
                <Button disabled={createCustomer.isPending} type="submit">
                  {createCustomer.isPending ? "Saving…" : "Create customer"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>
      <TableWrap>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Name</th>
              <th className={thClass}>Phone</th>
              <th className={thClass}>Age</th>
              <th className={thClass}>Joined</th>
              <th className={thClass}>Source</th>
              <th className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className={tdClass} colSpan={6}>
                  No customers found.
                </td>
              </tr>
            ) : (
              rows.map((customer) => (
                <tr key={customer.id}>
                  <td className={tdClass}>
                    <Link
                      className="font-semibold text-red-700"
                      href={`/admin/customers/${customer.id}`}
                    >
                      {customer.name}
                    </Link>
                  </td>
                  <td className={tdClass}>{customer.phone}</td>
                  <td className={tdClass}>{customer.age ?? "—"}</td>
                  <td className={tdClass}>{customer.dateJoined}</td>
                  <td className={tdClass}>
                    {customer.source ? (
                      <Badge tone="gray">{SOURCE_LABEL[customer.source]}</Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={tdClass}>
                    <a
                      className="font-semibold text-emerald-700"
                      href={whatsappLink(
                        customer.phone,
                        `Hi ${customer.name}, this is Hercules Factory 👊`,
                      )}
                      rel="noreferrer"
                      target="_blank"
                    >
                      WhatsApp
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
}
