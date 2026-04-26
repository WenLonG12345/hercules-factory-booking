import Image from "next/image";
import Link from "next/link";
import { FaFacebook, FaInstagram } from "react-icons/fa";

const SOCIAL_LINKS = [
  {
    href: "https://www.instagram.com/herculesfactory_/",
    label: "Instagram",
    icon: FaInstagram,
  },
  {
    href: "https://www.facebook.com/p/Hercules-Factory-61561363850437/",
    label: "Facebook",
    icon: FaFacebook,
  },
];

const NAV_LINKS = [
  { href: "/#about", label: "About" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#schedule", label: "Schedule" },
  { href: "/member/login", label: "Member login" },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-stone-950 px-4 py-5 text-stone-100 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <Link href="/" className="inline-flex items-center gap-2.5 font-black">
          <Image
            alt="Hercules Factory logo"
            className="size-8 rounded"
            height={32}
            src="/logo.png"
            width={32}
          />
          <span className="text-sm">
            Hercules <span className="text-amber-300">Factory</span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="transition hover:text-stone-200"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
            <a
              href={href}
              key={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="text-stone-400 transition hover:text-amber-300"
            >
              <Icon className="size-4" />
            </a>
          ))}
        </div>

        <p className="text-xs text-stone-500">© 2026 Hercules Factory</p>
      </div>
    </footer>
  );
}
