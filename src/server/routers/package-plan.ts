import { asc, eq, sql } from "drizzle-orm";
import { customerPackages, packagePlans } from "@/db/schema";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";
import { idSchema } from "@/server/validators/common";
import {
  packagePlanInput,
  updatePackagePlanInput,
} from "@/server/validators/package";

/**
 * The price list. Plans are templates: selling one copies its numbers onto a
 * customer_packages row, so editing or deleting a plan never touches a sale.
 */
export const packagePlanRouter = createTRPCRouter({
  /** Plans plus how many times each has been sold. */
  list: adminProcedure.query(({ ctx }) =>
    ctx.db
      .select({
        id: packagePlans.id,
        name: packagePlans.name,
        type: packagePlans.type,
        totalCredits: packagePlans.totalCredits,
        priceCents: packagePlans.priceCents,
        validityDays: packagePlans.validityDays,
        description: packagePlans.description,
        isActive: packagePlans.isActive,
        sortOrder: packagePlans.sortOrder,
        soldCount: sql<number>`count(${customerPackages.id})`.mapWith(Number),
      })
      .from(packagePlans)
      .leftJoin(customerPackages, eq(customerPackages.planId, packagePlans.id))
      .groupBy(packagePlans.id)
      .orderBy(asc(packagePlans.sortOrder), asc(packagePlans.name)),
  ),
  create: adminProcedure.input(packagePlanInput).mutation(({ ctx, input }) =>
    ctx.db
      .insert(packagePlans)
      .values({
        ...input,
        totalCredits: input.type === "unlimited" ? null : input.totalCredits,
      })
      .returning(),
  ),
  update: adminProcedure
    .input(updatePackagePlanInput)
    .mutation(({ ctx, input }) => {
      const { id, ...values } = input;
      return ctx.db
        .update(packagePlans)
        .set({
          ...values,
          totalCredits:
            values.type === "unlimited" ? null : values.totalCredits,
          updatedAt: new Date(),
        })
        .where(eq(packagePlans.id, id))
        .returning();
    }),
  /**
   * Detach the sales first, then drop the plan — a sold package keeps its own
   * numbers and only loses the pointer back to the price list.
   */
  delete: adminProcedure.input(idSchema).mutation(async ({ ctx, input }) => {
    await ctx.db
      .update(customerPackages)
      .set({ planId: null, updatedAt: new Date() })
      .where(eq(customerPackages.planId, input.id));

    return ctx.db
      .delete(packagePlans)
      .where(eq(packagePlans.id, input.id))
      .returning();
  }),
});
