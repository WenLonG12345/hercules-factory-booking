/**
 * One-off importer for the client's existing spreadsheet. Export each sheet as
 * CSV, then:
 *
 *   bun run db:import -- --dir ./import --dry-run
 *   bun run db:import -- --dir ./import
 *
 * Expected files (any that are missing are skipped):
 *   customers.csv  name, phone, age, gender, emergency_contact, date_joined, source, notes
 *   packages.csv   phone, type, start_date, expiry_date, total_credits, used_credits, amount_paid, payment_method
 *   invoices.csv   invoice_number, phone, description, subtotal, discount, status, payment_method, issue_date, paid_date
 *   expenses.csv   date, category, amount, vendor, notes
 *
 * Dates are assumed DD/MM/YY or DD/MM/YYYY (the client's format); YYYY-MM-DD
 * also parses. Rows that cannot be parsed are written to import-errors.csv
 * rather than silently zeroed. Re-running does not duplicate anything.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import {
  CUSTOMER_SOURCES,
  customerPackages,
  customers,
  EXPENSE_CATEGORIES,
  expenses,
  invoices,
  PACKAGE_TYPES,
  PAYMENT_METHODS,
} from "@/db/schema";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const dir = args[args.indexOf("--dir") + 1] ?? "./import";

// Lazy so importing the parsers (see import-excel.test.ts) opens no database.
const connect = () =>
  drizzle(
    createClient({
      url: process.env.TURSO_CONNECTION_URL ?? "file:./local.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    }),
  );

const errors: string[][] = [["file", "row", "reason", "raw"]];

/** Minimal RFC-4180 reader — quoted fields, embedded commas and newlines. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += char;
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [header = [], ...body] = rows;
  const keys = header.map((key) =>
    key.trim().toLowerCase().replace(/\s+/g, "_"),
  );

  return body
    .filter((cells) => cells.some((cell) => cell.trim()))
    .map((cells) =>
      Object.fromEntries(keys.map((key, i) => [key, (cells[i] ?? "").trim()])),
    );
}

function readSheet(name: string) {
  const path = join(dir, `${name}.csv`);
  if (!existsSync(path)) {
    console.log(`- ${name}.csv not found, skipping`);
    return [];
  }
  return parseCsv(readFileSync(path, "utf8"));
}

/** DD/MM/YY, DD/MM/YYYY or YYYY-MM-DD → YYYY-MM-DD. Null when unparseable. */
export function toDate(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!match) return null;

  const [, d, m, y] = match;
  const year = y.length === 2 ? `20${y}` : y;
  const month = m.padStart(2, "0");
  const day = d.padStart(2, "0");
  if (Number(month) > 12 || Number(day) > 31) return null;
  return `${year}-${month}-${day}`;
}

/** "RM 350.00" / "350" → cents. Null when unparseable, never a silent zero. */
export function toCents(value: string): number | null {
  const cleaned = value.replace(/[^\d.-]/g, "");
  if (!cleaned) return null;
  const amount = Number(cleaned);
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100);
}

export function normalisePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("60")) return digits;
  if (digits.startsWith("0")) return `6${digits}`;
  return digits ? `60${digits}` : "";
}

function matchEnum<T extends readonly string[]>(
  value: string,
  options: T,
): T[number] | null {
  const key = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return (options as readonly string[]).includes(key)
    ? (key as T[number])
    : null;
}

function fail(file: string, index: number, reason: string, raw: unknown) {
  errors.push([file, String(index + 2), reason, JSON.stringify(raw)]);
}

