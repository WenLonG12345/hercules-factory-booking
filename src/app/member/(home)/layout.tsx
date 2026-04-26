import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MemberShell } from "@/components/member/member-shell";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { auth } from "@/lib/auth";

export default async function MemberPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);

  if (!session) redirect("/member/login");

  const db = getDb();
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.authUserId, session.user.id))
    .limit(1);

  if (!customer) redirect("/member/register/complete");

  return <MemberShell userName={session.user.name}>{children}</MemberShell>;
}
