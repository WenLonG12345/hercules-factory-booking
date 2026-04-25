import { and, count, desc, eq, gte, ne, sql } from "drizzle-orm";
import type { Db } from "@/db";
import {
  attendanceRecords,
  bookings,
  classSessions,
  customers,
  invoices,
  memberships,
  packages,
  payments,
} from "@/db/schema";
import { addDays, toDateInputValue } from "@/lib/utils";

export async function createMembershipForPackage(
  db: Db,
  input: { customerId: string; packageId: string; startDate: string },
) {
  const [pkg] = await db
    .select()
    .from(packages)
    .where(eq(packages.id, input.packageId));

  if (!pkg) {
    throw new Error("Package not found.");
  }

  const start = new Date(input.startDate);
  const expiryDate = pkg.validityDays
    ? toDateInputValue(addDays(start, pkg.validityDays))
    : null;

  const [membership] = await db
    .insert(memberships)
    .values({
      customerId: input.customerId,
      packageId: input.packageId,
      startDate: input.startDate,
      expiryDate,
      remainingCredits:
        pkg.type === "ten_class" ? (pkg.classCredits ?? 10) : null,
    })
    .returning();

  await createInvoice(db, {
    customerId: input.customerId,
    membershipId: membership.id,
    subtotalCents: pkg.priceCents,
    totalCents: pkg.priceCents,
  });

  return membership;
}

export async function assertClassHasCapacity(db: Db, classSessionId: string) {
  const [session] = await db
    .select()
    .from(classSessions)
    .where(eq(classSessions.id, classSessionId));

  if (!session || session.isCancelled) {
    throw new Error("Class is not available for booking.");
  }

  const [{ value }] = await db
    .select({ value: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.classSessionId, classSessionId),
        ne(bookings.status, "cancelled"),
      ),
    );

  if (value >= session.capacity) {
    throw new Error("This class is fully booked.");
  }
}

export async function createBookingWithCapacityCheck(
  db: Db,
  input: {
    customerId: string;
    classSessionId: string;
    source?: string;
    notes?: string;
  },
) {
  await assertClassHasCapacity(db, input.classSessionId);

  const [booking] = await db
    .insert(bookings)
    .values({
      customerId: input.customerId,
      classSessionId: input.classSessionId,
      source: input.source ?? "admin",
      notes: input.notes,
    })
    .returning();

  return booking;
}

export async function markAttendance(
  db: Db,
  input: { bookingId: string; signatureDataUrl?: string },
) {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, input.bookingId));

  if (!booking) {
    throw new Error("Booking not found.");
  }

  const [session] = await db
    .select()
    .from(classSessions)
    .where(eq(classSessions.id, booking.classSessionId));

  const [activeMembership] = await db
    .select({
      membership: memberships,
      package: packages,
    })
    .from(memberships)
    .innerJoin(packages, eq(packages.id, memberships.packageId))
    .where(
      and(
        eq(memberships.customerId, booking.customerId),
        eq(memberships.status, "active"),
        session?.sessionDate
          ? gte(memberships.expiryDate, session.sessionDate)
          : sql`true`,
      ),
    )
    .orderBy(desc(memberships.createdAt))
    .limit(1);

  let creditDeducted = false;

  if (activeMembership?.package.type === "ten_class") {
    const remaining = activeMembership.membership.remainingCredits ?? 0;
    if (remaining <= 0) {
      throw new Error("Customer has no remaining 10-class credits.");
    }

    await db
      .update(memberships)
      .set({
        remainingCredits: remaining - 1,
        updatedAt: new Date(),
      })
      .where(eq(memberships.id, activeMembership.membership.id));

    creditDeducted = true;
  }

  await db
    .update(bookings)
    .set({ status: "attended", updatedAt: new Date() })
    .where(eq(bookings.id, input.bookingId));

  const [attendance] = await db
    .insert(attendanceRecords)
    .values({
      bookingId: booking.id,
      customerId: booking.customerId,
      classSessionId: booking.classSessionId,
      membershipId: activeMembership?.membership.id,
      signatureDataUrl: input.signatureDataUrl,
      creditDeducted,
    })
    .onConflictDoNothing()
    .returning();

  return attendance;
}

export async function nextInvoiceNumber(db: Db) {
  const [{ value }] = await db.select({ value: count() }).from(invoices);
  const year = new Date().getFullYear();
  return `HF-${year}-${String(value + 1).padStart(5, "0")}`;
}

export async function createInvoice(
  db: Db,
  input: {
    customerId: string;
    membershipId?: string | null;
    subtotalCents: number;
    totalCents: number;
    dueDate?: string;
    notes?: string;
  },
) {
  const [invoice] = await db
    .insert(invoices)
    .values({
      invoiceNumber: await nextInvoiceNumber(db),
      customerId: input.customerId,
      membershipId: input.membershipId || null,
      subtotalCents: input.subtotalCents,
      totalCents: input.totalCents,
      dueDate: input.dueDate,
      notes: input.notes,
    })
    .returning();

  return invoice;
}

export async function recordPayment(
  db: Db,
  input: {
    invoiceId: string;
    customerId: string;
    amountCents: number;
    method: "cash" | "bank_transfer" | "tng" | "card" | "other";
    paidDate: string;
    reference?: string;
  },
) {
  const [payment] = await db.insert(payments).values(input).returning();

  await db
    .update(invoices)
    .set({ status: "paid", updatedAt: new Date() })
    .where(eq(invoices.id, input.invoiceId));

  return payment;
}

export async function createOrFindCustomer(
  db: Db,
  input: { name: string; phone: string; email?: string; notes?: string },
) {
  const [existing] = await db
    .select()
    .from(customers)
    .where(eq(customers.phone, input.phone));

  if (existing) {
    return existing;
  }

  const [customer] = await db.insert(customers).values(input).returning();
  return customer;
}
