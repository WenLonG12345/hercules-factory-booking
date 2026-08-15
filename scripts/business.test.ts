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
import {
  assertSessionHasCapacity,
  BusinessRuleError,
  nextInvoiceNumber,
  packageStatus,
  recurringDates,
  remainingCredits,
  setAttendance,
} from "@/server/services/business";

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

  rmSync(FILE, { force: true });
  console.log("business rules self-check passed");
}

main().catch((err) => {
  rmSync(FILE, { force: true });
  console.error(err);
  process.exit(1);
});
