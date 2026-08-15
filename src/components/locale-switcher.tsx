"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * Two links rather than a dropdown — there are exactly two locales, and links
 * keep it crawlable and working without JS. next-intl's `Link` also stores the
 * choice in a cookie, so the next visit lands on the right locale.
 */
export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const active = useLocale();
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("label")}
      className="flex items-center rounded-full border border-hairline p-0.5 text-[0.6875rem] font-black uppercase tracking-[0.1em]"
    >
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          aria-current={locale === active ? "true" : undefined}
          className={`rounded-full px-2 py-1 transition sm:px-2.5 ${
            locale === active
              ? "bg-accent text-accent-ink"
              : "text-ink-dim hover:text-ink"
          }`}
          href={pathname}
          locale={locale}
        >
          {t(locale)}
        </Link>
      ))}
    </nav>
  );
}