async function main() {
  console.log(`Importing from ${dir}${dryRun ? " (dry run)" : ""}\n`);
  const db = connect();

  // 1. Customers — deduped on phone.
  const customerRows = readSheet("customers");
  const phoneToId = new Map<string, string>();

  for (const row of await db.select().from(customers)) {
    phoneToId.set(row.phone, row.id);
  }

  let created = 0;
  for (const [index, row] of customerRows.entries()) {
    const phone = normalisePhone(row.phone ?? "");
    const name = row.name?.trim();
    if (!phone || !name) {
      fail("customers", index, "missing name or phone", row);
      continue;
    }
    if (phoneToId.has(phone)) continue;

    const age = row.age ? Number(row.age) : undefined;
    const values = {
      name,
      phone,
      age: Number.isFinite(age) ? age : undefined,
      gender: matchEnum(row.gender ?? "", ["male", "female", "other"] as const),
      emergencyContact: row.emergency_contact || undefined,
      dateJoined:
        toDate(row.date_joined ?? "") ?? new Date().toISOString().slice(0, 10),
      source: matchEnum(row.source ?? "", CUSTOMER_SOURCES),
      notes: row.notes || undefined,
    };

    if (!dryRun) {
      const [inserted] = await db.insert(customers).values(values).returning();
      phoneToId.set(phone, inserted.id);
    } else {
      phoneToId.set(phone, `dry-${index}`);
    }
    created++;
  }
  console.log(`customers: ${created} new, ${customerRows.length} rows read`);

  // 2. Packages.
  const packageRows = readSheet("packages");
  let packagesCreated = 0;
  for (const [index, row] of packageRows.entries()) {
    const customerId = phoneToId.get(normalisePhone(row.phone ?? ""));
    const type = matchEnum(row.type ?? "", PACKAGE_TYPES);
    const startDate = toDate(row.start_date ?? "");
    const expiryDate = toDate(row.expiry_date ?? "");
    const amountPaidCents = toCents(row.amount_paid ?? "0");

    if (
      !customerId ||
      !type ||
      !startDate ||
      !expiryDate ||
      amountPaidCents === null
    ) {
      fail("packages", index, "unresolved customer, type, date or amount", row);
      continue;
    }

    if (!dryRun) {
      await db.insert(customerPackages).values({
        customerId,
        type,
        startDate,
        expiryDate,
        totalCredits:
          type === "unlimited" ? null : Number(row.total_credits || 10),
        usedCredits: Number(row.used_credits || 0),
        amountPaidCents,
        paymentMethod: matchEnum(row.payment_method ?? "", PAYMENT_METHODS),
      });
    }
    packagesCreated++;
  }
  console.log(`packages: ${packagesCreated} imported`);

  // 3. Invoices — historical paid rows keep their paid date so past months'
  //    reports are correct from day one.
  const invoiceRows = readSheet("invoices");
  const existingNumbers = new Set(
    (await db.select({ n: invoices.invoiceNumber }).from(invoices)).map(
      (row) => row.n,
    ),
  );
  let invoicesCreated = 0;
  for (const [index, row] of invoiceRows.entries()) {
    const customerId = phoneToId.get(normalisePhone(row.phone ?? ""));
    const subtotalCents = toCents(row.subtotal ?? "");
    const discountCents = toCents(row.discount ?? "0") ?? 0;
    const issueDate = toDate(row.issue_date ?? "");
    const number = row.invoice_number?.trim();

    if (!customerId || subtotalCents === null || !issueDate || !number) {
      fail(
        "invoices",
        index,
        "unresolved customer, amount, date or number",
        row,
      );
      continue;
    }
    if (existingNumbers.has(number)) continue;

    const paidDate = toDate(row.paid_date ?? "");
    const status = paidDate
      ? "paid"
      : row.status?.toLowerCase() === "paid"
        ? "paid"
        : "pending";

    if (!dryRun) {
      await db.insert(invoices).values({
        invoiceNumber: number,
        customerId,
        description: row.description || undefined,
        subtotalCents,
        discountCents,
        totalCents: subtotalCents - discountCents,
        status,
        paymentMethod: matchEnum(row.payment_method ?? "", PAYMENT_METHODS),
        issueDate,
        paidDate: status === "paid" ? (paidDate ?? issueDate) : null,
      });
    }
    existingNumbers.add(number);
    invoicesCreated++;
  }
  console.log(`invoices: ${invoicesCreated} imported`);

  // 4. Expenses.
  const expenseRows = readSheet("expenses");
  let expensesCreated = 0;
  for (const [index, row] of expenseRows.entries()) {
    const date = toDate(row.date ?? "");
    const amountCents = toCents(row.amount ?? "");
    const category =
      matchEnum(row.category ?? "", EXPENSE_CATEGORIES) ?? "other";

    if (!date || amountCents === null) {
      fail("expenses", index, "unparseable date or amount", row);
      continue;
    }

    if (!dryRun) {
      await db.insert(expenses).values({
        date,
        category,
        amountCents,
        vendor: row.vendor || undefined,
        notes: row.notes || undefined,
      });
    }
    expensesCreated++;
  }
  console.log(`expenses: ${expensesCreated} imported`);

  if (errors.length > 1) {
    const path = join(dir, "import-errors.csv");
    writeFileSync(
      path,
      errors
        .map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
        .join("\n"),
    );
    console.log(`\n⚠️  ${errors.length - 1} rows rejected → ${path}`);
  }

  console.log(dryRun ? "\nDry run — nothing written." : "\nImport complete.");
}

if (process.argv[1]?.endsWith("import-excel.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
