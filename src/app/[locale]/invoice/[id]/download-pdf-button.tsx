"use client";

import { useState } from "react";
import { exportInvoicePDF, type InvoicePDFData } from "@/lib/invoice-pdf";

/** The customer's own copy — same PDF the admin sends, generated in the
 *  browser so the link stays a plain page with no server route behind it. */
export function DownloadPDFButton({ invoice }: { invoice: InvoicePDFData }) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      className="cta cta-quiet cta-sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await exportInvoicePDF(invoice);
        } finally {
          setBusy(false);
        }
      }}
      type="button"
    >
      {busy ? "Preparing…" : "Download PDF"}
    </button>
  );
}
