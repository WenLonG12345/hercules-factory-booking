import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.TURSO_CONNECTION_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

declare global {
  var __db: ReturnType<typeof drizzle<typeof schema>> | null | undefined; // eslint-disable-line no-var
}

function createDb() {
  if (!url) return null;
  const client = createClient({ url, authToken });
  return drizzle(client, { schema });
}

export const db = globalThis.__db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalThis.__db = db;
}

export function getDb() {
  if (!db) {
    throw new Error(
      "TURSO_CONNECTION_URL is not configured. Create .env.local from .env.example before using database actions.",
    );
  }

  return db;
}

export type Db = ReturnType<typeof getDb>;
