import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { z } from "zod";
import {
  attendanceRecords,
  bookings,
  classSessions,
  customers,
  invoices,
  memberships,
  packages,
} from "@/db/schema";
import {
  createBookingWithCapacityCheck,
  createInvoice,
  markAttendance,
} from "@/server/services/business";
import {
  createTRPCRouter,
  customerProcedure,
  sessionProcedure,
} from "@/server/trpc";

const today = () => new Date().toISOString().split("T")[0];

export const portalRouter = createTRPCRouter({
  profileCheck: sessionProcedure.query(async ({ ctx }) => {
    const [customer] = await ctx.db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.authUserId, ctx.session.user.id))
      .limit(1);
    return !!customer;
  }),

  // Link or create customer record after sign-up / Google OAuth
  completeRegistration: sessionProcedure
    .input(
      z.object({
        phone: z.string().min(8),
        name: z.string().min(2).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const authUserId = ctx.session.user.id;

      const [alreadyLinked] = await ctx.db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.authUserId, authUserId))
        .limit(1);

      if (alreadyLinked) return { customerId: alreadyLinked.id };

      const [byPhone] = await ctx.db
        .select()
        .from(customers)
        .where(eq(customers.phone, input.phone))
        .limit(1);

      if (byPhone) {
        if (byPhone.authUserId && byPhone.authUserId !== authUserId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This phone number is already linked to another account.",
          });
        }
        const [updated] = await ctx.db
          .update(customers)
          .set({ authUserId, updatedAt: new Date() })
          .where(eq(customers.id, byPhone.id))
          .returning({ id: customers.id });
        return { customerId: updated.id };
      }

      const name = input.name ?? ctx.session.user.name ?? "New Member";
      const [created] = await ctx.db
        .insert(customers)
        .values({
          name,
          phone: input.phone,
          email: ctx.session.user.email,
          authUserId,
        })
        .returning({ id: customers.id });

      return { customerId: created.id };
    }),

  dashboard: customerProcedure.query(async ({ ctx }) => {
    const t = today();

    const [[activeMembership], upcomingBookings, recentAttendance] =
      await Promise.all([
        ctx.db
          .select({ membership: memberships, package: packages })
          .from(memberships)
          .innerJoin(packages, eq(packages.id, memberships.packageId))
          .where(
            and(
              eq(memberships.customerId, ctx.customer.id),
              eq(memberships.status, "active"),
              or(
                isNull(memberships.expiryDate),
                gte(memberships.expiryDate, t),
              ),
            ),
          )
          .orderBy(desc(memberships.createdAt))
          .limit(1),
        ctx.db
          .select({ booking: bookings, session: classSessions })
          .from(bookings)
          .innerJoin(
            classSessions,
            eq(classSessions.id, bookings.classSessionId),
          )
          .where(
            and(
              eq(bookings.customerId, ctx.customer.id),
              eq(bookings.status, "booked"),
              gte(classSessions.sessionDate, t),
            ),
          )
          .orderBy(asc(classSessions.sessionDate), asc(classSessions.startTime))
          .limit(5),
        ctx.db
          .select({ record: attendanceRecords, session: classSessions })
          .from(attendanceRecords)
          .innerJoin(
            classSessions,
            eq(classSessions.id, attendanceRecords.classSessionId),
          )
          .where(eq(attendanceRecords.customerId, ctx.customer.id))
          .orderBy(desc(attendanceRecords.checkedInAt))
          .limit(3),
      ]);

    return {
      customer: ctx.customer,
      activeMembership: activeMembership ?? null,
      upcomingBookings,
      recentAttendance,
    };
  }),

  schedule: customerProcedure
    .input(
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const from = input.from ?? today();
      const to = input.to ?? "2099-12-31";

      const rows = await ctx.db
        .select({ session: classSessions, myBooking: bookings })
        .from(classSessions)
        .leftJoin(
          bookings,
          and(
            eq(bookings.classSessionId, classSessions.id),
            eq(bookings.customerId, ctx.customer.id),
          ),
        )
        .where(
          and(
            eq(classSessions.isCancelled, false),
            gte(classSessions.sessionDate, from),
            lte(classSessions.sessionDate, to),
          ),
        )
        .orderBy(asc(classSessions.sessionDate), asc(classSessions.startTime));

      return rows.map((r) => ({ session: r.session, myBooking: r.myBooking }));
    }),

  bookClass: customerProcedure
    .input(
      z.object({
        classSessionId: z.string().uuid(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const t = today();

      const [activeMembership] = await ctx.db
        .select()
        .from(memberships)
        .where(
          and(
            eq(memberships.customerId, ctx.customer.id),
            eq(memberships.status, "active"),
            or(isNull(memberships.expiryDate), gte(memberships.expiryDate, t)),
          ),
        )
        .limit(1);

      if (!activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Active membership required to book a class. Please request a membership first.",
        });
      }

      return createBookingWithCapacityCheck(ctx.db, {
        customerId: ctx.customer.id,
        classSessionId: input.classSessionId,
        source: "portal",
        notes: input.notes,
      });
    }),

  cancelBooking: customerProcedure
    .input(z.object({ bookingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [booking] = await ctx.db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.id, input.bookingId),
            eq(bookings.customerId, ctx.customer.id),
          ),
        )
        .limit(1);

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking not found.",
        });
      }

      if (booking.status !== "booked") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only bookings with status 'booked' can be cancelled.",
        });
      }

      const [updated] = await ctx.db
        .update(bookings)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(bookings.id, input.bookingId))
        .returning();

      return updated;
    }),

  myBookings: customerProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({ booking: bookings, session: classSessions })
      .from(bookings)
      .innerJoin(classSessions, eq(classSessions.id, bookings.classSessionId))
      .where(eq(bookings.customerId, ctx.customer.id))
      .orderBy(desc(classSessions.sessionDate), desc(classSessions.startTime));
  }),

  myMemberships: customerProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({ membership: memberships, package: packages })
      .from(memberships)
      .innerJoin(packages, eq(packages.id, memberships.packageId))
      .where(eq(memberships.customerId, ctx.customer.id))
      .orderBy(desc(memberships.createdAt));
  }),

  packages: customerProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(packages)
      .where(eq(packages.isActive, true))
      .orderBy(asc(packages.sortOrder));
  }),

  requestMembership: customerProcedure
    .input(z.object({ packageId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [pkg] = await ctx.db
        .select()
        .from(packages)
        .where(
          and(eq(packages.id, input.packageId), eq(packages.isActive, true)),
        )
        .limit(1);

      if (!pkg) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Package not found.",
        });
      }

      const invoice = await createInvoice(ctx.db, {
        customerId: ctx.customer.id,
        subtotalCents: pkg.priceCents,
        totalCents: pkg.priceCents,
        notes: `Customer self-request via portal: ${pkg.name}`,
      });

      return { invoice, package: pkg };
    }),

  myInvoices: customerProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(invoices)
      .where(eq(invoices.customerId, ctx.customer.id))
      .orderBy(desc(invoices.issueDate));
  }),

  myAttendance: customerProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({ record: attendanceRecords, session: classSessions })
      .from(attendanceRecords)
      .innerJoin(
        classSessions,
        eq(classSessions.id, attendanceRecords.classSessionId),
      )
      .where(eq(attendanceRecords.customerId, ctx.customer.id))
      .orderBy(desc(attendanceRecords.checkedInAt));
  }),

  checkIn: customerProcedure
    .input(z.object({ classSessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [booking] = await ctx.db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.customerId, ctx.customer.id),
            eq(bookings.classSessionId, input.classSessionId),
            eq(bookings.status, "booked"),
          ),
        )
        .limit(1);

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "No active booking found for this class. Please book the class first.",
        });
      }

      const attendance = await markAttendance(ctx.db, {
        bookingId: booking.id,
      });

      if (!attendance) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already checked in to this class.",
        });
      }

      return attendance;
    }),
});
