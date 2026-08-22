import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PACKAGE_TYPE_LABEL } from "@/app/admin/(portal)/admin-format";
import { formatDate, whatsappLink } from "@/lib/utils";
import { getPublicInvoice } from "@/server/services/queries";
import { DownloadPDFButton } from "./download-pdf-button";

// The status can change between two loads of the same link, so this one is
// never cached — a customer refreshing after paying has to see "paid".
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invoice | Hercules Factory",
  // A link handed to one customer has no business in a search index.
  robots: { index: false, follow: false },
};

/** The rubber stamp, not a badge: rotated, outlined, sitting on the sheet. */
const STATUS = {
  paid: { label: "Paid", className: "stamp-paid" },
  pending: { label: "Unpaid", className: "stamp-unpaid" },
  cancelled: { label: "Void", className: "stamp-void" },
} as const;

/** A document shows the sen. The shared `formatCurrency` drops them, which is
 *  right in a dense admin table and wrong on an invoice. Same shape the PDF
 *  prints. */
const money = (cents: number) => `RM ${(cents / 100).toFixed(2)}`;

const BANKS = [
  ["Hong Leong Bank", "201-000-723-92"],
  ["OCBC Bank", "7901133792"],
] as const;

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-hairline border-t px-0 py-4 sm:border-t-0 sm:border-l sm:px-5 sm:first:border-l-0 sm:first:pl-0">
      <dt className="font-black text-[0.6875rem] text-ink-dim uppercase tracking-[0.18em]">
        {label}
      </dt>
      <dd className="mt-2 font-semibold tabular-nums">{children}</dd>
    </div>
  );
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPublicInvoice(id);
  if (!data) notFound();

  const { invoice, whatsappPhone } = data;
  const status = STATUS[invoice.status];
  const description =
    invoice.description ??
    (invoice.package
      ? `${PACKAGE_TYPE_LABEL[invoice.package.type]} package`
      : "Membership");
  // A linked package carries the real dates; a hand-written invoice carries
  // its own validity window instead.
  const validFrom = invoice.package?.startDate ?? invoice.validFrom;
  const validUntil = invoice.package?.expiryDate ?? invoice.validUntil;
  // The figure never stands alone — the line beside it says what it means.
  const qualifier =
    invoice.status === "paid"
      ? `Settled in full${invoice.paidDate ? ` on ${formatDate(invoice.paidDate)}` : ""}. Keep this page as your receipt.`
      : invoice.status === "cancelled"
        ? "This invoice was cancelled. Nothing is owed."
        : `Payable to Hercules Factory Enterprise${invoice.dueDate ? ` by ${formatDate(invoice.dueDate)}` : ""}. Bank details are at the foot of this page.`;

  return (
    <main className="doc-ground px-4 py-8 md:py-16">
      <article className="doc-sheet mx-auto max-w-3xl px-6 py-10 sm:px-10 md:px-14 md:py-14">
        {/* Masthead — issuer left, document identity right. */}
        <header className="flex flex-wrap items-start justify-between gap-6 border-ink border-b-2 pb-6">
          <div className="flex items-center gap-3">
            <Image
              alt=""
              className="size-12 shrink-0"
              height={48}
              src="/logo.png"
              width={48}
            />
            <div>
              <p className="display text-(length:--text-h3) leading-[1.05]">
                Hercules Factory
              </p>
              <p className="mt-1 font-semibold text-ink-dim text-xs uppercase tracking-[0.2em]">
                Enterprise
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="font-black text-[0.6875rem] text-ink-dim uppercase tracking-[0.24em]">
              Invoice
            </p>
            <p className="mt-1 font-black text-(length:--text-h3) tabular-nums leading-none">
              {invoice.invoiceNumber}
            </p>
          </div>
        </header>

        {/* The amount is the page. Stamp sits beside it, not above it. */}
        <section className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6 pt-10">
          <div className="min-w-0">
            <p className="font-black text-[0.6875rem] text-ink-dim uppercase tracking-[0.24em]">
              {invoice.status === "paid" ? "Amount paid" : "Amount due"}
            </p>
            <p className="display mt-3 text-(length:--text-price) tabular-nums leading-[1.02]">
              {money(invoice.totalCents)}
            </p>
          </div>
          <p className={`stamp ${status.className}`}>{status.label}</p>
        </section>

        <p className="mt-5 max-w-[52ch] text-(length:--text-body) text-ink-dim">
          {qualifier}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3 print:hidden">
          <DownloadPDFButton
            invoice={{
              customerName: invoice.customer?.name ?? "",
              customerPhone: invoice.customer?.phone ?? "",
              invoiceNumber: invoice.invoiceNumber,
              invoiceDate: invoice.issueDate,
              totalCents: invoice.totalCents,
              description,
              startDate: validFrom ?? undefined,
              expiryDate: validUntil ?? undefined,
            }}
          />
          {whatsappPhone ? (
            <a
              className="cta cta-quiet cta-sm"
              href={whatsappLink(
                whatsappPhone,
                invoice.status === "pending"
                  ? `Hi! Here is my payment for invoice ${invoice.invoiceNumber}.`
                  : `Hi! I have a question about invoice ${invoice.invoiceNumber}.`,
              )}
              rel="noreferrer"
              target="_blank"
            >
              {invoice.status === "pending" ? "Send receipt" : "WhatsApp us"}
            </a>
          ) : null}
        </div>

        {/* Parties and dates — the ruled block every invoice carries. */}
        <dl className="mt-12 grid border-ink border-t-2 pt-1 sm:grid-cols-3">
          <Meta label="Billed to">
            {invoice.customer?.name}
            <span className="mt-1 block font-normal text-ink-dim">
              {invoice.customer?.phone}
            </span>
          </Meta>
          <Meta label="Issued">{formatDate(invoice.issueDate)}</Meta>
          <Meta label={invoice.status === "paid" ? "Paid" : "Due"}>
            {invoice.status === "paid"
              ? invoice.paidDate
                ? formatDate(invoice.paidDate)
                : "—"
              : invoice.dueDate
                ? formatDate(invoice.dueDate)
                : "On receipt"}
          </Meta>
        </dl>

        {/* Line-item ledger. */}
        <table className="mt-12 w-full border-collapse text-left">
          <thead>
            <tr className="border-ink border-b-2">
              <th className="pb-3 font-black text-[0.6875rem] text-ink-dim uppercase tracking-[0.18em]">
                Description
              </th>
              <th className="pb-3 text-right font-black text-[0.6875rem] text-ink-dim uppercase tracking-[0.18em]">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-hairline border-b">
              <td className="py-5 pr-6 align-top">
                {description}
                {validFrom && validUntil ? (
                  <span className="mt-1 block text-ink-dim text-sm tabular-nums">
                    Valid {formatDate(validFrom)} – {formatDate(validUntil)}
                  </span>
                ) : null}
              </td>
              <td className="py-5 text-right align-top tabular-nums">
                {money(invoice.subtotalCents)}
              </td>
            </tr>
            {invoice.discountCents > 0 ? (
              <tr className="border-hairline border-b text-ink-dim">
                <td className="py-5 pr-6">Discount</td>
                <td className="py-5 text-right tabular-nums">
                  −{money(invoice.discountCents)}
                </td>
              </tr>
            ) : null}
          </tbody>
          <tfoot>
            <tr>
              <th className="pt-5 text-left font-black text-sm uppercase tracking-[0.14em]">
                Total
              </th>
              <td className="display pt-5 text-right text-(length:--text-h3) tabular-nums">
                {money(invoice.totalCents)}
              </td>
            </tr>
          </tfoot>
        </table>

        {invoice.notes ? (
          <p className="mt-8 max-w-[60ch] text-(length:--text-body) text-ink-dim">
            {invoice.notes}
          </p>
        ) : null}

        {/* Terms — always printed on the document, not only when unpaid. */}
        <section className="mt-12 border-ink border-t-2 pt-6">
          <h2 className="font-black text-[0.6875rem] text-ink-dim uppercase tracking-[0.24em]">
            {invoice.status === "pending" ? "How to pay" : "Payment details"}
          </h2>
          <dl className="mt-4 grid gap-2 sm:max-w-md">
            {BANKS.map(([bank, account]) => (
              <div className="flex justify-between gap-6" key={account}>
                <dt className="text-ink-dim">{bank}</dt>
                <dd className="font-semibold tabular-nums">{account}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 max-w-[60ch] text-ink-dim text-sm">
            Account name: Hercules Factory Enterprise.
            {invoice.status === "pending"
              ? " Send us the transfer receipt on WhatsApp once it is done."
              : ""}
          </p>
        </section>

        <footer className="mt-10 border-hairline border-t pt-5 text-ink-dim text-xs">
          Computer-generated invoice — valid without a signature.
        </footer>
      </article>
    </main>
  );
}
