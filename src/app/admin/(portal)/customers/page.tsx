import Link from "next/link";
import { createCustomerAction } from "@/app/admin/(portal)/actions";
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
import { getCustomers } from "@/server/services/queries";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <>
      <PageHeader eyebrow="CRM" title="Customers">
        <Dialog>
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
            <form action={createCustomerAction} className="grid gap-4">
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
              <Button type="submit">Create customer</Button>
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
