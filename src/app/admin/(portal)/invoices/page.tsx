import {
  createInvoiceAction,
  recordPaymentAction,
} from "@/app/admin/(portal)/actions";
import { PageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { TableWrap, tableClass, tdClass, thClass } from "@/components/ui/table";
import { formatCurrency, whatsappLink } from "@/lib/utils";
import { getCustomers, getInvoices } from "@/server/services/queries";

export default async function InvoicesPage() {
  const [invoices, customers] = await Promise.all([
    getInvoices(),
    getCustomers(),
  ]);

  return (
    <>
      <PageHeader eyebrow="Payments" title="Invoices" />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="grid gap-6">
          <Card>
            <h2 className="mb-4 text-lg font-black">Create invoice</h2>
            <form action={createInvoiceAction} className="grid gap-4">
              <Field label="Customer">
                <Select name="customerId">
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Amount in cents">
                <Input defaultValue="15000" name="totalCents" type="number" />
              </Field>
              <input name="subtotalCents" type="hidden" value="15000" />
              <Field label="Due date">
                <Input name="dueDate" type="date" />
              </Field>
              <Field label="Notes">
                <Textarea name="notes" />
              </Field>
              <Button type="submit">Create invoice</Button>
            </form>
          </Card>
          <Card>
            <h2 className="mb-4 text-lg font-black">Record payment</h2>
            <form action={recordPaymentAction} className="grid gap-4">
              <Field label="Invoice">
                <Select name="invoiceId">
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNumber} - {invoice.customer?.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Customer">
                <Select name="customerId">
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Amount in cents">
                <Input defaultValue="15000" name="amountCents" type="number" />
              </Field>
              <Field label="Method">
                <Select name="method">
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="tng">Touch 'n Go</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
              <Field label="Paid date">
                <Input
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  name="paidDate"
                  type="date"
                />
              </Field>
              <Field label="Reference">
                <Input name="reference" />
              </Field>
              <Button type="submit">Record payment</Button>
            </form>
          </Card>
        </div>
        <TableWrap>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Invoice</th>
                <th className={thClass}>Customer</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Amount</th>
                <th className={thClass}>WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className={tdClass}>{invoice.invoiceNumber}</td>
                  <td className={tdClass}>{invoice.customer?.name}</td>
                  <td className={tdClass}>
                    <Badge tone={invoice.status === "paid" ? "green" : "amber"}>
                      {invoice.status}
                    </Badge>
                  </td>
                  <td className={tdClass}>
                    {formatCurrency(invoice.totalCents)}
                  </td>
                  <td className={tdClass}>
                    {invoice.customer ? (
                      <a
                        className="font-semibold text-emerald-700"
                        href={whatsappLink(
                          invoice.customer.phone,
                          `Hi ${invoice.customer.name}, your Hercules Factory invoice ${invoice.invoiceNumber} is ${formatCurrency(invoice.totalCents)}.`,
                        )}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Send invoice
                      </a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </div>
    </>
  );
}
