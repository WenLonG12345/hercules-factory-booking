import { and, count, desc, eq, gte, lte, sum } from "drizzle-orm";
import { db } from "@/db";
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
import {
  demoBookings,
  demoCustomers,
  demoInvoices,
  demoLanding,
  demoMemberships,
  demoPackages,
  demoPayments,
  demoSessions,
} from "@/lib/demo-data";
import { toDateInputValue } from "@/lib/utils";

export async function getLandingData() {
  if (!db) {
    return demoLanding;
  }

  return {
    content: await db.query.landingPageContent.findFirst(),
    gallery: await db.query.galleryImages.findMany({
      where: (image, { eq }) => eq(image.isActive, true),
      orderBy: (image, { asc }) => asc(image.sortOrder),
    }),
    coaches: await db.query.coaches.findMany({
      where: (coach, { eq }) => eq(coach.isActive, true),
      orderBy: (coach, { asc }) => asc(coach.sortOrder),
    }),
    testimonials: await db.query.testimonials.findMany({
      where: (testimonial, { eq }) => eq(testimonial.isActive, true),
      orderBy: (testimonial, { asc }) => asc(testimonial.sortOrder),
    }),
    socialLinks: await db.query.socialLinks.findMany({
      where: (link, { eq }) => eq(link.isActive, true),
      orderBy: (link, { asc }) => asc(link.sortOrder),
    }),
  };
}

export async function getPackages() {
  if (!db) {
    return demoPackages;
  }

  return db.select().from(packages).orderBy(packages.sortOrder);
}

export async function getCustomers() {
  if (!db) {
    return demoCustomers;
  }

  return db.select().from(customers).orderBy(desc(customers.createdAt));
}

export async function getCustomerProfile(id: string) {
  if (!db) {
    return {
      customer: demoCustomers.find((customer) => customer.id === id),
      memberships: demoMemberships.filter((item) => item.customerId === id),
      invoices: demoInvoices.filter((item) => item.customerId === id),
      payments: demoPayments.filter((item) => item.customerId === id),
      bookings: demoBookings.filter((item) => item.customerId === id),
      attendanceHistory: [] as {
        id: string;
        checkedInAt: Date;
        creditDeducted: boolean;
        classSession: {
          sessionDate: string;
          startTime: string;
          title: string;
        } | null;
      }[],
    };
  }

  const [
    customer,
    customerMemberships,
    customerInvoices,
    customerPayments,
    customerBookings,
    attendanceHistory,
  ] = await Promise.all([
    db.query.customers.findFirst({ where: eq(customers.id, id) }),
    db.query.memberships.findMany({
      where: eq(memberships.customerId, id),
      with: { package: true },
      orderBy: desc(memberships.createdAt),
    }),
    db.query.invoices.findMany({
      where: eq(invoices.customerId, id),
      orderBy: desc(invoices.createdAt),
    }),
    db.query.payments.findMany({
      where: eq(payments.customerId, id),
      orderBy: desc(payments.paidDate),
    }),
    db.query.bookings.findMany({
      where: eq(bookings.customerId, id),
      with: { classSession: true },
      orderBy: desc(bookings.createdAt),
    }),
    db.query.attendanceRecords.findMany({
      where: eq(attendanceRecords.customerId, id),
      with: { classSession: true },
      orderBy: desc(attendanceRecords.checkedInAt),
    }),
  ]);

  return {
    customer,
    memberships: customerMemberships,
    invoices: customerInvoices,
    payments: customerPayments,
    bookings: customerBookings,
    attendanceHistory,
  };
}

export async function getSessions() {
  if (!db) {
    return demoSessions;
  }

  return db
    .select()
    .from(classSessions)
    .orderBy(classSessions.sessionDate, classSessions.startTime);
}

export async function getBookings() {
  if (!db) {
    return demoBookings;
  }

  return db.query.bookings.findMany({
    with: { customer: true, classSession: true },
    orderBy: desc(bookings.createdAt),
  });
}

