import { and, count, eq, ne, sql } from "drizzle-orm";
import type { Db } from "@/db";
import {
  customerPackages,
  invoices,
  LEDGER_SYSTEM_CATEGORIES,
  ledgerCategories,
  ledgerEntries,
  sessionAttendees,
  sessions,
} from "@/db/schema";
import { toDateInputValue } from "@/lib/utils";

export class BusinessRuleError extends Error {}

/** Remaining credits. Never stored — always derived. */
export function remainingCredits(pkg: {
  totalCredits: number | null;
  usedCredits: number;
}) {
  if (pkg.totalCredits === null) return null; // unlimited
  return pkg.totalCredits - pkg.usedCredits;
}

export function packageStatus(
  pkg: { totalCredits: number | null; usedCredits: number; expiryDate: string },
  today = toDateInputValue(new Date()),
) {
  if (pkg.expiryDate < today) return "expired" as const;
  const left = remainingCredits(pkg);
  if (left !== null && left <= 0) return "expired" as const;
  return "active" as const;
}

/**
 * A trial is a one-seat session plus its single roster row. Shared by
 * `trial.book` and `customer.create`, so booking a trial for a brand-new
 * customer writes exactly the same rows as booking one for an existing one.
 */
export async function bookTrialSession(
  db: Db,
  input: {
    customerId: string;
    date: string;
    startTime: string;
    endTime: string;
    coachId?: string;
    notes?: string;
  },
) {
  const [session] = await db
    .insert(sessions)
    .values({
      type: "trial",
      title: "Trial class",
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      capacity: 1,
      coachId: input.coachId ?? null,
      notes: input.notes,
    })
    .returning();

  await db.insert(sessionAttendees).values({
    sessionId: session.id,
    customerId: input.customerId,
  });

  return session;
}

/** Noon UTC — keeps the date arithmetic off DST and timezone edges. */
function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Dates a recurring session lands on. No `repeatDays` means "same weekday,
 * every week"; with them, every matching weekday in the range (0 = Sunday).
 */
export function recurringDates(
  date: string,
  repeatUntil?: string,
  repeatDays?: number[],
) {
  const days = repeatDays?.length ? new Set(repeatDays) : null;
  const last = repeatUntil && repeatUntil > date ? repeatUntil : date;
  const dates: string[] = [];

  for (
    let cursor = date;
    cursor <= last;
    cursor = addDays(cursor, days ? 1 : 7)
  ) {
    if (!days || days.has(new Date(`${cursor}T12:00:00Z`).getUTCDay())) {
      dates.push(cursor);
    }
  }

  if (dates.length === 0) {
    throw new BusinessRuleError("No dates match those repeat days.");
  }
  return dates;
}

/** Class capacity is enforced before an attendee row is written. */
export async function assertSessionHasCapacity(db: Db, sessionId: string) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) throw new BusinessRuleError("Session not found.");
  if (session.isCancelled)
    throw new BusinessRuleError("This session is cancelled.");

  const [{ taken }] = await db
    .select({ taken: count() })
    .from(sessionAttendees)
    .where(
      and(
        eq(sessionAttendees.sessionId, sessionId),
        ne(sessionAttendees.status, "cancelled"),
      ),
    );

  if (taken >= session.capacity) {
    throw new BusinessRuleError(
      `Session is full (${taken}/${session.capacity}).`,
    );
  }

  return session;
}

/** The customer's package to burn a credit against, or null for a trial. */
export async function activePackageFor(db: Db, customerId: string) {
  const rows = await db
    .select()
    .from(customerPackages)
    .where(eq(customerPackages.customerId, customerId));

  const today = toDateInputValue(new Date());
  return (
    rows
      .filter((pkg) => packageStatus(pkg, today) === "active")
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))[0] ?? null
  );
}

/**
 * Mark an attendee attended / no-show / booked.
 *
 * Credits are deducted here and nowhere else, and only once — `creditDeducted`
 * is the flag that makes the reversal safe to run twice.
 */
