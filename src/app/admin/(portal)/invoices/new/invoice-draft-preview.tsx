import Image from "next/image";

/**
 * The navy of the header and footer bars — `NAVY` in `src/lib/invoice-pdf.ts`,
 * written once here so the screen sheet and the printed one cannot drift.
 */
const DOC_NAVY = "#12244c";

/**
 * One printed line — a package line carries its window under the words. The
 * window is there whenever the line sells a package, even with both ends still
 * unsettled; an end that is not set yet prints as TBC.
 */
export type InvoiceLine = {
  description: string;
  amountCents: number;
  window?: { from: string | null; until: string | null };
};

/** What the admin has typed so far, in the shape the sheet prints it. */
export type InvoiceDraft = {
  customerName: string;
  customerPhone: string;
  items: InvoiceLine[];
  discountCents: number;
  issueDate: string;
  paid: boolean;
};

/** `11/9/2026` — the PDF's date, not the locale's. */
const fmtDate = (date: string) => {
  const [year, month, day] = date.split("-");
  return `${Number(day)}/${Number(month)}/${year}`;
};

/** `11/9/2026 to 10/10/2026`, with TBC for an end not settled yet. */
const fmtWindow = (w: { from: string | null; until: string | null }) =>
  `${w.from ? fmtDate(w.from) : "TBC"} to ${w.until ? fmtDate(w.until) : "TBC"}`;

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
  const subtotalCents = draft.items.reduce(
    (sum, item) => sum + item.amountCents,
    0,
  );
  const totalCents = Math.max(0, subtotalCents - draft.discountCents);

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

        {/* Line item table. */}
        <div className="mt-5 border-t-2 border-stone-950 pt-5">
          <div className="flex items-baseline justify-between gap-3 text-[0.8125rem] font-bold uppercase text-stone-950">
            <span>Description</span>
            <span>Amount</span>
          </div>
          <div className="mt-3 grid gap-3 text-[0.8125rem] text-stone-950">
            {draft.items.map((item, index) => (
              <div
                className="flex items-start justify-between gap-3"
                // Lines have no identity of their own on the sheet; the
                // position is what the document prints.
                key={`${index}-${item.description}`}
              >
                <div className="min-w-0">
                  <p className="break-words">{item.description || "—"}</p>
                  {item.window ? (
                    <p className="tabular-nums">{fmtWindow(item.window)}</p>
                  ) : null}
                </div>
                <p className="shrink-0 tabular-nums">
                  {fmtRM(item.amountCents)}
                </p>
              </div>
            ))}
            {draft.discountCents > 0 ? (
              <div className="flex items-start justify-between gap-3 text-stone-500">
                <p>Discount</p>
                <p className="shrink-0 tabular-nums">
                  -{fmtRM(draft.discountCents)}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Rule · total band — the figure closes the lines, ahead of the terms. */}
        <div className="mt-5 border-t-2 border-stone-950 pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-base font-bold tracking-tight text-stone-950 sm:text-lg">
              Invoice Total
            </p>
            <p className="text-base font-bold tabular-nums tracking-tight text-stone-950 sm:text-lg">
              {fmtRM(totalCents)}
            </p>
          </div>
        </div>

        {/* The empty middle of the paper sheet — the stamp sits in its bottom
            right corner, clear of every figure above. */}
        <div className="flex h-24 items-end justify-end">
          {draft.paid ? (
            <p
              aria-hidden
              className="pointer-events-none mr-2 mb-1 w-fit -rotate-6 select-none border-4 border-red-600 px-6 py-1.5 text-3xl font-bold uppercase tracking-wide text-red-600"
            >
              Paid
            </p>
          ) : null}
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