export async function getTodaySessionsWithBookings() {
  if (!db) {
    return [];
  }

  const today = toDateInputValue(new Date());

  return db.query.classSessions.findMany({
    where: (s, { eq }) => eq(s.sessionDate, today),
    orderBy: (s, { asc }) => asc(s.startTime),
    with: {
      bookings: {
        with: {
          customer: {
            with: {
              memberships: {
                where: (m, { eq }) => eq(m.status, "active"),
                with: { package: true },
                orderBy: (m, { desc }) => desc(m.createdAt),
                limit: 1,
              },
            },
          },
        },
      },
    },
  });
}

export async function getAttendanceRecords() {
  if (!db) {
    return [];
  }

  return db.query.attendanceRecords.findMany({
    with: {
      customer: true,
      classSession: true,
      membership: { with: { package: true } },
    },
    orderBy: desc(attendanceRecords.checkedInAt),
  });
}

export async function getInvoices() {
  if (!db) {
    return demoInvoices;
  }

  return db.query.invoices.findMany({
    with: { customer: true, payments: true },
    orderBy: desc(invoices.createdAt),
  });
}

export async function getPayments() {
  if (!db) {
    return demoPayments;
  }

  return db.query.payments.findMany({
    with: { customer: true, invoice: true },
    orderBy: desc(payments.paidDate),
  });
}

export async function getDashboardStats() {
  if (!db) {
    return {
      totalCustomers: demoCustomers.length,
      activeMemberships: demoMemberships.length,
      monthlyRevenueCents: demoPayments.reduce(
        (sum, item) => sum + item.amountCents,
        0,
      ),
      todayBookings: demoBookings.length,
      recentPayments: demoPayments,
    };
  }

  const today = toDateInputValue(new Date());
  const monthStart = `${today.slice(0, 8)}01`;

  const [
    [customerCount],
    [membershipCount],
    [revenue],
    [bookingCount],
    recentPayments,
  ] = await Promise.all([
    db.select({ value: count() }).from(customers),
    db
      .select({ value: count() })
      .from(memberships)
      .where(eq(memberships.status, "active")),
    db
      .select({ value: sum(payments.amountCents) })
      .from(payments)
      .where(gte(payments.paidDate, monthStart)),
    db
      .select({ value: count() })
      .from(bookings)
      .innerJoin(classSessions, eq(classSessions.id, bookings.classSessionId))
      .where(eq(classSessions.sessionDate, today)),
    db.query.payments.findMany({
      with: { customer: true, invoice: true },
      orderBy: desc(payments.paidDate),
      limit: 5,
    }),
  ]);

  return {
    totalCustomers: customerCount.value,
    activeMemberships: membershipCount.value,
    monthlyRevenueCents: Number(revenue.value ?? 0),
    todayBookings: bookingCount.value,
    recentPayments,
  };
}

export async function getRevenueReport() {
  if (!db) {
    return {
      payments: demoPayments,
      dailyRevenueCents: demoPayments.reduce(
        (sum, item) => sum + item.amountCents,
        0,
      ),
      monthlyRevenueCents: demoPayments.reduce(
        (sum, item) => sum + item.amountCents,
        0,
      ),
      byPackage: [
        { packageType: "ten_class", totalCents: 15000 },
        { packageType: "unlimited", totalCents: 22000 },
      ],
    };
  }

  const today = toDateInputValue(new Date());
  const monthStart = `${today.slice(0, 8)}01`;

  const [daily, monthly, paymentRows, byPackage] = await Promise.all([
    db
      .select({ value: sum(payments.amountCents) })
      .from(payments)
      .where(eq(payments.paidDate, today)),
    db
      .select({ value: sum(payments.amountCents) })
      .from(payments)
      .where(
        and(gte(payments.paidDate, monthStart), lte(payments.paidDate, today)),
      ),
    getPayments(),
    db
      .select({
        packageType: packages.type,
        totalCents: sum(payments.amountCents),
      })
      .from(payments)
      .innerJoin(memberships, eq(memberships.customerId, payments.customerId))
      .innerJoin(packages, eq(packages.id, memberships.packageId))
      .groupBy(packages.type),
  ]);

  return {
    payments: paymentRows,
    dailyRevenueCents: Number(daily[0]?.value ?? 0),
    monthlyRevenueCents: Number(monthly[0]?.value ?? 0),
    byPackage,
  };
}
