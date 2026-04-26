"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { completeRegistrationAction } from "@/app/member/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";

export default function RegisterCompletePage() {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    async (prev: { error?: string } | null, formData: FormData) => {
      const result = await completeRegistrationAction(prev, formData);
      if (result.customerId) {
        router.push("/member");
      }
      return result;
    },
    null,
  );

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-gradient-to-br from-stone-100 via-amber-50 to-orange-100 px-4">
      <div className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-amber-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-red-400/20 blur-3xl" />

      <Card className="relative w-full max-w-md border-stone-200/80 bg-white/80 p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Hercules Factory"
            width={72}
            height={72}
            className="mb-4 rounded-xl object-contain"
            priority
          />
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
            One more step
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900">
            Your phone number
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            We use your phone to link your account to any existing membership
            records.
          </p>
        </div>

        <form className="grid gap-4" action={action}>
          {state?.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-200">
              {state.error}
            </p>
          ) : null}
          <Field label="Phone number (WhatsApp)">
            <Input
              name="phone"
              required
              minLength={8}
              type="tel"
              placeholder="+601234567890"
              autoComplete="tel"
            />
          </Field>
          <Button className="mt-2 w-full" disabled={pending} type="submit">
            {pending ? "Setting up…" : "Complete setup"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
