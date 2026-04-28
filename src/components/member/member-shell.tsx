"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiHistoryLine,
  RiHome5Line,
  RiLogoutBoxLine,
  RiQrCodeLine,
} from "react-icons/ri";
import { Toaster } from "sonner";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/member", label: "Home", icon: RiHome5Line, exact: true },
  { href: "/member/schedule", label: "Book", icon: RiCalendarLine },
  { href: "/member/check-in", label: "Check In", icon: RiQrCodeLine },
  {
    href: "/member/memberships",
    label: "Membership",
    icon: RiCheckboxCircleLine,
  },
  { href: "/member/attendance", label: "History", icon: RiHistoryLine },
];

export function MemberShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const userName = session?.user.name;

  function isActive(tab: (typeof tabs)[number]) {
    if (tab.exact) return pathname === tab.href;
    return pathname.startsWith(tab.href);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-orange-100 pb-20 text-stone-950">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link href="/member" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Hercules Factory"
              width={32}
              height={32}
              className="rounded-md"
            />
            <span className="text-sm font-black tracking-tight text-stone-950">
              Hercules Factory
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {userName ? (
              <span className="hidden text-xs text-stone-500 sm:block">
                {userName}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() =>
                authClient.signOut().then(() => {
                  window.location.href = "/member/login";
                })
              }
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-950"
            >
              <RiLogoutBoxLine className="size-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg">
          {tabs.map((tab) => {
            const active = isActive(tab);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition",
                  active
                    ? "text-red-700"
                    : "text-stone-500 hover:text-stone-900",
                )}
              >
                <tab.icon
                  className={cn(
                    "size-5",
                    active ? "text-red-700" : "text-stone-500",
                  )}
                />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <Toaster richColors position="top-right" />
    </div>
  );
}
