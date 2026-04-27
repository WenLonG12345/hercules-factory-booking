"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/admin/admin-shell";
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
import { toast } from "sonner";

export default function CustomersPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);

  const { data: customers = [], isLoading } = api.customer.list.useQuery();

  const createCustomer = api.customer.create.useMutation({
    onSuccess: ([customer]) => {
      utils.customer.list.invalidate();
      setOpen(false);
      toast.success("Customer created.");
      router.push(`/admin/customers/${customer.id}`);
    },
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
      <PageHeader eyebrow="CRM" title="Customers">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button">Create customer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create customer</DialogTitle>
              <DialogDescription>
                Add a member profile with WhatsApp contact details and notes.
              </DialogDescription>
            </DialogHeader>
            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                createCustomer.mutate({
                  name: String(fd.get("name") ?? ""),
                  phone: String(fd.get("phone") ?? ""),
                  email: String(fd.get("email") ?? ""),
                  emergencyContact: fd.get("emergencyContact")
                    ? String(fd.get("emergencyContact"))
                    : undefined,
                  notes: fd.get("notes") ? String(fd.get("notes")) : undefined,
                });
              }}
            >
              <Field label="Name">
                <Input name="name" required />
              </Field>
              <Field label="WhatsApp phone">
                <Input name="phone" required />
              </Field>
              <Field label="Email">
                <Input name="email" type="email" />
              </Field>
              <Field label="Emergency contact">
                <Input name="emergencyContact" />
              </Field>
              <Field label="Notes">
                <Textarea name="notes" />
              </Field>
              <Button type="submit" disabled={createCustomer.isPending}>
                Create customer
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
              <th className={thClass}>Email</th>
              <th className={thClass}>Profile</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className={tdClass}>{customer.name}</td>
                <td className={tdClass}>{customer.phone}</td>
                <td className={tdClass}>{customer.email}</td>
                <td className={tdClass}>
                  <Link
                    className="font-semibold text-red-700"
                    href={`/admin/customers/${customer.id}`}
                  >
                    View profile
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
}
