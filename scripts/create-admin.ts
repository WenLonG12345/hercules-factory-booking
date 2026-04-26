/**
 * Creates an admin user in better-auth tables (auth_user + auth_account).
 * Run once against prod DB after first deploy:
 *   DATABASE_URL=<url> ADMIN_EMAIL=<email> ADMIN_PASSWORD=<pass> bun run db:create-admin
 */
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { authAccount, authUser } from "@/db/schema";

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!DATABASE_URL) throw new Error("DATABASE_URL is required");
  if (!ADMIN_EMAIL) throw new Error("ADMIN_EMAIL is required");
  if (!ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD is required");

  const { hashPassword } = await import(
    "../node_modules/better-auth/dist/crypto/password.mjs"
  );

  const client = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  const existing = await db
    .select({ id: authUser.id })
    .from(authUser)
    .where(eq(authUser.email, ADMIN_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    await client.end();
    return;
  }

  const userId = randomBytes(16).toString("hex");
  const accountId = randomBytes(16).toString("hex");
  const now = new Date();
  const hash = await hashPassword(ADMIN_PASSWORD);

  await db.insert(authUser).values({
    id: userId,
    name: "Hercules Factory Admin",
    email: ADMIN_EMAIL,
    emailVerified: true,
    role: "admin",
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(authAccount).values({
    id: accountId,
    accountId: userId,
    providerId: "credential",
    userId,
    password: hash,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Admin created: ${ADMIN_EMAIL}`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
