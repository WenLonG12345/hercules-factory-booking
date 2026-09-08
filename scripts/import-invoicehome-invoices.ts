/**
 * One-off: migrates the 567 paid invoices from the old InvoiceHome account
 * (docs/invoices.pdf, the "My Reports" print-out) into this database.
 *
 *   bun run db:import-invoices -- --dry-run
 *   bun run db:import-invoices
 *
 * Each invoice becomes three rows, the same three the admin UI would create by
 * selling a package and marking its invoice paid:
 *
 *   customer_packages   (only when the price maps to a known package)
 *   invoices            paid, HF-<year>-<old number>, old dates kept
 *   ledger_entries      one Package Sale income row, booked on the paid date
 *
 * Customers are already in the database (scripts/parse-invoicehome.mjs), so
 * rows are matched to them by name — no customer is created here.
 *
 * Re-running is safe: an invoice number already in the database is skipped.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import type { Db } from "@/db";
import * as schema from "@/db/schema";
import { customerPackages, customers, invoices } from "@/db/schema";
import { bookInvoiceIncome } from "@/server/services/business";

const dryRun = process.argv.includes("--dry-run");
const PDF = "docs/invoices.pdf";
const TEXT_CACHE = "import/invoices.txt";
const REVIEW = "import/invoices-review.csv";

// --- the price list the gym sold from, keyed by the invoice's list price -----
// Amounts the client confirmed; everything else is a one-off "special package"
// whose terms nobody recorded, so it books the money and skips the package row.
type Term = {
  label: string;
  type: "credit" | "unlimited";
  credits: number | null;
  /** Validity, as the client describes it: one calendar month, or N days. */
  months?: number;
  days?: number;
};

const TERMS: Record<number, Term> = {
  7200: { label: "4-Class Pass", type: "credit", credits: 4, months: 1 },
  7500: {
    label: "4-Class Pass (4-week special offer)",
    type: "credit",
    credits: 4,
    days: 28,
  },
  14400: { label: "8-Class Pass", type: "credit", credits: 8, months: 1 },
  15000: { label: "10-Class Pass", type: "credit", credits: 10, months: 1 },
  18000: {
    label: "Merdeka Promo 2025 Unlimited",
    type: "unlimited",
    credits: null,
    months: 1,
  },
  22000: {
    label: "Unlimited Pass",
    type: "unlimited",
    credits: null,
    months: 1,
  },
  26000: {
    label: "Merdeka Promo Unlimited Pass with Glove",
    type: "unlimited",
    credits: null,
    months: 1,
  },
  44000: {
    label: "CNY Buy 2 Free 1 Promo Unlimited",
    type: "unlimited",
    credits: null,
    months: 1,
  },
};

const SPECIAL = "Special package (legacy, terms not recorded)";

// --- PDF text ---------------------------------------------------------------

/**
 * PDFKit through the system `swift` — the machine has no poppler, and this runs
 * once. The extracted text is cached so a re-run needs neither.
 */
function pdfText() {
  if (existsSync(TEXT_CACHE)) return readFileSync(TEXT_CACHE, "utf8");

  const source = join(tmpdir(), "pdf-text.swift");
  writeFileSync(
    source,
    `import Foundation
import PDFKit
let doc = PDFDocument(url: URL(fileURLWithPath: CommandLine.arguments[1]))!
for i in 0..<doc.pageCount {
  print("=== PAGE \\(i + 1) ===")
  print(doc.page(at: i)?.string ?? "")
}
`,
  );
  const run = spawnSync("swift", [source, PDF], { encoding: "utf8" });
  if (run.status !== 0) throw new Error(`swift failed: ${run.stderr}`);
  writeFileSync(TEXT_CACHE, run.stdout);
  return run.stdout;
}

// --- name matching ----------------------------------------------------------

const norm = (s: string) => s.toLowerCase().replace(/[^0-9a-z一-鿿]+/g, "");
/** Sorted characters — the print-out sometimes emits a wrapped name's pieces
 *  out of order ("ALAM" "旦" "O 李" for "ALAMO 李旦"). */
const anagram = (s: string) => [...norm(s)].sort().join("");

