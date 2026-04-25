import { and, asc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { classSessions } from "@/db/schema";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/trpc";
import { idSchema } from "@/server/validators/common";
import {
  classSessionInput,
  updateClassSessionInput,
} from "@/server/validators/schedule";

const rangeInput = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const scheduleRouter = createTRPCRouter({
  list: publicProcedure.input(rangeInput.optional()).query(({ ctx, input }) => {
    const from = input?.from ?? new Date().toISOString().slice(0, 10);
    const to = input?.to ?? "2099-12-31";

    return ctx.db
      .select()
      .from(classSessions)
      .where(
        and(
          gte(classSessions.sessionDate, from),
          lte(classSessions.sessionDate, to),
        ),
      )
      .orderBy(asc(classSessions.sessionDate), asc(classSessions.startTime));
  }),
  create: adminProcedure
    .input(classSessionInput)
    .mutation(({ ctx, input }) =>
      ctx.db.insert(classSessions).values(input).returning(),
    ),
  update: adminProcedure
    .input(updateClassSessionInput)
    .mutation(({ ctx, input }) => {
      const { id, ...values } = input;
      return ctx.db
        .update(classSessions)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(classSessions.id, id))
        .returning();
    }),
  cancel: adminProcedure
    .input(idSchema.extend({ reason: z.string().optional() }))
    .mutation(({ ctx, input }) =>
      ctx.db
        .update(classSessions)
        .set({
          isCancelled: true,
          cancellationReason: input.reason,
          updatedAt: new Date(),
        })
        .where(eq(classSessions.id, input.id))
        .returning(),
    ),
});
