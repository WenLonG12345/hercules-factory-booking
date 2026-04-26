import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { auth } from "@/lib/auth";

export default async function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/admin/login");
  if (session.user.role !== "admin") redirect("/member");

  return <AdminShell>{children}</AdminShell>;
}
