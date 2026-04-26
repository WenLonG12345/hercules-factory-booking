import { initTRPC, TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import superjson from "superjson";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function createTRPCContext({ req }: { req: Request }) {
  const session = await auth.api
    .getSession({ headers: req.headers })
    .catch(() => null);
  return { db, session };
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const publicDbProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database is not configured.",
    });
  }
  return next({ ctx: { ...ctx, db: ctx.db } });
});

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (!ctx.db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database is not configured.",
    });
  }
  if (ctx.session.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx: { ...ctx, db: ctx.db, session: ctx.session } });
});

// Requires a valid session only (used during customer onboarding before customer record exists)
export const sessionProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (!ctx.db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database is not configured.",
    });
  }
  return next({ ctx: { ...ctx, db: ctx.db, session: ctx.session } });
});

// Requires a valid session linked to a customer record
export const customerProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (!ctx.db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database is not configured.",
    });
  }
  const [customer] = await ctx.db
    .select()
    .from(customers)
    .where(eq(customers.authUserId, ctx.session.user.id))
    .limit(1);
  if (!customer) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No customer profile linked to this account.",
    });
  }
  return next({ ctx: { ...ctx, db: ctx.db, session: ctx.session, customer } });
});