export async function setAttendance(
  db: Db,
  attendeeId: string,
  status: "booked" | "attended" | "no_show" | "cancelled",
) {
  const [attendee] = await db
    .select()
    .from(sessionAttendees)
    .where(eq(sessionAttendees.id, attendeeId))
    .limit(1);

  if (!attendee) throw new BusinessRuleError("Attendee not found.");

  const pkg = attendee.packageId
    ? (
        await db
          .select()
          .from(customerPackages)
          .where(eq(customerPackages.id, attendee.packageId))
          .limit(1)
      )[0]
    : undefined;

  const shouldDeduct =
    status === "attended" && !!pkg && pkg.totalCredits !== null;

  if (status === "attended" && pkg) {
    if (packageStatus(pkg) === "expired") {
      throw new BusinessRuleError(
        pkg.expiryDate < toDateInputValue(new Date())
          ? `Package expired on ${pkg.expiryDate}. Sell a renewal first.`
          : "No credits left on this package. Sell a renewal first.",
      );
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(sessionAttendees)
      .set({
        status,
        checkedInAt: status === "attended" ? new Date() : null,
        creditDeducted: shouldDeduct,
        updatedAt: new Date(),
      })
      .where(eq(sessionAttendees.id, attendeeId));

    if (!pkg) return;

    if (shouldDeduct && !attendee.creditDeducted) {
      await tx
        .update(customerPackages)
        .set({
          usedCredits: sql`${customerPackages.usedCredits} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(customerPackages.id, pkg.id));
    }

    // Giving the credit back only fires when one was actually taken, so a
    // double un-mark cannot mint credits.
    if (!shouldDeduct && attendee.creditDeducted) {
      await tx
        .update(customerPackages)
        .set({
          usedCredits: sql`max(${customerPackages.usedCredits} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(customerPackages.id, pkg.id));
    }
  });
}

/** HF-YYYY-NNNN, sequential within the year. */
export async function nextInvoiceNumber(db: Db) {
  const year = new Date().getFullYear();
  const prefix = `HF-${year}-`;

  const [row] = await db
    .select({ last: sql<string | null>`max(${invoices.invoiceNumber})` })
    .from(invoices)
    .where(sql`${invoices.invoiceNumber} like ${`${prefix}%`}`);

  const lastSeq = row?.last ? Number(row.last.slice(prefix.length)) : 0;
  return `${prefix}${String(lastSeq + 1).padStart(4, "0")}`;
}

/**
 * The ledger is the single source of truth for money. A paid invoice books one
 * income row; un-paying or cancelling removes it again. The unique index on
 * `ledger_entries.invoice_id` is what makes a double-click harmless — the
 * insert upserts instead of minting a second income row.
 */
export async function bookInvoiceIncome(
  db: Db,
  invoice: {
    id: string;
    customerId: string;
    totalCents: number;
    paidDate: string | null;
    invoiceNumber: string;
    description: string | null;
  },
) {
  const categoryId = await systemCategoryId(
    db,
    LEDGER_SYSTEM_CATEGORIES.packageSale,
    "income",
    "Package Sale",
  );

  const values = {
    date: invoice.paidDate ?? toDateInputValue(new Date()),
    direction: "income" as const,
    categoryId,
    amountCents: invoice.totalCents,
    customerId: invoice.customerId,
    invoiceId: invoice.id,
    notes: invoice.description ?? invoice.invoiceNumber,
  };

  await db
    .insert(ledgerEntries)
    .values(values)
    .onConflictDoUpdate({
      target: ledgerEntries.invoiceId,
      set: {
        date: values.date,
        amountCents: values.amountCents,
        categoryId: values.categoryId,
        updatedAt: new Date(),
      },
    });
}

export async function unbookInvoiceIncome(db: Db, invoiceId: string) {
  await db.delete(ledgerEntries).where(eq(ledgerEntries.invoiceId, invoiceId));
}

/**
 * Slugged categories are renameable but never deletable, so a lookup normally
 * hits. The insert is the fresh-database path (before the seed has run).
 */
export async function systemCategoryId(
  db: Db,
  slug: string,
  direction: "income" | "expense",
  fallbackName: string,
) {
  const existing = await db.query.ledgerCategories.findFirst({
    where: eq(ledgerCategories.slug, slug),
  });
  if (existing) return existing.id;

  const [created] = await db
    .insert(ledgerCategories)
    .values({ name: fallbackName, direction, slug })
    .returning();
  return created.id;
}
