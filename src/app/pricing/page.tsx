import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { getPackages } from "@/server/services/queries";

export default async function PricingPage() {
  const packages = await getPackages();

  return (
    <main className="min-h-screen bg-stone-950 px-4 py-16 text-stone-50 md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link className="text-sm text-amber-300" href="/">
          Back to home
        </Link>
        <h1 className="mt-6 text-5xl font-black tracking-tight">Pricing</h1>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {packages.map((pkg) => (
            <div
              className="rounded-lg border border-white/10 bg-white/[0.04] p-6"
              key={pkg.id}
            >
              <h2 className="text-xl font-black">{pkg.name}</h2>
              <p className="mt-4 text-4xl font-black text-amber-300">
                {formatCurrency(pkg.priceCents)}
              </p>
              <ButtonLink className="mt-6 w-full" href="/member/login">
                Book this package
              </ButtonLink>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
