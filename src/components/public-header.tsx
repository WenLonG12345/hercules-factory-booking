"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";

const LINKS = [
  { href: "#why", key: "why" },
  { href: "#classes", key: "classes" },
  { href: "#gallery", key: "gallery" },
  { href: "#reviews", key: "reviews" },
  { href: "#faq", key: "faq" },
] as const;

/**
 * N5 floating pill — always dark, so it holds up over both the hero photograph
 * and the light paper below it. Shrinks once the hero is behind it.
 */
export function PublicHeader({
  ctaHref,
  ctaText,
}: {
  ctaHref: string;
  ctaText: string;
}) {
  const t = useTranslations("Nav");
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
        className={`on-dark pointer-events-auto flex w-full max-w-5xl items-center justify-between gap-3 rounded-full border border-hairline px-3 backdrop-blur transition-all duration-300 sm:px-4 ${
          scrolled
            ? "bg-[color-mix(in_oklab,var(--color-paper)_92%,transparent)] py-2 shadow-pill"
            : "bg-[color-mix(in_oklab,var(--color-paper)_58%,transparent)] py-2.5"
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
          {/* Wordmark drops out under 430px so the pill never wraps to two lines. */}
          <span className="hidden font-display text-xs font-black uppercase tracking-[0.14em] min-[430px]:inline sm:text-sm">
            Hercules Factory
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-dim md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              className="transition hover:text-ink"
              href={link.href}
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LocaleSwitcher />
          <a
            className="cta cta-sm"
            href={ctaHref}
            rel="noreferrer"
            target="_blank"
          >
            {ctaText}
          </a>
        </div>
      </div>
    </header>
  );
}
