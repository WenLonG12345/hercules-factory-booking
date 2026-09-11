import Image from "next/image";

/**
 * The navy of the header and footer bars — `NAVY` in `src/lib/invoice-pdf.ts`,
 * written once here so the screen sheet and the printed one cannot drift.
 */
const DOC_NAVY = "#12244c";

/** What the admin has typed so far, in the shape the sheet prints it. */
export type InvoiceDraft = {
  customerName: string;
  customerPhone: string;
  description: string;
  validFrom: string;
  validUntil: string;
  subtotalCents: number;
  discountCents: number;
  issueDate: string;
  paid: boolean;
};

/** `11/9/2026` — the PDF's date, not the locale's. */
const fmtDate = (date: string) => {
  const [year, month, day] = date.split("-");
  return `${Number(day)}/${Number(month)}/${year}`;
};

/** `RM 150.00` — the PDF's money, sen always shown. */
const fmtRM = (cents: number) => `RM ${(cents / 100).toFixed(2)}`;

/**
 * The invoice as it will be printed. This is the PDF from
 * `src/lib/invoice-pdf.ts` redrawn in HTML — same bars, same bands, same
 * blocks, same wording — so what the admin approves here is what the customer
 * receives. Anything that is true of the draft but not of the document (the
 * ledger consequence, a customer being new) belongs on the page around the
 * sheet, never on the sheet.
 *
 * The one thing it cannot know is the number: `nextInvoiceNumber` assigns that
 * on insert.
 */
export function InvoiceDraftPreview({ draft }: { draft: InvoiceDraft }) {
  const totalCents = Math.max(0, draft.subtotalCents - draft.discountCents);

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      {/* Header bar — inset to the margins, not full-bleed, same as the PDF. */}
      <div className="px-5 pt-4 sm:px-6">
        <div className="h-2.5" style={{ backgroundColor: DOC_NAVY }} />
      </div>

      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        {/* Issuer + crest */}
        <div className="flex items-start justify-between gap-3 pt-6">
          <p className="text-[0.8125rem] font-bold uppercase tracking-tight text-stone-950">
            Hercules Factory Enterprise
          </p>
          <Image
            alt=""
            className="size-11 shrink-0"
            height={44}
            src="/logo.png"
            width={44}
          />
        </div>

        {/* Parties — bill-to left, document identity right. */}
        <div className="mt-6 grid grid-cols-2 gap-4 text-[0.8125rem]">
          <div>
            <p className="font-bold uppercase text-stone-950">Bill to</p>
            <p className="mt-1 uppercase text-stone-950">
              {draft.customerName || "—"}
            </p>
            <p className="text-stone-950">{draft.customerPhone || "—"}</p>
          </div>
          <div className="grid gap-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-bold uppercase text-stone-950">
                Invoice #
              </span>
              <span className="text-right tabular-nums text-stone-400">
                On create
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-bold uppercase text-stone-950">
                Invoice date
              </span>
              <span className="text-right tabular-nums text-stone-950">
                {draft.issueDate ? fmtDate(draft.issueDate) : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Rule · total band · rule — the figure is the loudest thing here. */}
        <div className="mt-5 border-t-2 border-stone-950 pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[1.375rem] font-bold tracking-tight text-stone-950 sm:text-2xl">
              Invoice Total
            </p>
            <p className="text-[1.375rem] font-bold tabular-nums tracking-tight text-stone-950 sm:text-2xl">
              {fmtRM(totalCents)}
            </p>
          </div>
        </div>

        {/* Line item table. */}
        <div className="relative mt-4 border-t-2 border-stone-950 pt-5">
          <div className="flex items-baseline justify-between gap-3 text-[0.8125rem] font-bold uppercase text-stone-950">
            <span>Description</span>
            <span>Amount</span>
          </div>
          <div className="mt-3 flex items-start justify-between gap-3 text-[0.8125rem] text-stone-950">
            <div className="min-w-0">
              <p className="break-words">{draft.description || "—"}</p>
              {draft.validFrom && draft.validUntil ? (
                <p className="tabular-nums">
                  {fmtDate(draft.validFrom)} to {fmtDate(draft.validUntil)}
                </p>
              ) : null}
              {/* Not on the PDF — it prints the total and nothing else. Kept on
                  screen so a discount is never applied invisibly. */}
              {draft.discountCents > 0 ? (
                <p className="mt-1 text-xs text-stone-500">
                  {fmtRM(draft.subtotalCents)} less {fmtRM(draft.discountCents)}{" "}
                  discount
                </p>
              ) : null}
            </div>
            <p className="shrink-0 tabular-nums">{fmtRM(totalCents)}</p>
          </div>

          {/* The rubber stamp: tilted, outlined, sitting on the sheet. */}
          {draft.paid ? (
            <p
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-16 mx-auto w-fit -rotate-6 select-none border-4 border-red-600 px-6 py-1.5 text-3xl font-bold uppercase tracking-wide text-red-600"
            >
              Paid
            </p>
          ) : null}

          {/* The empty middle of the paper sheet. */}
          <div className="h-24" />
        </div>

        {/* Terms — the bank details the customer pays into. */}
        <div className="mt-4 text-[0.8125rem] text-stone-950">
          <p className="font-bold uppercase">Terms &amp; conditions</p>
          <p>HERCULES FACTORY ENTERPRISE</p>
          <p className="mt-3">HONG LEONG BANK ( Acc no : 201-000-723-92)</p>
          <p>OCBC BANK ( Acc no :7901133792)</p>
        </div>

        <div className="mt-6 h-2" style={{ backgroundColor: DOC_NAVY }} />
      </div>
    </div>
  );
}
