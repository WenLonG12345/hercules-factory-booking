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

const NAVY = [13, 27, 63] as const;
const BLACK = [20, 20, 20] as const;
const W = 210;
const MARGIN = 20;

export async function exportInvoicePDF(data: InvoicePDFData): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logoBase64 = await loadLogoBase64();

  // Header bar
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 14, "F");

  // Company name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BLACK);
  doc.text("HERCULES FACTORY ENTERPRISE", MARGIN, 30);

  // Logo
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", W - MARGIN - 24, 16, 24, 24);
  }

  // Bill To
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("BILL TO", MARGIN, 52);
  doc.setFont("helvetica", "normal");
  doc.text(data.customerName.toUpperCase(), MARGIN, 58);
  doc.text(data.customerPhone, MARGIN, 63);

  // Invoice meta (right side)
  const rightX = W - MARGIN;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("INVOICE #", 120, 52);
  doc.text("INVOICE DATE", 120, 58);
  doc.setFont("helvetica", "normal");
  doc.text(data.invoiceNumber, rightX, 52, { align: "right" });
  doc.text(fmtDate(data.invoiceDate), rightX, 58, { align: "right" });

  // Separator 1
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, 72, W - MARGIN, 72);

  // Invoice Total (large)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("Invoice Total", MARGIN, 88);
  doc.text(fmtRM(data.totalCents), rightX, 88, { align: "right" });

  // Separator 2
  doc.setLineWidth(0.6);
  doc.line(MARGIN, 95, W - MARGIN, 95);

  // Description table header
  doc.setFontSize(9);
  doc.text("DESCRIPTION", MARGIN, 105);
  doc.text("AMOUNT", rightX, 105, { align: "right" });

  // Line item
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(data.description.toUpperCase(), MARGIN, 113);
  if (data.startDate && data.expiryDate) {
    doc.setTextColor(90, 90, 90);
    doc.text(
      `Valid ${fmtDate(data.startDate)} - ${fmtDate(data.expiryDate)}`,
      MARGIN,
      119,
    );
    doc.setTextColor(...BLACK);
  }
  doc.text(fmtRM(data.totalCents), rightX, 113, { align: "right" });

  // Terms & Conditions
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("TERMS & CONDITIONS", MARGIN, 245);
  doc.setFont("helvetica", "normal");
  doc.text("HERCULES FACTORY ENTERPRISE", MARGIN, 252);
  doc.text("HONG LEONG BANK ( Acc no : 201-000-723-92)", MARGIN, 258);
  doc.text("OCBC BANK ( Acc no :7901133792)", MARGIN, 264);

  // Footer bar
  doc.setFillColor(...NAVY);
  doc.rect(0, 277, W, 20, "F");

  doc.save(`invoice-${data.invoiceNumber}.pdf`);
}
