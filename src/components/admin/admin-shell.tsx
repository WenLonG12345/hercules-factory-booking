import Image from "next/image";
import Link from "next/link";
import { Toaster } from "sonner";
import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/admin/sign-out-button";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-stone-200 bg-stone-950 text-stone-100 lg:block">
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <Image
              alt="Hercules Factory logo"
              className="size-11 rounded-md"
              height={44}
              src="/logo.png"
              width={44}
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                Hercules
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight">
                Factory HQ
              </h1>
            </div>
          </div>
        </div>
        <nav className="grid gap-1 p-3">
          <AdminNav />
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              className="flex items-center gap-2 font-black tracking-tight lg:hidden"
              href="/admin"
            >
              <Image
                alt="Hercules Factory logo"
                className="size-9 rounded-md"
                height={36}
                src="/logo.png"
                width={36}
              />
              Hercules HQ
            </Link>
            <div className="hidden text-sm text-stone-500 lg:block">
              Admin portal for classes, members, payments, and content.
            </div>
            <div className="flex items-center gap-2">
              <details className="relative lg:hidden">
                <summary className="list-none rounded-md bg-stone-950 px-3 py-2 text-sm font-semibold text-white marker:hidden">
                  Menu
                </summary>
                <nav className="absolute right-0 top-12 z-50 grid w-64 gap-1 rounded-lg border border-white/10 bg-stone-950 p-3 shadow-2xl">
                  <AdminNav />
                </nav>
              </details>
              <SignOutButton />
            </div>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
      <Toaster richColors />
    </div>
  );
}

export function PageHeader({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-700">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-3xl font-black tracking-tight text-stone-950">
          {title}
        </h1>
      </div>
      {children}
    </div>
  );
}