/** Every name the old system could print, pointing at the customer row here. */
function nameIndex(rows: { id: string; name: string }[]) {
  const exact = new Map<string, string>();
  const byAnagram = new Map<string, Set<string>>();
  const add = (key: string, id: string) => {
    if (!key) return;
    if (!exact.has(key)) exact.set(key, id);
    const set = byAnagram.get(anagram(key)) ?? new Set<string>();
    byAnagram.set(anagram(key), set.add(id));
  };

  for (const row of rows) {
    add(norm(row.name), row.id);
    // Some names carry the identifier the gym typed after a comma
    // ("CHI WAH , HIN CHENG, 011-3315 8525"); invoices print only the name.
    add(norm(row.name.replace(/,[^,]*$/, "")), row.id);
  }

  // The customer import merged duplicates ("李旦" into "ALAMO 李旦"), but
  // invoices still carry the short name — map those back.
  for (const file of readdirSync("docs/customer").filter((f) =>
    /^page\d+\.html$/.test(f),
  )) {
    const html = readFileSync(join("docs/customer", file), "utf8");
    for (const cell of html.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)) {
      const text = cell[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim();
      const name = norm(text.replace(/,[^,]*$/, ""));
      if (!name || exact.has(name)) continue;
      const contained = rows.filter((row) => norm(row.name).includes(name));
      if (contained.length === 1) add(name, contained[0].id);
    }
  }

  return (fragments: string) => {
    const key = norm(fragments);
    const hit = exact.get(key);
    if (hit) return hit;
    const ids = byAnagram.get(anagram(fragments));
    return ids?.size === 1 ? [...ids][0] : null;
  };
}

// --- row parsing ------------------------------------------------------------

/** "Invoice 543 27/08/2026 04/08/2026 150.00 0.00 150.00 150.00 MYR" —
 *  columns are number, issue date, paid date, optional due date, then
 *  subtotal / tax / total / paid. The three rows where total ≠ paid are real
 *  discounts, so both numbers are kept. */
const ROW =
  /^(.*?)Invoice (\d+) (\d{2}\/\d{2}\/\d{4}) (\d{2}\/\d{2}\/\d{4})\s*(?:\d{2}\/\d{2}\/\d{4})?\s*([\d,]+\.\d\d) [\d,]+\.\d\d ([\d,]+\.\d\d) ([\d,]+\.\d\d) MYR/;
