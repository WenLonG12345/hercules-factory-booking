"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "#why", label: "Why" },
  { href: "#classes", label: "Classes" },
  { href: "#gallery", label: "Gallery" },
  { href: "#reviews", label: "Reviews" },
  { href: "#faq", label: "FAQ" },
];

/** N5 floating pill — shrinks once the hero is behind it. */
export function PublicHeader({
  ctaHref,
  ctaText,
}: {
  ctaHref: string;
  ctaText: string;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-4">
      <div
        className={`pointer-events-auto flex w-full max-w-5xl items-center justify-between gap-4 rounded-full border border-hairline px-4 backdrop-blur transition-all duration-300 ${
          scrolled
            ? "bg-[color-mix(in_oklab,var(--color-paper)_86%,transparent)] py-2"
            : "bg-[color-mix(in_oklab,var(--color-paper)_55%,transparent)] py-3"
        }`}
      >
        <Link className="flex items-center gap-2.5" href="/">
          <Image
            alt="Hercules Factory logo"
            className={`rounded-full transition-all duration-300 ${
              scrolled ? "size-8" : "size-10"
            }`}
            height={40}
            priority
            src="/logo.png"
            width={40}
          />
          <span className="font-display text-sm font-black uppercase tracking-[0.18em]">
            Hercules
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-dim md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              className="transition hover:text-ink"
              href={link.href}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          className="rounded-full bg-accent px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-ink transition hover:brightness-110"
          href={ctaHref}
          rel="noreferrer"
          target="_blank"
        >
          {ctaText}
        </a>
      </div>
    </header>
  );
}
