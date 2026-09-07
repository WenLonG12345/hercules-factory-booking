import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FaqAccordion } from "@/components/faq-accordion";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { Reveal } from "@/components/reveal";
import { SiteFab } from "@/components/site-fab";
import { type Locale, routing } from "@/i18n/routing";
import { getLandingPage, landingPageSlugs } from "@/lib/landing-pages";
import { siteUrl } from "@/lib/site";
import { jsonLdScript, landingPageJsonLd } from "@/lib/structured-data";
import { whatsappLink } from "@/lib/utils";
import { getLandingData } from "@/server/services/queries";

export const revalidate = 300;

/**
 * The search-landing pages — `/muay-thai-cheras`, `/kids-muay-thai-kl` and the
 * rest. One route renders all of them: the words come from `landing-pages.ts`,
 * everything that goes stale (prices, the trial offer, the address, the map)
 * is still read live from the CMS, so a price change on the homepage lands
 * here too without anyone remembering to update four more pages.
 */
export function generateStaticParams() {
  return landingPageSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const page = getLandingPage(locale, slug);
  if (!page) return {};

  const path = (l: string) =>
    l === routing.defaultLocale ? `/${slug}` : `/${l}/${slug}`;

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: path(locale),
      languages: {
        en: path("en"),
        zh: path("zh"),
        "x-default": path(routing.defaultLocale),
      },
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: path(locale),
      siteName: "Hercules Factory",
      locale: locale === "zh" ? "zh_MY" : "en_MY",
      type: "article",
    },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const page = getLandingPage(locale, slug);
  // `[slug]` sits at the site root, so it catches every unmatched URL. Anything
  // that is not one of ours is a 404, not an empty page.
  if (!page) notFound();

  const t = await getTranslations("Home");
  const data = await getLandingData(locale);
  const { content, pricing, social } = data;

  const wa = (message?: string) =>
    whatsappLink(
      content?.whatsappPhone ?? "",
      message || content?.whatsappMessage || "Hi Hercules Factory!",
    );

  const price = (cents: number) =>
    `RM${(cents / 100).toLocaleString("en-MY", { maximumFractionDigits: 2 })}`;

  const trial = pricing.find((plan) => plan.highlight);
  const plans = pricing.filter((plan) => !plan.highlight);

  const faqItems = page.faq.map((item, index) => ({
    id: `${page.slug}-faq-${index}`,
    ...item,
  }));

  const graph = landingPageJsonLd({ page, locale, siteUrl });

  return (
    <>
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: serialized JSON-LD, escaped by `jsonLdScript`
        dangerouslySetInnerHTML={{ __html: jsonLdScript(graph) }}
        type="application/ld+json"
      />
      <PublicHeader
        ctaHref={wa(page.whatsappMessage)}
        ctaText={content?.primaryCtaText ?? "BOOK A CLASS"}
      />

      <main>
        {/* Hero — the homepage photograph behind it, so a visitor landing here
            from search sees the same gym, but shorter: the words are the point
            of this page, not the picture. */}
        <section className="on-dark grain relative flex min-h-[62svh] items-end overflow-hidden bg-paper">
          {content?.heroImageUrl || content?.heroImageMobileUrl ? (
            <picture>
              {content.heroImageMobileUrl ? (
                <source
                  media="(max-width: 767px)"
                  srcSet={content.heroImageMobileUrl}
                />
              ) : null}
              <img
                alt=""
                className="absolute inset-0 size-full object-cover"
                fetchPriority="high"
                src={content.heroImageUrl ?? content.heroImageMobileUrl ?? ""}
              />
            </picture>
          ) : null}
          <div className="absolute inset-0 bg-linear-to-t from-paper via-paper/75 to-paper/40" />

          <Reveal className="relative mx-auto w-full max-w-6xl px-4 pb-16 md:px-8 md:pb-20">
            {/* Matches the BreadcrumbList in the JSON-LD above. */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.18em] text-ink-dim"
              data-reveal
            >
              <Link className="transition hover:text-accent-2" href="/">
                Hercules Factory
              </Link>
              <ChevronRight aria-hidden className="size-3.5" />
              <span className="text-ink">{page.breadcrumb}</span>
            </nav>
            <p
              className="mt-5 inline-flex border-2 border-accent-2 bg-scrim py-1.5 ps-3 pe-[calc(0.75rem-0.24em)] font-black text-accent-2 text-xs uppercase tracking-[0.24em]"
              data-reveal
              style={{ "--i": 1 } as React.CSSProperties}
            >
              {page.kicker}
            </p>
            <h1
              className="display mt-4 text-3xl tracking-wide"
              data-reveal
              style={{ "--i": 2 } as React.CSSProperties}
            >
              {page.h1}
            </h1>
            <p
              className="mt-6 max-w-2xl text-(length:--text-lead) leading-relaxed text-ink-dim"
              data-reveal
              style={{ "--i": 3 } as React.CSSProperties}
            >
              {page.lede}
            </p>
            <div
              className="mt-10"
              data-reveal
              style={{ "--i": 4 } as React.CSSProperties}
            >
              <a
                className="cta"
                href={wa(page.whatsappMessage)}
                rel="noreferrer"
                target="_blank"
              >
                {page.ctaLabel}
              </a>
            </div>
          </Reveal>
        </section>

        {/* Body copy — the part that is unique to this page and the only reason
            it ranks for anything. */}
        <Reveal as="section" className="mx-auto max-w-3xl px-4 py-24 md:px-8">
          {page.sections.map((section, index) => (
            <div
              key={section.heading}
              className={index ? "mt-16" : ""}
              data-reveal
              style={{ "--i": index } as React.CSSProperties}
            >
              <h2 className="display section-head text-(length:--text-h2)">
                {section.heading}
              </h2>
              {section.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  className="mt-5 text-(length:--text-body) leading-8 text-ink-dim"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </Reveal>

        {/* Trial band — live from the CMS, so the price here can never drift
            from the homepage. */}
        {trial ? (
          <div className="grain relative overflow-hidden bg-accent text-accent-ink">
            <Reveal
              as="section"
              className="mx-auto max-w-4xl px-4 py-20 text-center md:px-8"
            >
              <h2
                className="display text-(length:--text-h2) leading-[0.92]"
                data-reveal
              >
                {trial.name}
              </h2>
              <p
                className="display mt-8 flex flex-wrap items-baseline justify-center gap-x-3 leading-none tabular-nums"
                data-reveal
                style={{ "--i": 1 } as React.CSSProperties}
              >
                <span className="text-(length:--text-h3)">
                  {t("trialPriceLabel")}
                </span>
                <span className="text-(length:--text-price)">
                  {price(trial.priceCents)}
                </span>
              </p>
              <a
                className="cta cta-invert mt-10"
                data-reveal
                href={wa(page.whatsappMessage)}
                rel="noreferrer"
                style={{ "--i": 2 } as React.CSSProperties}
                target="_blank"
              >
                {t("trialCta", { price: price(trial.priceCents) })}
              </a>
            </Reveal>
          </div>
        ) : null}

        {/* Prices, as a ruled list — same live rows as the homepage, but no
            photos or feature bullets, so this page stays mostly its own words. */}
        {plans.length ? (
          <Reveal as="section" className="mx-auto max-w-3xl px-4 py-24 md:px-8">
            <h2
              className="display section-head text-(length:--text-h2)"
              data-reveal
              id="pricing"
            >
              {content?.pricingTitle ?? "Pricing"}
            </h2>
            <ul className="mt-12 border-ink border-t-2">
              {plans.map((plan, index) => (
                <li
                  key={plan.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1 border-hairline border-b py-5"
                  data-reveal
                  style={{ "--i": index } as React.CSSProperties}
                >
                  <h3 className="display text-(length:--text-h3) leading-tight">
                    {plan.name}
                  </h3>
                  <p className="display flex items-baseline gap-1.5 text-(length:--text-h3) tabular-nums">
                    {price(plan.priceCents)}
                    {plan.unit ? (
                      <span className="font-normal text-(length:--text-body) text-ink-dim normal-case tracking-normal">
                        / {plan.unit}
                      </span>
                    ) : null}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}

        {/* Page-specific FAQ — different questions on every page, which is what
            makes the FAQPage markup worth carrying. */}
        <Reveal as="section" className="mx-auto max-w-3xl px-4 py-24 md:px-8">
          <h2
            className="display section-head mb-10 text-(length:--text-h2)"
            data-reveal
            id="faq"
          >
            {content?.faqTitle ?? "FAQ"}
          </h2>
          <FaqAccordion items={faqItems} />
        </Reveal>

        {/* Location */}
        <Reveal as="section" className="mx-auto max-w-3xl px-4 pb-24 md:px-8">
          <h2
            className="display section-head text-(length:--text-h2)"
            data-reveal
            id="location"
          >
            {content?.locationTitle ?? "Find us"}
          </h2>
          <p
            className="mt-6 text-(length:--text-lead) text-ink-dim"
            data-reveal
          >
            {content?.locationAddress}
          </p>
          {content?.mapEmbedUrl ? (
            <div
              className="mt-8 overflow-hidden rounded-2xl border border-hairline"
              data-reveal
            >
              <iframe
                allowFullScreen
                className="aspect-video w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={content.mapEmbedUrl}
                title={t("mapTitle")}
              />
            </div>
          ) : null}
        </Reveal>

        {/* Closing CTA, with the way back to the full site under it. */}
        <Reveal as="section" className="on-dark bg-paper">
          <div className="mx-auto max-w-6xl px-4 py-24 md:px-8 md:py-28">
            <h2
              className="display max-w-3xl text-(length:--text-h2)"
              data-reveal
            >
              {t.rich("closingTitle", {
                br: () => <br />,
                accent: (chunks) => (
                  <span className="text-accent-2">{chunks}</span>
                ),
              })}
            </h2>
            <div
              className="mt-10 flex flex-wrap gap-4"
              data-reveal
              style={{ "--i": 1 } as React.CSSProperties}
            >
              <a
                className="cta"
                href={wa(page.whatsappMessage)}
                rel="noreferrer"
                target="_blank"
              >
                {page.ctaLabel}
              </a>
              <Link className="cta cta-quiet" href="/">
                {t("seeClasses")}
              </Link>
            </div>
          </div>
        </Reveal>
      </main>

      <SiteFab
        googleReviewHref={content?.googleReviewUrl ?? undefined}
        whatsappHref={wa(page.whatsappMessage)}
      />
      <PublicFooter social={social} />
    </>
  );
}
