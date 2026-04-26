import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function requireCustomer() {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!session) redirect("/member/login");

  const db = getDb();
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.authUserId, session.user.id))
    .limit(1);
  if (!customer) redirect("/member/register/complete");

  return { session, customer, db };
}

export function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function formatCents(cents: number) {
  return `RM ${(cents / 100).toFixed(2)}`;
}
