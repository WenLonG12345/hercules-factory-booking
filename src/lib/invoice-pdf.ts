import jsPDF from "jspdf";

export type InvoicePDFData = {
  customerName: string;
  customerPhone: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalCents: number;
  description: string;
  /** Package validity window, printed under the line item when linked. */
  startDate?: string;
  expiryDate?: string;
  /** Stamps the sheet the way the paper invoices are stamped. */
  paid?: boolean;
};

function fmtDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${Number(day)}/${Number(month)}/${year}`;
}

function fmtRM(cents: number): string {
  return `RM ${(cents / 100).toFixed(2)}`;
}

async function loadLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch("/logo.png");
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const NAVY = [18, 36, 76] as const;
const BLACK = [20, 20, 20] as const;
const STAMP_RED = [214, 45, 45] as const;
const W = 210;
const MARGIN = 20;
const RIGHT = W - MARGIN;

/** The rubber stamp: a tilted outlined box with PAID inside it. jsPDF has no
 *  rotated rect, so the four corners are rotated by hand. */
function drawPaidStamp(doc: jsPDF) {
  const cx = 105;
  const cy = 151;
  const halfW = 39;
  const halfH = 17;
  const angle = (-7 * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const corners: [number, number][] = [
    [-halfW, -halfH],
    [halfW, -halfH],
    [halfW, halfH],
    [-halfW, halfH],
  ].map(([x, y]) => [cx + x * cos - y * sin, cy + x * sin + y * cos]);

  doc.setDrawColor(...STAMP_RED);
  doc.setLineWidth(1.4);
  for (let i = 0; i < corners.length; i++) {
    const [x1, y1] = corners[i];
    const [x2, y2] = corners[(i + 1) % corners.length];
    doc.line(x1, y1, x2, y2);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(38);
  doc.setTextColor(...STAMP_RED);
  doc.text("PAID", cx, cy + 5, { align: "center", angle: 7 });
  doc.setTextColor(...BLACK);
  doc.setDrawColor(...BLACK);
}

export async function exportInvoicePDF(data: InvoicePDFData): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logoBase64 = await loadLogoBase64();

  // Header bar — inset to the margins, not full-bleed.
  doc.setFillColor(...NAVY);
  doc.rect(MARGIN, 11, W - MARGIN * 2, 8, "F");

  // Company name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BLACK);
  doc.text("HERCULES FACTORY ENTERPRISE", MARGIN, 34.5);

  // Logo
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", RIGHT - 22, 27, 22, 22);
  }

  // Bill To
  doc.setFontSize(9.5);
  doc.text("BILL TO", MARGIN, 61.5);
  doc.setFont("helvetica", "normal");
  doc.text(data.customerName.toUpperCase(), MARGIN, 67.5);
  doc.text(data.customerPhone, MARGIN, 72.5);

  // Invoice meta (right side)
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE #", 119, 61.5);
  doc.text("INVOICE DATE", 119, 67.5);
  doc.setFont("helvetica", "normal");
  doc.text(data.invoiceNumber, RIGHT, 61.5, { align: "right" });
  doc.text(fmtDate(data.invoiceDate), RIGHT, 67.5, { align: "right" });

  // Separator 1
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, 82, RIGHT, 82);

  // Invoice Total (large)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("Invoice Total", MARGIN, 96.5);
  doc.text(fmtRM(data.totalCents), RIGHT, 96.5, { align: "right" });

  // Separator 2
  doc.line(MARGIN, 105.5, RIGHT, 105.5);

  // Description table header
  doc.setFontSize(9.5);
  doc.text("DESCRIPTION", MARGIN, 118);
  doc.text("AMOUNT", RIGHT, 118, { align: "right" });

  // Line item — printed as written, the way the paper invoices read.
  doc.setFont("helvetica", "normal");
  doc.text(data.description, MARGIN, 127);
  if (data.startDate && data.expiryDate) {
    doc.text(
      `${fmtDate(data.startDate)} to ${fmtDate(data.expiryDate)}`,
      MARGIN,
      132,
    );
  }
  doc.text(fmtRM(data.totalCents), RIGHT, 127, { align: "right" });

  if (data.paid) drawPaidStamp(doc);

  // Terms & Conditions
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("TERMS & CONDITIONS", MARGIN, 252.5);
  doc.setFont("helvetica", "normal");
  doc.text("HERCULES FACTORY ENTERPRISE", MARGIN, 257.5);
  doc.text("HONG LEONG BANK ( Acc no : 201-000-723-92)", MARGIN, 266.5);
  doc.text("OCBC BANK ( Acc no :7901133792)", MARGIN, 271.5);

  // Footer bar
  doc.setFillColor(...NAVY);
  doc.rect(MARGIN, 286, W - MARGIN * 2, 7, "F");

  // HF-YYYY-NNNN-<Name>.pdf — the invoice number already carries the
  // HF-YYYY-NNNN shape; the name is squeezed to filesystem-safe characters.
  const safeName = data.customerName
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, "-");
  doc.save(
    safeName
      ? `${data.invoiceNumber}-${safeName}.pdf`
      : `${data.invoiceNumber}.pdf`,
  );
}
