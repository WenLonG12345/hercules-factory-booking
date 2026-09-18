import { and, count, eq, ne, sql } from "drizzle-orm";
import type { Db } from "@/db";
import {
  customerPackages,
  invoiceItems,
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
  pkg: {
    totalCredits: number | null;
    usedCredits: number;
    /** Null: no end date was agreed, so the package never expires by date. */
    expiryDate: string | null;
  },
  today = toDateInputValue(new Date()),
) {
  if (pkg.expiryDate !== null && pkg.expiryDate < today)
    return "expired" as const;
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

/** Sorts a package with no expiry behind every dated one. */
const expirySortKey = (pkg: { expiryDate: string | null }) =>
  pkg.expiryDate ?? "9999-12-31";

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
      .sort((a, b) => expirySortKey(a).localeCompare(expirySortKey(b)))[0] ??
    null
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
        pkg.expiryDate !== null && pkg.expiryDate < toDateInputValue(new Date())
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
    notes: invoice.invoiceNumber,
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

/** A line as the create and edit forms send it. */
export type InvoiceLine = {
  id?: string;
  description: string;
  amountCents: number;
  package?: {
    type: (typeof customerPackages.$inferInsert)["type"];
    totalCredits?: number;
    /** Both omitted when the dates are not settled yet — filled in later. */
    validFrom?: string;
    validUntil?: string;
  };
};

/** A line as it sits in the database, with the package it sold. */
type StoredLine = typeof invoiceItems.$inferSelect & {
  package: typeof customerPackages.$inferSelect | null;
};

/**
 * A package is only ever removed while untouched. Once attendance has been
 * marked against it, it stays standing and the line simply lets go of it.
 */
async function releasePackage(
  db: Db,
  pkg: typeof customerPackages.$inferSelect | null,
) {
  if (pkg && pkg.usedCredits === 0) {
    await db.delete(customerPackages).where(eq(customerPackages.id, pkg.id));
  }
}

/**
 * Bring an invoice's lines in step with what the form sent. Selling a package
 * is writing a line — every package line opens (or re-dates) a package row
 * for the customer, and a line that stops being a package lets its package go.
 * Lines missing from `lines` are removed; their packages go too while unused.
 */
export async function writeInvoiceLines(
  db: Db,
  invoice: {
    id: string;
    customerId: string;
    notes: string | null;
    paymentMethod: (typeof customerPackages.$inferInsert)["paymentMethod"];
    paid: boolean;
  },
  lines: InvoiceLine[],
  existing: StoredLine[],
) {
  const kept = new Set(lines.map((line) => line.id).filter(Boolean));
  for (const old of existing) {
    if (kept.has(old.id)) continue;
    await db.delete(invoiceItems).where(eq(invoiceItems.id, old.id));
    await releasePackage(db, old.package);
  }

  for (const [sortOrder, line] of lines.entries()) {
    const prev = existing.find((old) => old.id === line.id);
    let packageId: string | null = null;

    if (line.package) {
      const totalCredits =
        line.package.type === "unlimited"
          ? null
          : (line.package.totalCredits ?? null);
      if (
        prev?.package &&
        totalCredits !== null &&
        totalCredits < prev.package.usedCredits
      ) {
        throw new BusinessRuleError(
          `"${line.description}" already has ${prev.package.usedCredits} credits used — it cannot drop below that.`,
        );
      }
      const values = {
        customerId: invoice.customerId,
        type: line.package.type,
        startDate: line.package.validFrom ?? null,
        expiryDate: line.package.validUntil ?? null,
        totalCredits,
        amountPaidCents: invoice.paid ? line.amountCents : 0,
        paymentMethod: invoice.paymentMethod ?? null,
        notes: invoice.notes,
      };
      if (prev?.package) {
        await db
          .update(customerPackages)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(customerPackages.id, prev.package.id));
        packageId = prev.package.id;
      } else {
        packageId = (
          await db.insert(customerPackages).values(values).returning()
        )[0].id;
      }
    } else if (prev?.package) {
      await releasePackage(db, prev.package);
    }

    const values = {
      description: line.description,
      amountCents: line.amountCents,
      sortOrder,
      packageId,
    };
    if (prev) {
      await db
        .update(invoiceItems)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(invoiceItems.id, prev.id));
    } else {
      await db
        .insert(invoiceItems)
        .values({ ...values, invoiceId: invoice.id });
    }
  }
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
