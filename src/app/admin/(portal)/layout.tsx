import { AdminAuthGuard } from "@/components/admin/admin-auth-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { Providers } from "@/components/providers";

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <AdminShell>
        <AdminAuthGuard>{children}</AdminAuthGuard>
      </AdminShell>
    </Providers>
  );
}
