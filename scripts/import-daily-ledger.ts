/**
 * One-off: loads the gym's hand-kept daily income/expense book
 * (Hercules_Factory_DailyAcc.pdf, transcribed to import/daily-acc.txt) into
 * `ledger_entries`.
 *
 *   bun run db:import-ledger -- --dry-run
 *   bun run db:import-ledger
 *
 * Package sales are SKIPPED: the same money is already in the ledger, booked by
 * the InvoiceHome invoice import (one Package Sale row per paid invoice). What
 * the ledger is missing — and what this brings in — is the counter trade
 * (per-entry, drinks, merchandise) and every expense.
 *
 * Re-running is safe: a row whose date + amount + notes already exists is
 * skipped.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import type { Db } from "@/db";
import * as schema from "@/db/schema";
import { ledgerCategories, ledgerEntries } from "@/db/schema";

const dryRun = process.argv.includes("--dry-run");
const SOURCE = "import/daily-acc.txt";

/**
 * The book's own category words → the ledger categories this app ships with.
 * `null` means "already booked by an invoice" — the package sales.
 */
const CATEGORIES: Record<string, string | null> = {
  "10 Credit": null,
  "8 Credit": null,
  "6 Credit": null,
  "4 Credit": null,
  "Unlimited Pass": null,
  "Merdeka Promo": null,
  "CNY PROMO": null,
  PT: null,
  "KID CLASS": null,
  "Per Entry": "Per Entry",
  "Soft Drink": "Drinks",
  "Mineral Water": "Drinks",
  "Hand Wrap": "Merchandise",
  Mouthguard: "Merchandise",
  "Shin Guard": "Merchandise",
  "T-shirt": "Merchandise",
  TIRAMISU: "Merchandise",
  UNIFI: "Utilities",
  TNB: "Utilities",
  "AIR SELANGOR": "Utilities",
  RESTOCK: "Restock",
  "HOME INVOICE": "Other Expense",
  OTHERS: "Other Expense",
};

/** Not in DEFAULT_LEDGER_CATEGORIES — retail stock the gym resells. */
const NEW_CATEGORIES = [
  { name: "Restock", direction: "expense" as const, sortOrder: 90 },
];

type Row = {
  date: string;
  direction: "income" | "expense";
  source: string;
  amountCents: number;
  notes: string;
};

export function parse(text: string): Row[] {
  return text
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line, i) => {
      const [date, direction, source, amount, ...rest] = line.split("|");
      const cents = Math.round(Number(amount) * 100);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? ""))
        throw new Error(`${SOURCE} line ${i + 1}: bad date "${date}"`);
      if (direction !== "income" && direction !== "expense")
        throw new Error(
          `${SOURCE} line ${i + 1}: bad direction "${direction}"`,
        );
      if (!Number.isFinite(cents) || cents <= 0)
        throw new Error(`${SOURCE} line ${i + 1}: bad amount "${amount}"`);
      if (!(source in CATEGORIES))
        throw new Error(
          `${SOURCE} line ${i + 1}: unknown category "${source}"`,
        );
      return {
        date,
        direction,
        source,
        amountCents: cents,
        notes: rest.join("|").trim(),
      };
    });
}

async function main() {
  const db = drizzle(
    createClient({
      url: process.env.TURSO_CONNECTION_URL ?? "file:./local.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    }),
    { schema },
  ) as unknown as Db;

  const rows = parse(readFileSync(SOURCE, "utf8"));
  const wanted = rows.filter((r) => CATEGORIES[r.source] !== null);
  console.log(
    `${rows.length} rows read, ${rows.length - wanted.length} package sales skipped (already booked by the invoice import)`,
  );

  const categories = new Map(
    (
      await db
        .select({
          id: ledgerCategories.id,
          name: ledgerCategories.name,
          direction: ledgerCategories.direction,
        })
        .from(ledgerCategories)
    ).map((c) => [`${c.direction}:${c.name}`, c.id]),
  );

  for (const c of NEW_CATEGORIES) {
    if (categories.has(`${c.direction}:${c.name}`)) continue;
    if (dryRun) {
      console.log(`would create ${c.direction} category "${c.name}"`);
      categories.set(`${c.direction}:${c.name}`, "dry-run");
      continue;
    }
    const [created] = await db.insert(ledgerCategories).values(c).returning();
    categories.set(`${c.direction}:${c.name}`, created.id);
    console.log(`created ${c.direction} category "${c.name}"`);
  }

  const existing = new Set(
    (
      await db
        .select({
          date: ledgerEntries.date,
          amountCents: ledgerEntries.amountCents,
          notes: ledgerEntries.notes,
        })
        .from(ledgerEntries)
    ).map((e) => `${e.date}|${e.amountCents}|${e.notes ?? ""}`),
  );

  const values: (typeof ledgerEntries.$inferInsert)[] = [];
  let skipped = 0;
  const totals = { income: 0, expense: 0 };

  for (const row of wanted) {
    const name = CATEGORIES[row.source] as string;
    const categoryId = categories.get(`${row.direction}:${name}`);
    if (!categoryId)
      throw new Error(`no ${row.direction} category named "${name}"`);
    if (existing.has(`${row.date}|${row.amountCents}|${row.notes}`)) {
      skipped++;
      continue;
    }
    totals[row.direction] += row.amountCents;
    values.push({
      date: row.date,
      direction: row.direction,
      categoryId,
      amountCents: row.amountCents,
      notes: row.notes,
    });
  }

  if (!dryRun && values.length) {
    // ponytail: 100 at a time, libSQL caps a statement's variables.
    for (let i = 0; i < values.length; i += 100)
      await db.insert(ledgerEntries).values(values.slice(i, i + 100));
  }

  console.log(
    `${dryRun ? "would import" : "imported"} ${values.length} rows` +
      ` (income RM${(totals.income / 100).toFixed(2)}, expense RM${(totals.expense / 100).toFixed(2)})` +
      `, ${skipped} already present`,
  );
  if (dryRun) console.log("dry run — nothing written");
}

if (process.argv[1]?.endsWith("import-daily-ledger.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
