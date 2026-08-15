import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { BusinessRuleError } from "@/server/services/business";

export async function createTRPCContext({ req }: { req: Request }) {
  const session = await auth.api
    .getSession({ headers: req.headers })
    .catch(() => null);
  return { db, session };
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // Business rules are shown to the admin verbatim, not as "internal error".
    if (error.cause instanceof BusinessRuleError) {
      return { ...shape, message: error.cause.message };
    }
    return shape;
  },
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
