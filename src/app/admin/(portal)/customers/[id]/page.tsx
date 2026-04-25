import { notFound } from "next/navigation";
import {
  createMembershipAction,
  deleteCustomerAction,
} from "@/app/admin/(portal)/actions";
import { PageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/form";
import { TableWrap, tableClass, tdClass, thClass } from "@/components/ui/table";
import { formatCurrency, whatsappLink } from "@/lib/utils";
import { getCustomerProfile, getPackages } from "@/server/services/queries";

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [profile, packages] = await Promise.all([
    getCustomerProfile(id),
    getPackages(),
  ]);

  if (!profile.customer) {
    notFound();
  }

  const customer = profile.customer;

  return (
    <>
      <PageHeader eyebrow="Customer profile" title={customer.name}>
        <a
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
          href={whatsappLink(
            customer.phone,
            `Hi ${customer.name}, this is Hercules Factory.`,
          )}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp
        </a>
      </PageHeader>
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="grid gap-6">
          <Card>
            <h2 className="mb-4 text-lg font-black">Details</h2>
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-stone-500">Phone</dt>
                <dd className="font-semibold">{customer.phone}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Email</dt>
                <dd className="font-semibold">{customer.email}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Notes</dt>
                <dd>{customer.notes}</dd>
              </div>
            </dl>
            <form action={deleteCustomerAction} className="mt-5">
              <input name="id" type="hidden" value={customer.id} />
              <Button type="submit" variant="quiet">
                Delete customer
              </Button>
            </form>
          </Card>
          <Card>
            <h2 className="mb-4 text-lg font-black">Add membership</h2>
            <form action={createMembershipAction} className="grid gap-4">
              <input name="customerId" type="hidden" value={customer.id} />
              <Field label="Package">
                <Select name="packageId">
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - {formatCurrency(pkg.priceCents)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Start date">
                <input
                  className="h-11 rounded-md border border-stone-200 px-3"
                  name="startDate"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </Field>
              <Button type="submit">Activate package</Button>
            </form>
          </Card>
        </div>
        <div className="grid gap-6">
          <Card>
            <h2 className="mb-4 text-lg font-black">Membership status</h2>
            <div className="grid gap-3">
              {profile.memberships.map((membership) => (
                <div
                  className="rounded-md border border-stone-200 p-4"
                  key={membership.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black">{membership.package?.name}</p>
                    <Badge
                      tone={membership.status === "active" ? "green" : "gray"}
                    >
                      {membership.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-stone-600">
                    Expires {membership.expiryDate ?? "N/A"} - Credits{" "}
                    {membership.remainingCredits ?? "Unlimited"}
                  </p>
                </div>
              ))}
            </div>
          </Card>
          <TableWrap>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Invoice</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Amount</th>
                  <th className={thClass}>Due</th>
                </tr>
              </thead>
              <tbody>
                {profile.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className={tdClass}>{invoice.invoiceNumber}</td>
                    <td className={tdClass}>{invoice.status}</td>
                    <td className={tdClass}>
                      {formatCurrency(invoice.totalCents)}
                    </td>
                    <td className={tdClass}>{invoice.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          <Card>
            <h2 className="mb-4 text-lg font-black">
              Attendance history ({profile.attendanceHistory.length})
            </h2>
            {profile.attendanceHistory.length === 0 ? (
              <p className="text-sm text-stone-500">No check-ins yet.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {profile.attendanceHistory.map((record) => (
                  <li
                    key={record.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {record.classSession?.sessionDate}{" "}
                        {record.classSession?.startTime}
                      </p>
                      <p className="text-stone-500">
                        {record.classSession?.title}
                      </p>
                    </div>
                    <Badge tone={record.creditDeducted ? "amber" : "gray"}>
                      {record.creditDeducted ? "1 credit used" : "no credit"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
