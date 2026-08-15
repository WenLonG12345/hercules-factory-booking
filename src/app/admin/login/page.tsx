"use client";

import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-gradient-to-br from-stone-100 via-amber-50 to-orange-100 px-4">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-amber-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-red-400/20 blur-3xl" />

      <Card className="relative w-full max-w-md border-stone-200/80 bg-white/80 p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Hercules Factory"
            width={80}
            height={80}
            className="mb-4 rounded-xl object-contain"
            priority
          />
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
            Hercules Factory
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900">
            Admin sign in
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Manage members, bookings, attendance, invoices, and landing content.
          </p>
        </div>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-200">
              {error}
            </p>
          ) : null}
          <Field label="Email">
            <Input autoComplete="email" name="email" required type="email" />
          </Field>
          <Field label="Password">
            <div className="relative">
              <Input
                autoComplete="current-password"
                className="w-full pr-11"
                name="password"
                required
                type={showPassword ? "text" : "password"}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center text-stone-400 transition hover:text-stone-700"
                onClick={() => setShowPassword((v) => !v)}
                type="button"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </Field>
          <Button className="mt-2 w-full" disabled={pending} type="submit">
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
