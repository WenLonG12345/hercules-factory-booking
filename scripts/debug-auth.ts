import postgres from "postgres";

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error("DATABASE_URL required");

  const client = postgres(DATABASE_URL, { max: 1, ssl: DATABASE_URL.includes("sslmode=require") ? "require" : false });

  const users = await client`
    SELECT id, email, email_verified, created_at FROM auth_user
  `;
  const accounts = await client`
    SELECT id, account_id, provider_id, user_id,
           password IS NOT NULL AS has_password,
           length(password) AS pw_len
    FROM auth_account
  `;

  console.log("=== auth_user ===");
  console.table(users);
  console.log("=== auth_account ===");
  console.table(accounts);

  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
