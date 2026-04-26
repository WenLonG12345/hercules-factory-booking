"use server";

import { and, eq, gte, isNull, or } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { bookings, customers, memberships, packages } from "@/db/schema";
import {
  createBookingWithCapacityCheck,
  createInvoice,
  markAttendance,
} from "@/server/services/business";
import { auth } from "@/lib/auth";

async function getCustomerFromSession() {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!session) throw new Error("Not authenticated");

  const db = getDb();
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.authUserId, session.user.id))
    .limit(1);

  if (!customer) throw new Error("No customer profile linked to this account.");
  return { session, customer, db };
}

export async function completeRegistrationAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string; customerId?: string }> {
  const phone = String(formData.get("phone") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (phone.length < 8) return { error: "Please enter a valid phone number." };

  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!session) return { error: "Not authenticated." };

  const db = getDb();
  const authUserId = session.user.id;

  const [alreadyLinked] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.authUserId, authUserId))
    .limit(1);

  if (alreadyLinked) return { customerId: alreadyLinked.id };

  const [byPhone] = await db
    .select()
    .from(customers)
    .where(eq(customers.phone, phone))
    .limit(1);

  if (byPhone) {
    if (byPhone.authUserId && byPhone.authUserId !== authUserId) {
      return { error: "This phone number is already linked to another account." };
    }
    const [updated] = await db
      .update(customers)
      .set({ authUserId, updatedAt: new Date() })
      .where(eq(customers.id, byPhone.id))
      .returning({ id: customers.id });
    return { customerId: updated.id };
  }

  const [created] = await db
    .insert(customers)
    .values({
      name: name || session.user.name || "New Member",
      phone,
      email: session.user.email,
      authUserId,
    })
    .returning({ id: customers.id });

  return { customerId: created.id };
}

export async function bookClassAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string; bookingId?: string }> {
  try {
    const { customer, db } = await getCustomerFromSession();
    const classSessionId = String(formData.get("classSessionId"));
    const notes = formData.get("notes") ? String(formData.get("notes")) : undefined;

    const today = new Date().toISOString().split("T")[0];
    const [activeMembership] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.customerId, customer.id),
          eq(memberships.status, "active"),
          or(isNull(memberships.expiryDate), gte(memberships.expiryDate, today)),
        ),
      )
      .limit(1);

    if (!activeMembership) {
      return {
        error:
          "Active membership required. Please request a membership package first.",
      };
    }

    const booking = await createBookingWithCapacityCheck(db, {
      customerId: customer.id,
      classSessionId,
      source: "portal",
      notes,
    });

    revalidatePath("/member/(home)/schedule");
    revalidatePath("/member/(home)/bookings");
    return { bookingId: booking.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to book class." };
  }
}

export async function cancelBookingAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { customer, db } = await getCustomerFromSession();
    const bookingId = String(formData.get("bookingId"));

    const [booking] = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.customerId, customer.id)))
      .limit(1);

    if (!booking) return { error: "Booking not found." };
    if (booking.status !== "booked")
      return { error: "Only active bookings can be cancelled." };

    await db
      .update(bookings)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(bookings.id, bookingId));

    revalidatePath("/member/(home)/bookings");
    revalidatePath("/member/(home)/schedule");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to cancel booking." };
  }
}

export async function requestMembershipAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string; invoiceNumber?: string; packageName?: string }> {
  try {
    const { customer, db } = await getCustomerFromSession();
    const packageId = String(formData.get("packageId"));

    const [pkg] = await db
      .select()
      .from(packages)
      .where(and(eq(packages.id, packageId), eq(packages.isActive, true)))
      .limit(1);

    if (!pkg) return { error: "Package not found." };

    const invoice = await createInvoice(db, {
      customerId: customer.id,
      subtotalCents: pkg.priceCents,
      totalCents: pkg.priceCents,
      notes: `Customer self-request via portal: ${pkg.name}`,
    });

    revalidatePath("/member/(home)/memberships");
    revalidatePath("/member/(home)/invoices");
    return { invoiceNumber: invoice.invoiceNumber, packageName: pkg.name };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to submit request.",
    };
  }
}

export async function memberCheckInAction(
  classSessionId: string,
): Promise<{ error?: string; success?: boolean; className?: string }> {
  try {
    const { customer, db } = await getCustomerFromSession();

    const [booking] = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.customerId, customer.id),
          eq(bookings.classSessionId, classSessionId),
          eq(bookings.status, "booked"),
        ),
      )
      .limit(1);

    if (!booking) {
      return {
        error: "No active booking for this class. Please book the class first.",
      };
    }

    const attendance = await markAttendance(db, { bookingId: booking.id });

    if (!attendance) {
      return { error: "Already checked in to this class." };
    }

    revalidatePath("/member/(home)");
    revalidatePath("/member/(home)/attendance");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Check-in failed." };
  }
}
