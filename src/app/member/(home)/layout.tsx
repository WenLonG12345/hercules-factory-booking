import { MemberAuthGuard } from "@/components/member/member-auth-guard";
import { MemberShell } from "@/components/member/member-shell";
import { Providers } from "@/components/providers";

export default function MemberPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <MemberShell>
        <MemberAuthGuard>{children}</MemberAuthGuard>
      </MemberShell>
    </Providers>
  );
}
