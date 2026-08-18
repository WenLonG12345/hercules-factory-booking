import { and, asc, count, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { ledgerCategories, ledgerEntries } from "@/db/schema";
import { BusinessRuleError } from "@/server/services/business";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";
import {
  idSchema,
  ledgerDirectionSchema,
  monthSchema,
} from "@/server/validators/common";
import {
  ledgerCategoryInput,
  ledgerEntryInput,
  updateLedgerCategoryInput,
  updateLedgerEntryInput,
} from "@/server/validators/ledger";

export const ledgerRouter = createTRPCRouter({
  categories: createTRPCRouter({
    /** Archived rows still appear on old entries, so the list can include them. */
    list: adminProcedure
      .input(
        z.object({ includeArchived: z.boolean().default(false) }).optional(),
      )
      .query(({ ctx, input }) =>
        ctx.db.query.ledgerCategories.findMany({
          where: input?.includeArchived
            ? undefined
            : eq(ledgerCategories.isArchived, false),
          orderBy: [
            asc(ledgerCategories.direction),
            asc(ledgerCategories.sortOrder),
            asc(ledgerCategories.name),
          ],
        }),
      ),
    create: adminProcedure
      .input(ledgerCategoryInput)
      .mutation(async ({ ctx, input }) => {
        const clash = await ctx.db.query.ledgerCategories.findFirst({
          where: and(
            eq(ledgerCategories.direction, input.direction),
            eq(ledgerCategories.name, input.name),
          ),
        });
        if (clash) {
          throw new BusinessRuleError(
            `"${input.name}" already exists for ${input.direction}.`,
          );
        }

        const [last] = await ctx.db
          .select({ value: ledgerCategories.sortOrder })
          .from(ledgerCategories)
          .where(eq(ledgerCategories.direction, input.direction))
          .orderBy(desc(ledgerCategories.sortOrder))
          .limit(1);

        return ctx.db
          .insert(ledgerCategories)
          .values({ ...input, sortOrder: (last?.value ?? 0) + 1 })
          .returning();
      }),
    update: adminProcedure
      .input(updateLedgerCategoryInput)
      .mutation(({ ctx, input }) => {
        const { id, ...values } = input;
        return ctx.db
          .update(ledgerCategories)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(ledgerCategories.id, id))
          .returning();
      }),
    /**
     * A category in use is archived, never deleted — deleting it would orphan
     * historical rows. Slugged categories are load-bearing and stay put.
     */
    delete: adminProcedure.input(idSchema).mutation(async ({ ctx, input }) => {
      const category = await ctx.db.query.ledgerCategories.findFirst({
        where: eq(ledgerCategories.id, input.id),
      });
      if (!category) throw new BusinessRuleError("Category not found.");
      if (category.slug) {
        throw new BusinessRuleError(
          `"${category.name}" is used by the invoice and payroll flows. Rename it instead.`,
        );
      }

      const [used] = await ctx.db
        .select({ value: count() })
        .from(ledgerEntries)
        .where(eq(ledgerEntries.categoryId, input.id));

      if (Number(used?.value ?? 0) > 0) {
        throw new BusinessRuleError(
          `"${category.name}" has ${used?.value} entries. Archive it instead.`,
        );
      }

      return ctx.db
        .delete(ledgerCategories)
        .where(eq(ledgerCategories.id, input.id))
        .returning();
    }),
  }),

  list: adminProcedure
    .input(
      z
        .object({
          month: monthSchema.optional(),
          direction: ledgerDirectionSchema.optional(),
          categoryId: z.uuid().optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) =>
      ctx.db.query.ledgerEntries.findMany({
        where: and(
          input?.month
            ? and(
                gte(ledgerEntries.date, `${input.month}-01`),
                lte(ledgerEntries.date, `${input.month}-31`),
              )
            : undefined,
          input?.direction
            ? eq(ledgerEntries.direction, input.direction)
            : undefined,
          input?.categoryId
            ? eq(ledgerEntries.categoryId, input.categoryId)
            : undefined,
        ),
        with: { category: true, coach: true, customer: true },
        orderBy: [desc(ledgerEntries.date), desc(ledgerEntries.createdAt)],
      }),
    ),

  create: adminProcedure
    .input(ledgerEntryInput)
    .mutation(async ({ ctx, input }) => {
      await assertCategoryMatches(ctx.db, input.categoryId, input.direction);
      return ctx.db
        .insert(ledgerEntries)
        .values({
          ...input,
          coachId: input.coachId ?? null,
          customerId: input.customerId ?? null,
        })
        .returning();
    }),

  update: adminProcedure
    .input(updateLedgerEntryInput)
    .mutation(async ({ ctx, input }) => {
      const { id, ...values } = input;
      const entry = await requireEditableEntry(ctx.db, id);

      if (values.categoryId) {
        await assertCategoryMatches(
          ctx.db,
          values.categoryId,
          values.direction ?? entry.direction,
        );
      }

      return ctx.db
        .update(ledgerEntries)
        .set({
          ...values,
          coachId: values.coachId ?? null,
          customerId: values.customerId ?? null,
          updatedAt: new Date(),
        })
        .where(eq(ledgerEntries.id, id))
        .returning();
    }),

  delete: adminProcedure.input(idSchema).mutation(async ({ ctx, input }) => {
    await requireEditableEntry(ctx.db, input.id);
    return ctx.db
      .delete(ledgerEntries)
      .where(eq(ledgerEntries.id, input.id))
      .returning();
  }),
});

/** Invoice-booked rows are owned by the invoice — edit them from Invoices. */
async function requireEditableEntry(db: Db, id: string) {
  const entry = await db.query.ledgerEntries.findFirst({
    where: eq(ledgerEntries.id, id),
  });
  if (!entry) throw new BusinessRuleError("Entry not found.");
  if (entry.invoiceId) {
    throw new BusinessRuleError(
      "This row came from a paid invoice. Change it on the Invoices page.",
    );
  }
  return entry;
}

async function assertCategoryMatches(
  db: Db,
  categoryId: string,
  direction: "income" | "expense",
) {
  const category = await db.query.ledgerCategories.findFirst({
    where: and(
      eq(ledgerCategories.id, categoryId),
      or(
        eq(ledgerCategories.isArchived, false),
        isNull(ledgerCategories.isArchived),
      ),
    ),
  });
  if (!category) throw new BusinessRuleError("Pick an active category.");
  if (category.direction !== direction) {
    throw new BusinessRuleError(
      `"${category.name}" is an ${category.direction} category.`,
    );
  }
}
