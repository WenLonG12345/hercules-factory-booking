/**
 * One-time script: sets role="admin" on all existing auth_user rows.
 * Run before enabling the customer portal — all existing accounts are admins.
 *   DATABASE_URL=<url> bun run db:set-admin-roles
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { authUser } from "@/db/schema";

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error("DATABASE_URL is required");

  const client = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  const result = await db.update(authUser).set({ role: "admin" }).returning({
    email: authUser.email,
  });

  console.log(`Updated ${result.length} user(s) to role=admin:`);
  for (const u of result) console.log(`  ${u.email}`);

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
