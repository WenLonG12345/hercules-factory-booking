import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

const queryClient = connectionString
  ? postgres(connectionString, { prepare: false, max: 10 })
  : null;

export const db = queryClient ? drizzle(queryClient, { schema }) : null;

export function getDb() {
  if (!db) {
    throw new Error(
      "DATABASE_URL is not configured. Create .env.local from .env.example before using database actions.",
    );
  }

  return db;
}

export type Db = ReturnType<typeof getDb>;
