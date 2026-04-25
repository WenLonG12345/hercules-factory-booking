import { desc, eq } from "drizzle-orm";
import { memberships, packages } from "@/db/schema";
import { createMembershipForPackage } from "@/server/services/business";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";
import { idSchema } from "@/server/validators/common";
import {
  membershipInput,
  updateMembershipInput,
} from "@/server/validators/membership";

export const membershipRouter = createTRPCRouter({
  packages: adminProcedure.query(({ ctx }) =>
    ctx.db.select().from(packages).orderBy(packages.sortOrder),
  ),
  list: adminProcedure.query(() => []),
  byCustomer: adminProcedure.input(idSchema).query(({ ctx, input }) =>
    ctx.db.query.memberships.findMany({
      where: eq(memberships.customerId, input.id),
      with: { package: true },
      orderBy: desc(memberships.createdAt),
    }),
  ),
  create: adminProcedure
    .input(membershipInput)
    .mutation(({ ctx, input }) => createMembershipForPackage(ctx.db, input)),
  update: adminProcedure
    .input(updateMembershipInput)
    .mutation(({ ctx, input }) => {
      const { id, ...values } = input;
      return ctx.db
        .update(memberships)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(memberships.id, id))
        .returning();
    }),
});
