"use client";

import { FileDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { RiWhatsappLine } from "react-icons/ri";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, Select } from "@/components/ui/form";
import { TableWrap, tableClass, tdClass, thClass } from "@/components/ui/table";
import { useModal } from "@/hooks/use-modal";
import { exportInvoicePDF } from "@/lib/invoice-pdf";
import { api } from "@/lib/trpc";
import { formatCurrency, whatsappLink } from "@/lib/utils";

export default function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const utils = api.useUtils();
  const [startDate] = useState(() => new Date().toISOString().slice(0, 10));

  const addMembershipModal = useModal();
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [newExpiry, setNewExpiry] = useState("");

  const { data: profile, isLoading: profileLoading } =
    api.customer.profile.useQuery({ id });
  const { data: packages = [], isLoading: pkgsLoading } =
    api.membership.packages.useQuery();

  const createMembership = api.membership.create.useMutation({
    onSuccess: () => {
      toast.success("Membership activated.");
      utils.customer.profile.invalidate({ id });
      addMembershipModal.onClose();
    },
  });

  const updateMembership = api.membership.update.useMutation({
    onSuccess: () => {
      toast.success("Expiry date updated.");
      utils.customer.profile.invalidate({ id });
      setExtendingId(null);
    },
  });

  const deleteCustomer = api.customer.delete.useMutation({
    onSuccess: () => {
      utils.customer.list.invalidate();
      toast.success("Customer deleted.");
      router.push("/admin/customers");
    },
  });

  if (profileLoading || pkgsLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-56 rounded bg-stone-200" />
        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <div className="h-64 rounded-xl bg-stone-200" />
          <div className="h-64 rounded-xl bg-stone-200" />
        </div>
      </div>
    );
  }

  if (!profile?.customer) {
    return <p className="text-sm text-stone-500">Customer not found.</p>;
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
            <Button
              type="button"
              variant="quiet"
              className="mt-5"
              disabled={deleteCustomer.isPending}
              onClick={() => deleteCustomer.mutate({ id: customer.id })}
            >
              Delete customer
            </Button>
          </Card>

          <Button onClick={addMembershipModal.onOpen}>Add membership</Button>
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
                    Expires {membership.expiryDate ?? "N/A"} · Credits{" "}
                    {membership.remainingCredits ?? "Unlimited"}
                  </p>
                  <Button
                    type="button"
                    variant="quiet"
                    className="mt-3"
                    onClick={() => {
                      setExtendingId(membership.id);
                      setNewExpiry(membership.expiryDate ?? "");
                    }}
                  >
                    Extend expiry
                  </Button>
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
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {profile.invoices.map((invoice) => {
                  const membership = profile.memberships.find(
                    (m) => m.id === invoice.membershipId,
                  );
                  return (
                    <tr key={invoice.id}>
                      <td className={tdClass}>
                        <span className="font-mono text-xs">
                          {invoice.invoiceNumber}
                        </span>
                      </td>
                      <td className={tdClass}>
                        <Badge
                          tone={
                            invoice.status === "paid"
                              ? "green"
                              : invoice.status === "pending"
                                ? "amber"
                                : "gray"
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className={tdClass}>
                        {formatCurrency(invoice.totalCents)}
                      </td>
                      <td className={tdClass}>
                        <span className="text-xs text-stone-500">
                          {invoice.issueDate}
                        </span>
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-3">
                          <a
                            href={whatsappLink(
                              customer.phone,
                              `Hi ${customer.name}, your Hercules Factory invoice ${invoice.invoiceNumber} is ${formatCurrency(invoice.totalCents)}.`,
                            )}
                            rel="noreferrer"
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                          >
                            <RiWhatsappLine className="size-3.5" />
                            Send
                          </a>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-900 cursor-pointer"
                            onClick={() =>
                              exportInvoicePDF({
                                customerName: customer.name,
                                customerPhone: customer.phone,
                                invoiceNumber: invoice.invoiceNumber,
                                invoiceDate: invoice.issueDate,
                                totalCents: invoice.totalCents,
                                description:
                                  invoice.notes ??
                                  membership?.package?.name ??
                                  "Membership",
                                dateRange:
                                  membership?.startDate && membership.expiryDate
                                    ? `${membership.startDate} TO ${membership.expiryDate}`
                                    : undefined,
                              })
                            }
                          >
                            <FileDown className="size-3.5" />
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Add membership modal */}
      <Dialog
        open={addMembershipModal.open}
        onOpenChange={(v) => !v && addMembershipModal.onClose()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add membership</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              createMembership.mutate({
                customerId: customer.id,
                packageId: String(fd.get("packageId") ?? ""),
                startDate: String(fd.get("startDate") ?? ""),
              });
            }}
          >
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
                defaultValue={startDate}
              />
            </Field>
            <Button type="submit" disabled={createMembership.isPending}>
              Activate package
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Extend expiry modal */}
      <Dialog
        open={!!extendingId}
        onOpenChange={(v) => !v && setExtendingId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend expiry date</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="New expiry date">
              <input
                className="h-11 rounded-md border border-stone-200 px-3"
                type="date"
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
              />
            </Field>
            <Button
              type="button"
              disabled={!newExpiry || updateMembership.isPending}
              onClick={() => {
                if (!extendingId || !newExpiry) return;
                updateMembership.mutate({
                  id: extendingId,
                  expiryDate: newExpiry,
                  status: "active",
                });
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
