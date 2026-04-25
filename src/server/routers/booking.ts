import { desc, eq } from "drizzle-orm";
import { bookings } from "@/db/schema";
import {
  createBookingWithCapacityCheck,
  createOrFindCustomer,
} from "@/server/services/business";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/trpc";
import {
  bookingInput,
  publicBookingInput,
  updateBookingInput,
} from "@/server/validators/booking";

export const bookingRouter = createTRPCRouter({
  list: adminProcedure.query(({ ctx }) =>
    ctx.db.query.bookings.findMany({
      with: { customer: true, classSession: true },
      orderBy: desc(bookings.createdAt),
    }),
  ),
  create: adminProcedure
    .input(bookingInput)
    .mutation(({ ctx, input }) =>
      createBookingWithCapacityCheck(ctx.db, input),
    ),
  publicCreate: publicProcedure
    .input(publicBookingInput)
    .mutation(async ({ ctx, input }) => {
      const customer = await createOrFindCustomer(ctx.db, {
        name: input.name,
        phone: input.phone,
        email: input.email || undefined,
        notes: input.notes,
      });

      return createBookingWithCapacityCheck(ctx.db, {
        customerId: customer.id,
        classSessionId: input.classSessionId,
        source: "public",
        notes: input.notes,
      });
    }),
  updateStatus: adminProcedure
    .input(updateBookingInput)
    .mutation(({ ctx, input }) =>
      ctx.db
        .update(bookings)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(bookings.id, input.id))
        .returning(),
    ),
});
