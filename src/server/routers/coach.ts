import { asc, eq } from "drizzle-orm";
import { coaches } from "@/db/schema";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";
import { coachInput, updateCoachInput } from "@/server/validators/coach";
import { idSchema } from "@/server/validators/common";

export const coachRouter = createTRPCRouter({
  list: adminProcedure.query(({ ctx }) =>
    ctx.db.select().from(coaches).orderBy(asc(coaches.sortOrder)),
  ),
  create: adminProcedure
    .input(coachInput)
    .mutation(({ ctx, input }) =>
      ctx.db.insert(coaches).values(input).returning(),
    ),
  update: adminProcedure.input(updateCoachInput).mutation(({ ctx, input }) => {
    const { id, ...values } = input;
    return ctx.db
      .update(coaches)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(coaches.id, id))
      .returning();
  }),
  delete: adminProcedure
    .input(idSchema)
    .mutation(({ ctx, input }) =>
      ctx.db.delete(coaches).where(eq(coaches.id, input.id)).returning(),
    ),
});
