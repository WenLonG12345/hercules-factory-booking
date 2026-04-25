"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

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
