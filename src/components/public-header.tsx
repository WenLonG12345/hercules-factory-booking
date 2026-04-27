"use client";

import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function PublicHeader() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const isMember = user && user.role === "customer";

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-stone-950/82 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 font-black tracking-tight"
        >
          <Image
            alt="Hercules Factory logo"
            className="size-10 rounded-md"
            height={40}
            priority
            src="/logo.png"
            width={40}
          />
          <span>
            Hercules <span className="text-amber-300">Factory</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-stone-300 md:flex">
          <a href="/#about">About</a>
          <a href="/#pricing">Pricing</a>
          <a href="/#schedule">Schedule</a>
          <a href="/#coaches">Coaches</a>
        </nav>
        {isMember ? (
          <Link
            href="/member"
            title={user.name ?? "Member portal"}
            className="flex size-10 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-stone-900 ring-2 ring-amber-400/40 transition hover:ring-amber-400"
          >
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "avatar"}
                width={40}
                height={40}
                className="size-10 rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </Link>
        ) : (
          <ButtonLink href="/member/login" className="h-10">
            Member login
          </ButtonLink>
        )}
      </div>
    </header>
  );
}
