import Image from "next/image";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getLandingPage, landingPageSlugs } from "@/lib/landing-pages";

/**
 * Ft5 statement footer — the statement itself now lives in the closing CTA band
 * on the page, so this is the mast row that closes it out on the same dark base.
 */
export async function PublicFooter({
  social,
}: {
  social: { id: string; label: string; url: string }[];
}) {
  const locale = (await getLocale()) as Locale;
  // The only crawlable path to the search-landing pages. Without a link from
  // every page of the site they are orphans — in the sitemap, but with nothing
  // pointing at them, which is close to worthless.
  const pages = landingPageSlugs
    .map((slug) => getLandingPage(locale, slug))
    .filter((page) => page !== undefined);

  return (
    <footer className="on-dark bg-paper px-4 pb-14 md:px-8">
      <nav className="mx-auto flex max-w-6xl flex-wrap gap-x-8 gap-y-3 border-t border-hairline pt-8 pb-8 text-sm text-ink-dim">
        {pages.map((page) => (
          <Link
            key={page.slug}
            className="transition hover:text-accent-2"
            href={`/${page.slug}`}
          >
            {page.breadcrumb}
          </Link>
        ))}
      </nav>

      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 border-t border-hairline pt-8">
        <div className="flex items-center gap-2.5">
          <Image
            alt="Hercules Factory logo"
            className="size-9 rounded"
            height={36}
            src="/logo.png"
            width={36}
          />
          <span className="font-display text-sm font-black uppercase tracking-[0.18em]">
            Hercules Factory
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-6 text-xs font-semibold uppercase tracking-[0.18em] text-ink-dim">
          {social.map((link) => (
            <a
              key={link.id}
              className="transition hover:text-accent-2"
              href={link.url}
              rel="noreferrer"
              target="_blank"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <p className="text-xs text-ink-dim">
          © {new Date().getFullYear()} Hercules Factory
        </p>
      </div>
    </footer>
  );
}
