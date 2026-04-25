"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const data = new FormData(e.currentTarget);
    const result = await authClient.signIn.email({
      email: data.get("email") as string,
      password: data.get("password") as string,
    });

    setPending(false);

    if (result.error) {
      setError("Invalid admin email or password.");
    } else {
      router.push("/admin");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-stone-950 px-4 text-stone-50">
      <Card className="w-full max-w-md border-white/10 bg-stone-900 p-8 text-stone-50">
        <div className="mb-8">
          <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-red-700 text-white">
            <Dumbbell className="size-6" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
            Hercules Factory
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Admin sign in
          </h1>
          <p className="mt-2 text-sm text-stone-400">
            Manage members, bookings, attendance, invoices, and landing content.
          </p>
        </div>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {error ? (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}
          <Field label="Email">
            <Input autoComplete="email" name="email" required type="email" />
          </Field>
          <Field label="Password">
            <Input
              autoComplete="current-password"
              name="password"
              required
              type="password"
            />
          </Field>
          <Button className="mt-2 w-full" disabled={pending} type="submit">
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
