import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PACKAGE_TYPE_LABEL } from "@/app/admin/(portal)/admin-format";
import { formatCurrency, formatDate, whatsappLink } from "@/lib/utils";
import { getPublicInvoice } from "@/server/services/queries";

// The status can change between two loads of the same link, so this one is
// never cached — a customer refreshing after paying has to see "paid".
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invoice | Hercules Factory",
  // A link handed to one customer has no business in a search index.
  robots: { index: false, follow: false },
};

const STATUS = {
  paid: { label: "PAID", className: "bg-accent text-accent-ink" },
  pending: {
    label: "UNPAID",
    className: "border-2 border-ink text-ink",
  },
  cancelled: {
    label: "CANCELLED",
    className: "border-2 border-hairline text-ink-dim",
  },
} as const;

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

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 md:py-24">
      <header className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="font-black text-accent text-xs uppercase tracking-[0.24em]">
            Hercules Factory Enterprise
          </p>
          <h1 className="display mt-3 text-(length:--text-h2)">Invoice</h1>
          <p className="mt-2 font-black text-(length:--text-body) tabular-nums text-ink-dim">
            {invoice.invoiceNumber}
          </p>
        </div>
        <Image
          alt=""
          className="size-16 shrink-0 rounded-md"
          height={64}
          src="/logo.png"
          width={64}
        />
      </header>

      <p
        className={`mt-8 inline-flex px-3 py-1.5 font-black text-xs uppercase tracking-[0.24em] ${status.className}`}
      >
        {status.label}
        {invoice.paidDate ? ` · ${formatDate(invoice.paidDate)}` : ""}
      </p>

      <dl className="mt-10 grid gap-6 border-ink border-t-2 pt-6 sm:grid-cols-3">
        <div>
          <dt className="font-black text-xs uppercase tracking-[0.16em] text-ink-dim">
            Billed to
          </dt>
          <dd className="mt-2 font-semibold">{invoice.customer?.name}</dd>
          <dd className="text-ink-dim">{invoice.customer?.phone}</dd>
        </div>
        <div>
          <dt className="font-black text-xs uppercase tracking-[0.16em] text-ink-dim">
            Issued
          </dt>
          <dd className="mt-2 tabular-nums">{formatDate(invoice.issueDate)}</dd>
        </div>
        {invoice.dueDate ? (
          <div>
            <dt className="font-black text-xs uppercase tracking-[0.16em] text-ink-dim">
              Due
            </dt>
            <dd className="mt-2 tabular-nums">{formatDate(invoice.dueDate)}</dd>
          </div>
        ) : null}
      </dl>

      <ul className="mt-12 border-ink border-t-2">
        <li className="flex items-baseline justify-between gap-6 border-hairline border-b py-5">
          <span className="min-w-0">{description}</span>
          <span className="shrink-0 tabular-nums">
            {formatCurrency(invoice.subtotalCents)}
          </span>
        </li>
        {invoice.discountCents > 0 ? (
          <li className="flex items-baseline justify-between gap-6 border-hairline border-b py-5 text-ink-dim">
            <span>Discount</span>
            <span className="shrink-0 tabular-nums">
              −{formatCurrency(invoice.discountCents)}
            </span>
          </li>
        ) : null}
        <li className="flex items-baseline justify-between gap-6 py-6">
          <span className="display text-(length:--text-h3)">Total</span>
          <span className="display text-(length:--text-h2) tabular-nums">
            {formatCurrency(invoice.totalCents)}
          </span>
        </li>
      </ul>

      {invoice.notes ? (
        <p className="mt-2 text-(length:--text-body) text-ink-dim">
          {invoice.notes}
        </p>
      ) : null}

      {invoice.status === "pending" ? (
        <section className="mt-12 border-2 border-ink border-t-[6px] border-t-accent bg-paper-2 p-6">
          <h2 className="display text-(length:--text-h3)">How to pay</h2>
          <dl className="mt-4 grid gap-2 text-(length:--text-body)">
            <div className="flex flex-wrap justify-between gap-x-6">
              <dt className="text-ink-dim">Hong Leong Bank</dt>
              <dd className="tabular-nums">201-000-723-92</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-x-6">
              <dt className="text-ink-dim">OCBC Bank</dt>
              <dd className="tabular-nums">7901133792</dd>
            </div>
          </dl>
          <p className="mt-4 text-(length:--text-body) text-ink-dim">
            Account name: Hercules Factory Enterprise. Send us the transfer
            receipt on WhatsApp once it is done.
          </p>
        </section>
      ) : null}

      {whatsappPhone ? (
        <a
          className="cta mt-10"
          href={whatsappLink(
            whatsappPhone,
            `Hi! I have a question about invoice ${invoice.invoiceNumber}.`,
          )}
          rel="noreferrer"
          target="_blank"
        >
          {invoice.status === "pending" ? "Send payment proof" : "WhatsApp us"}
        </a>
      ) : null}
    </main>
  );
}
