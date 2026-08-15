"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  return (
    <Button
      className="h-9"
      variant="quiet"
      onClick={async () => {
        await authClient.signOut();
        router.push("/admin/login");
      }}
    >
      Sign out
    </Button>
  );
}
