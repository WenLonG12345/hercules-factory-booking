"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;
    if (!session) router.replace("/admin/login");
    else if (session.user.role !== "admin") router.replace("/member");
  }, [session, isPending, router]);

  if (isPending || !session || session.user.role !== "admin") {
    return <div className="p-8 text-sm text-stone-400">Loading…</div>;
  }

  return <>{children}</>;
}
