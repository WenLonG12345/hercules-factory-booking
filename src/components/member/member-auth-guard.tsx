"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/trpc";

export function MemberAuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const router = useRouter();

  const { data: hasProfile, isPending: profilePending } =
    api.portal.profileCheck.useQuery(undefined, {
      enabled: !!session,
      retry: false,
    });

  useEffect(() => {
    if (sessionPending) return;
    if (!session) {
      router.replace("/member/login");
      return;
    }
    if (profilePending) return;
    if (hasProfile === false) {
      router.replace("/member/register/complete");
    }
  }, [session, sessionPending, hasProfile, profilePending, router]);

  if (sessionPending || !session || profilePending || hasProfile === false) {
    return <div className="p-8 text-sm text-stone-500">Loading…</div>;
  }

  return <>{children}</>;
}
