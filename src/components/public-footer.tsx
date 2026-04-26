import { ArrowUpRight, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FaInstagram } from "react-icons/fa";

const ADDRESS =
  "Jalan Cerdas, Taman Connaught, 56000 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur";

const SOCIAL_LINKS = [
  {
    href: "https://www.instagram.com/herculesfactory_/",
    label: "Instagram",
    icon: FaInstagram,
  },
  {
    href: "https://www.facebook.com/p/Hercules-Factory-61561363850437/",
    label: "Facebook",
    icon: ArrowUpRight,
  },
];

export function PublicFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-red-900/50 bg-stone-950 px-4 py-14 text-stone-100 md:px-8 md:py-20">
      <div className="absolute inset-x-0 top-0 h-1 bg-red-700" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(180,83,9,0.18),transparent_56%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-4 font-black tracking-tight"
            >
              <Image
                alt="Hercules Factory logo"
                className="size-14 rounded-md"
                height={56}
                src="/logo.png"
                width={56}
              />
              <span className="text-xl">
                Hercules <span className="text-amber-300">Factory</span>
              </span>
            </Link>
          </div>

          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
              Follow
            </p>
            <div className="grid gap-3">
              {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
                <a
                  href={href}
                  key={href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between gap-4 border-b border-white/10 pb-3 text-sm font-bold text-stone-200 transition hover:border-amber-300/60 hover:text-amber-300"
                >
                  <span className="inline-flex items-center gap-3">
                    <Icon className="size-4 text-red-500 transition group-hover:text-amber-300" />
                    {label}
                  </span>
                  <ArrowUpRight className="size-4 opacity-60 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 md:mt-16 md:flex-row md:items-center md:justify-between">
          <p>Copyright 2026 Hercules Factory</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/#about" className="transition hover:text-stone-200">
              About
            </Link>
            <Link href="/#pricing" className="transition hover:text-stone-200">
              Pricing
            </Link>
            <Link href="/#schedule" className="transition hover:text-stone-200">
              Schedule
            </Link>
            <Link href="/member/login" className="transition hover:text-stone-200">
              Member login
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