const NOISE =
  /^(9\/8\/26,|https:\/\/|∑|Customer Docu|ment Nu|mber Date|Amount Total|P\.O\.#|Paid$|[\d,]+\.\d\d )/;

const cents = (s: string) => Math.round(Number(s.replace(/,/g, "")) * 100);
const iso = (ddmmyyyy: string) => ddmmyyyy.split("/").reverse().join("-"); // DD/MM/YYYY -> YYYY-MM-DD

type Row = {
  number: string;
  issueDate: string;
  paidDate: string;
  listCents: number;
  paidCents: number;
  customerId: string;
};

/**
 * A wrapped name is printed as several lines around its own row, so the page's
 * name fragments are split between its rows by trying every partition and
 * keeping the one where each group is a customer we know.
 */
function parse(text: string, lookup: (s: string) => string | null) {
  const out: Row[] = [];
  const unresolved: string[][] = [];

  for (const page of text.split("=== PAGE ").slice(1)) {
    const fragments: string[] = [];
    const rows: Omit<Row, "customerId">[] = [];

    for (const raw of page.split("\n").slice(1)) {
      const line = raw.trim();
      if (!line || NOISE.test(line)) continue;
      const match = ROW.exec(line);
      if (!match) {
        fragments.push(line);
        continue;
      }
      if (match[1].trim()) fragments.push(match[1].trim());
      rows.push({
        number: match[2],
        issueDate: iso(match[3]),
        paidDate: iso(match[4]),
        listCents: cents(match[6]),
        paidCents: cents(match[7]),
      });
    }

    const memo = new Map<string, string[] | null>();
    const solve = (from: number, row: number): string[] | null => {
      if (row === rows.length) return from === fragments.length ? [] : null;
      const key = `${from}:${row}`;
      if (memo.has(key)) return memo.get(key) ?? null;
      let answer: string[] | null = null;
      for (
        let take = 1;
        from + take <= fragments.length && take <= 10;
        take++
      ) {
        const id = lookup(fragments.slice(from, from + take).join(""));
        if (!id) continue;
        const rest = solve(from + take, row + 1);
        if (rest) {
          answer = [id, ...rest];
          break;
        }
      }
      memo.set(key, answer);
      return answer;
    };

    const names = solve(0, 0);
    if (!names) {
      unresolved.push(fragments);
      continue;
    }
    for (const [i, row] of rows.entries())
      out.push({ ...row, customerId: names[i] });
  }

  return { rows: out, unresolved };
}

// --- dates ------------------------------------------------------------------

/** One calendar month on, clamped ("31/01" + 1 month = 28 or 29 February). */
function addMonths(date: string, months: number) {
  const [y, m, d] = date.split("-").map(Number);
  const end = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0),
  ).getUTCDate();
  end.setUTCDate(Math.min(d, lastDay));
  return end.toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const at = new Date(`${date}T00:00:00Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return at.toISOString().slice(0, 10);
}

// --- import -----------------------------------------------------------------

async function main() {
  const db = drizzle(
    createClient({
      url: process.env.TURSO_CONNECTION_URL ?? "file:./local.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    }),
    { schema },
  ) as unknown as Db;

  const people = await db
    .select({ id: customers.id, name: customers.name })
    .from(customers);
  const byId = new Map(people.map((p) => [p.id, p.name]));
  const { rows, unresolved } = parse(pdfText(), nameIndex(people));

  console.log(`${rows.length} invoices read from ${PDF}`);
  if (unresolved.length) {
    console.log(`⚠️  ${unresolved.length} page(s) unmatched:`);
    for (const page of unresolved) console.log(`   ${page.join(" | ")}`);
  }

  const taken = new Set(
    (await db.select({ n: invoices.invoiceNumber }).from(invoices)).map(
      (row) => row.n,
    ),
  );

  // The app numbers invoices HF-YYYY-NNNN, so the old number keeps its identity
  // and the next generated number carries on from the highest imported one.
  // ponytail: invoice 033 exists twice in the old system; the second keeps the
  // number with a suffix. Number("0033-2") is NaN, which would break
  // nextInvoiceNumber — but only for the 2024 prefix, which it never asks for.
  const seen = new Set<string>();
  const numberFor = (row: Row) => {
    const base = `HF-${row.paidDate.slice(0, 4)}-${row.number.padStart(4, "0")}`;
    let number = base;
    for (let n = 2; seen.has(number); n++) number = `${base}-${n}`;
    seen.add(number);
    return number;
  };

  const review: string[][] = [
    [
      "invoice_number",
      "old_number",
      "customer",
      "issue_date",
      "paid_date",
      "list",
      "paid",
      "package",
      "expiry",
    ],
  ];
  let imported = 0;
  let skipped = 0;
  let packages = 0;
  let moneyCents = 0;

  for (const row of rows.sort((a, b) => Number(a.number) - Number(b.number))) {
    const number = numberFor(row);
    if (taken.has(number)) {
      skipped++;
      continue;
    }
    const term = TERMS[row.listCents];
    const expiry = term
      ? term.days
        ? addDays(row.paidDate, term.days)
        : addMonths(row.paidDate, term.months ?? 1)
      : null;

    review.push([
      number,
      row.number,
      byId.get(row.customerId) ?? "?",
      row.issueDate,
      row.paidDate,
      (row.listCents / 100).toFixed(2),
      (row.paidCents / 100).toFixed(2),
      term?.label ?? SPECIAL,
      expiry ?? "",
    ]);

    moneyCents += row.paidCents;
    if (dryRun) {
      imported++;
      if (term) packages++;
      continue;
    }

    let packageId: string | null = null;
    if (term && expiry) {
      const [pkg] = await db
        .insert(customerPackages)
        .values({
          customerId: row.customerId,
          type: term.type,
          startDate: row.paidDate,
          expiryDate: expiry,
          totalCredits: term.credits,
          amountPaidCents: row.paidCents,
          paymentMethod: "cash",
          notes: `${term.label} · InvoiceHome #${row.number}`,
        })
        .returning();
      packageId = pkg.id;
      packages++;
    }

    const [invoice] = await db
      .insert(invoices)
      .values({
        invoiceNumber: number,
        customerId: row.customerId,
        packageId,
        description: term?.label ?? SPECIAL,
        subtotalCents: row.listCents,
        discountCents: row.listCents - row.paidCents,
        totalCents: row.paidCents,
        status: "paid",
        paymentMethod: "cash",
        issueDate: row.issueDate,
        paidDate: row.paidDate,
        validFrom: expiry ? row.paidDate : null,
        validUntil: expiry,
        notes: `Imported from InvoiceHome #${row.number}`,
      })
      .returning();

    await bookInvoiceIncome(db, invoice);
    imported++;
  }

  writeFileSync(
    REVIEW,
    review
      .map((line) => line.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
      .join("\n"),
  );

  const money = moneyCents / 100;
  console.log(
    `${imported} invoices, ${packages} packages, ${skipped} already present` +
      `\nRM ${money.toLocaleString("en-MY", { minimumFractionDigits: 2 })} booked as Package Sale income` +
      `\nreview → ${REVIEW}`,
  );
  console.log(dryRun ? "\nDry run — nothing written." : "\nImport complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
