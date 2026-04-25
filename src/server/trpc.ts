import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { db } from "@/db";
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
  return next({ ctx: { ...ctx, db: ctx.db, session: ctx.session } });
});
