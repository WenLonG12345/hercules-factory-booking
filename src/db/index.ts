import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

declare global {
  var __db: ReturnType<typeof drizzle<typeof schema>> | null | undefined; // eslint-disable-line no-var
}

function createDb() {
  if (!connectionString) return null;
  const client = postgres(connectionString, { prepare: false, max: 10 });
  return drizzle(client, { schema });
}

export const db = globalThis.__db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalThis.__db = db;
}

export function getDb() {
  if (!db) {
    throw new Error(
      "DATABASE_URL is not configured. Create .env.local from .env.example before using database actions.",
    );
  }

  return db;
}

export type Db = ReturnType<typeof getDb>;
