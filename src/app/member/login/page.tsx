"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { authClient } from "@/lib/auth-client";

export default function MemberLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleEmail(e: React.FormEvent<HTMLFormElement>) {
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
      setError("Invalid email or password.");
    } else {
      router.push("/member");
    }
  }

  async function handleGoogle() {
    setPending(true);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/member",
    });
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-stone-950 px-4">
      <div className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-red-900/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-amber-900/20 blur-3xl" />

      <Card className="relative w-full max-w-md border-white/10 bg-white/4 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Hercules Factory"
            width={72}
            height={72}
            className="mb-4 rounded-xl object-contain"
            priority
          />
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
            Hercules Factory
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-50">
            Member sign in
          </h1>
          <p className="mt-2 text-sm text-stone-400">
            View your membership, bookings, and attendance.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={pending}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-md border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-medium text-stone-200 transition hover:bg-white/10 disabled:opacity-60"
        >
          <FcGoogle className="size-5" />
          Continue with Google
        </button>

        <div className="relative my-4 flex items-center">
          <div className="flex-1 border-t border-white/10" />
          <span className="mx-3 text-xs text-stone-500">or</span>
          <div className="flex-1 border-t border-white/10" />
        </div>

        <form className="grid gap-4" onSubmit={handleEmail}>
          {error ? (
            <p className="rounded-md bg-red-900/30 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/30">
              {error}
            </p>
          ) : null}
          <Field label="Email" className="text-stone-300">
            <Input autoComplete="email" name="email" required type="email" />
          </Field>
          <Field label="Password" className="text-stone-300">
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

        <p className="mt-6 text-center text-sm text-stone-400">
          No account?{" "}
          <Link
            href="/member/register"
            className="font-medium text-red-400 hover:underline"
          >
            Create one
          </Link>
        </p>
      </Card>
    </main>
  );
}
