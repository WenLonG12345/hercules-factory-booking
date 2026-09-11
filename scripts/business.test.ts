/**
 * Self-check for the business rules that move money and credits. Runs against a
 * throwaway SQLite file, so it never touches the real database.
 *   bun run test:business
 */

import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";
import { invoiceRouter } from "@/server/routers/invoice";
import { ledgerRouter } from "@/server/routers/ledger";
import {
  assertSessionHasCapacity,
  BusinessRuleError,
  bookInvoiceIncome,
  nextInvoiceNumber,
  packageStatus,
  recurringDates,
  remainingCredits,
  setAttendance,
  unbookInvoiceIncome,
} from "@/server/services/business";
import { createTRPCRouter } from "@/server/trpc";

const FILE = "./.business-test.db";

async function main() {
  rmSync(FILE, { force: true });
  execSync("npx drizzle-kit migrate", {
    stdio: "ignore",
    env: { ...process.env, TURSO_CONNECTION_URL: `file:${FILE}` },
  });

  const db = drizzle(createClient({ url: `file:${FILE}` }), { schema });
  // biome-ignore lint/suspicious/noExplicitAny: test harness passes the same client the app uses
  const anyDb = db as any;

  const today = new Date().toISOString().slice(0, 10);
  const future = "2099-01-01";
  const past = "2000-01-01";

  // --- pure helpers -----------------------------------------------------------
  assert.equal(remainingCredits({ totalCredits: 10, usedCredits: 6 }), 4);
  assert.equal(remainingCredits({ totalCredits: null, usedCredits: 3 }), null);
  assert.equal(
    packageStatus({ totalCredits: 10, usedCredits: 10, expiryDate: future }),
    "expired",
    "no credits left means expired",
  );
  assert.equal(
    packageStatus({ totalCredits: 10, usedCredits: 1, expiryDate: past }),
    "expired",
    "past expiry means expired",
  );

  // --- recurring sessions -----------------------------------------------------
  // 2026-08-03 is a Monday.
  assert.deepEqual(
    recurringDates("2026-08-03"),
    ["2026-08-03"],
    "no repeat means a single session",
  );
  assert.deepEqual(
    recurringDates("2026-08-03", "2026-08-24"),
    ["2026-08-03", "2026-08-10", "2026-08-17", "2026-08-24"],
    "no repeat days means same weekday every week",
  );
  assert.deepEqual(
    recurringDates("2026-08-03", "2026-08-14", [1, 3, 5]),
    [
      "2026-08-03",
      "2026-08-05",
      "2026-08-07",
      "2026-08-10",
      "2026-08-12",
      "2026-08-14",
    ],
    "Mon/Wed/Fri fills every matching weekday in the range",
  );
  assert.deepEqual(
    recurringDates("2026-08-04", "2026-08-10", [1]),
    ["2026-08-10"],
    "a start date off the repeat days is skipped",
  );
  assert.throws(
    () => recurringDates("2026-08-04", "2026-08-06", [0]),
    BusinessRuleError,
    "a range with no matching weekday is refused",
  );

  // --- fixtures ---------------------------------------------------------------
  const [customer] = await db
    .insert(schema.customers)
    .values({ name: "Test Customer", phone: "60100000001", dateJoined: today })
    .returning();

  const [pkg] = await db
    .insert(schema.customerPackages)
    .values({
      customerId: customer.id,
      type: "credit",
      startDate: today,
      expiryDate: future,
      totalCredits: 2,
      amountPaidCents: 30000,
      paymentMethod: "cash",
    })
    .returning();

  const [session] = await db
    .insert(schema.sessions)
    .values({
      type: "class",
      title: "Test class",
      date: today,
      startTime: "19:00",
      endTime: "20:00",
      capacity: 1,
    })
    .returning();

  const [attendee] = await db
    .insert(schema.sessionAttendees)
    .values({
      sessionId: session.id,
      customerId: customer.id,
      packageId: pkg.id,
    })
    .returning();

  const usedCredits = async () =>
    (
      await db
        .select()
        .from(schema.customerPackages)
        .where(eq(schema.customerPackages.id, pkg.id))
    )[0].usedCredits;

  // --- credit burns only on attendance, exactly once --------------------------
  assert.equal(await usedCredits(), 0, "booking a seat burns nothing");

  await setAttendance(anyDb, attendee.id, "attended");
  assert.equal(await usedCredits(), 1, "attending burns one credit");

  await setAttendance(anyDb, attendee.id, "attended");
  assert.equal(
    await usedCredits(),
    1,
    "re-marking attended does not double-burn",
  );

  await setAttendance(anyDb, attendee.id, "booked");
  assert.equal(await usedCredits(), 0, "un-marking gives the credit back");

  await setAttendance(anyDb, attendee.id, "booked");
  assert.equal(await usedCredits(), 0, "double un-mark cannot mint credits");

  // --- capacity ---------------------------------------------------------------
  await assert.rejects(
    () => assertSessionHasCapacity(anyDb, session.id),
    BusinessRuleError,
    "a full session refuses another attendee",
  );

  // --- expiry blocks check-in -------------------------------------------------
  await db
    .update(schema.customerPackages)
    .set({ expiryDate: past })
    .where(eq(schema.customerPackages.id, pkg.id));

  await assert.rejects(
    () => setAttendance(anyDb, attendee.id, "attended"),
    BusinessRuleError,
    "an expired package cannot be checked in",
  );
  assert.equal(await usedCredits(), 0, "a refused check-in burns nothing");

  // --- invoice numbering ------------------------------------------------------
  const year = new Date().getFullYear();
  assert.equal(await nextInvoiceNumber(anyDb), `HF-${year}-0001`);
  await db.insert(schema.invoices).values({
    invoiceNumber: `HF-${year}-0001`,
    customerId: customer.id,
    subtotalCents: 32000,
    discountCents: 2000,
    totalCents: 30000,
    status: "paid",
    paymentMethod: "cash",
    issueDate: today,
    paidDate: today,
  });
  assert.equal(
    await nextInvoiceNumber(anyDb),
    `HF-${year}-0002`,
    "invoice numbers are sequential within the year",
  );

  // Deleting the newest invoice hands its number straight back: the counter is
  // max(invoice_number), not a stored sequence, so 0002 is issued again.
  const [scratchInvoice] = await db
    .insert(schema.invoices)
    .values({
      invoiceNumber: `HF-${year}-0002`,
      customerId: customer.id,
      subtotalCents: 10000,
      discountCents: 0,
      totalCents: 10000,
      issueDate: today,
    })
    .returning();
  assert.equal(await nextInvoiceNumber(anyDb), `HF-${year}-0003`);
  await db
    .delete(schema.invoices)
    .where(eq(schema.invoices.id, scratchInvoice.id));
  assert.equal(
    await nextInvoiceNumber(anyDb),
    `HF-${year}-0002`,
    "deleting the newest invoice frees its number for the next one",
  );

  // --- the daily ledger -------------------------------------------------------
  const ledger = createTRPCRouter({ ledger: ledgerRouter }).createCaller({
    db: anyDb,
    session: { user: { role: "admin" } },
  } as never);

  const [paidInvoice] = await db
    .insert(schema.invoices)
    .values({
      invoiceNumber: `HF-${year}-0002`,
      customerId: customer.id,
      subtotalCents: 15000,
      discountCents: 0,
      totalCents: 15000,
      status: "paid",
      paymentMethod: "cash",
      issueDate: today,
      paidDate: today,
    })
    .returning();

  const invoiceRows = () =>
    db
      .select()
      .from(schema.ledgerEntries)
      .where(eq(schema.ledgerEntries.invoiceId, paidInvoice.id));

  await bookInvoiceIncome(anyDb, paidInvoice);
  await bookInvoiceIncome(anyDb, paidInvoice);
  assert.equal(
    (await invoiceRows()).length,
    1,
    "marking an invoice paid twice books the income once",
  );

  const [entry] = await invoiceRows();
  await assert.rejects(
    () => ledger.ledger.delete({ id: entry.id }),
    /Invoices page/,
    "invoice-booked rows cannot be edited from the ledger",
  );

  await unbookInvoiceIncome(anyDb, paidInvoice.id);
  assert.equal(
    (await invoiceRows()).length,
    0,
    "un-paying an invoice removes its income row",
  );

  // --- creating an invoice that is already paid -------------------------------
  // The create page collects the payment up front, so `create` has to do what
  // "mark paid" does: issue the invoice paid AND book the income, in one call.
  const invoiceApi = createTRPCRouter({ invoice: invoiceRouter }).createCaller({
    db: anyDb,
    session: { user: { role: "admin" } },
  } as never);

  const ledgerRowsFor = (invoiceId: string) =>
    db
      .select()
      .from(schema.ledgerEntries)
      .where(eq(schema.ledgerEntries.invoiceId, invoiceId));

  const [paidOnCreate] = await invoiceApi.invoice.create({
    // A name instead of an id: the account is opened by this same call.
    newCustomer: { name: "Walk-in Wendy", phone: "0123456789" },
    packageType: "credit",
    totalCredits: 10,
    description: "10 credit package",
    subtotalCents: 30000,
    discountCents: 5000,
    issueDate: today,
    validFrom: today,
    validUntil: future,
    paymentMethod: "cash",
    paidDate: today,
  });

  assert.equal(
    paidOnCreate.status,
    "paid",
    "a payment method on create issues the invoice paid",
  );
  assert.equal(
    paidOnCreate.totalCents,
    25000,
    "total is subtotal minus discount",
  );

  const [bookedOnCreate] = await ledgerRowsFor(paidOnCreate.id);
  assert.equal(
    bookedOnCreate?.amountCents,
    25000,
    "creating a paid invoice books one income row for its total",
  );
  assert.equal(
    bookedOnCreate.date,
    today,
    "the income lands on the date the money came in",
  );

  const [opened] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, paidOnCreate.customerId));
  assert.equal(
    opened?.name,
    "Walk-in Wendy",
    "a typed name opens the customer account with the invoice",
  );

  const [pendingOnCreate] = await invoiceApi.invoice.create({
    customerId: customer.id,
    packageType: "credit",
    totalCredits: 10,
    subtotalCents: 20000,
    discountCents: 0,
    issueDate: today,
    validFrom: today,
    validUntil: future,
  });

  assert.equal(
    pendingOnCreate.status,
    "pending",
    "no payment method on create leaves the invoice pending",
  );
  assert.equal(
    (await ledgerRowsFor(pendingOnCreate.id)).length,
    0,
    "a pending invoice books nothing to the ledger",
  );

  await assert.rejects(
    () =>
      invoiceApi.invoice.create({
        customerId: customer.id,
        newCustomer: { name: "Both At Once" },
        packageType: "credit",
        totalCredits: 10,
        subtotalCents: 10000,
        discountCents: 0,
        issueDate: today,
        validFrom: today,
        validUntil: future,
      }),
    /existing customer or give a name/,
    "an invoice takes a customer id or a new name, never both",
  );

  const categories = await ledger.ledger.categories.list();
  const rent = categories.find((row) => row.name === "Rent");
  assert.ok(rent, "the migration seeds the starter categories");

  await assert.rejects(
    () =>
      ledger.ledger.create({
        date: today,
        direction: "income",
        categoryId: rent.id,
        amountCents: 100,
      }),
    /is an expense category/,
    "an expense category cannot hold income",
  );

  await ledger.ledger.create({
    date: today,
    direction: "expense",
    categoryId: rent.id,
    amountCents: 45000,
  });
  await assert.rejects(
    () => ledger.ledger.categories.delete({ id: rent.id }),
    /Archive it instead/,
    "a category in use is archived, never deleted",
  );

  const salary = categories.find((row) => row.slug === "coach_salary");
  assert.ok(salary);
  await assert.rejects(
    () => ledger.ledger.categories.delete({ id: salary.id }),
    /Rename it instead/,
    "categories the app looks up by slug cannot be deleted",
  );

  rmSync(FILE, { force: true });
  console.log("business rules self-check passed");
}

main().catch((err) => {
  rmSync(FILE, { force: true });
  console.error(err);
  process.exit(1);
});
