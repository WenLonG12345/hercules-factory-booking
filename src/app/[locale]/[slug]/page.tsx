import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FaqAccordion } from "@/components/faq-accordion";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { Reveal } from "@/components/reveal";
import { SiteFab } from "@/components/site-fab";
import { type Locale, routing } from "@/i18n/routing";
import {
  getLandingPage,
  type LandingPageAside,
  landingPageSlugs,
} from "@/lib/landing-pages";
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
 *
 * Shape: Split Studio (see the stamp in `globals.css`). Every prose block is
 * paired with a panel of real material and the pairing alternates down the
 * page — the homepage's banded Marquee Hero would have made these read as four
 * more copies of the front page, and a single prose column would have made
 * them a wall. One or two sections per page carry no panel on purpose.
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
  const { content, gallery, pricing, reviews, social } = data;

  const wa = (message?: string) =>
    whatsappLink(
      content?.whatsappPhone ?? "",
      message || content?.whatsappMessage || "Hi Hercules Factory!",
    );

  const price = (cents: number) =>
    `RM${(cents / 100).toLocaleString("en-MY", { maximumFractionDigits: 2 })}`;

  const instagram = social.find((link) => link.url.includes("instagram"));

  const trial = pricing.find((plan) => plan.highlight);
  const plans = pricing.filter((plan) => !plan.highlight);

  // Each page starts at a different offset into the gallery and the reviews, so
  // the four of them don't all open on the same photograph and close on the
  // same quote. Deterministic, so a rebuild doesn't reshuffle the pages.
  const offset = landingPageSlugs.indexOf(page.slug);
  const photoAt = (n: number) =>
    gallery.length ? gallery[(offset + n) % gallery.length] : undefined;
  const review = reviews.length ? reviews[offset % reviews.length] : undefined;

  const faqItems = page.faq.map((item, index) => ({
    id: `${page.slug}-faq-${index}`,
    ...item,
  }));

  const graph = landingPageJsonLd({ page, locale, siteUrl });

  /** One proof panel. Photos come from the CMS; facts and lists from the page. */
  const Aside = ({
    aside,
    photoIndex,
  }: {
    aside: LandingPageAside;
    photoIndex: number;
  }) => {
    if (aside.kind === "photo") {
      const image = photoAt(photoIndex);
      if (!image) return null;
      return (
        <figure className="photo-plate relative aspect-4/5 w-full overflow-hidden">
          <Image
            alt={image.alt}
            className="object-cover"
            fill
            sizes="(min-width: 64rem) 40vw, 100vw"
            src={image.imageUrl}
          />
        </figure>
      );
    }

    if (aside.kind === "facts") {
      return (
        <div className="plate p-6 md:p-7">
          <h3 className="display text-(length:--text-h3) leading-tight">
            {aside.title}
          </h3>
          <dl className="mt-5">
            {aside.rows.map(([label, value]) => (
              <div key={label} className="fact-row">
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-ink-dim">
                  {label}
                </dt>
                <dd className="text-(length:--text-body) leading-6 sm:text-end">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      );
    }

    return (
      <div className="plate p-6 md:p-7">
        <h3 className="display text-(length:--text-h3) leading-tight">
          {aside.title}
        </h3>
        <ul className="tick-list mt-5 grid gap-3 text-(length:--text-body) leading-6 text-ink-dim">
          {aside.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    );
  };

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
        {/* 1 — Hero, H2 split diptych. Words left, one of the gym's own
            photographs right. Deliberately not the homepage's photographic
            fold: a searcher who lands here from Google gets the sentence that
            answers their query first, and the picture second. */}
        <Reveal
          as="section"
          className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-32 pb-20 md:px-8 md:pt-40 md:pb-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)] lg:gap-16"
        >
          <div>
            {/* Matches the BreadcrumbList in the JSON-LD above. */}
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs font-black uppercase tracking-[0.18em] text-ink-dim"
              data-reveal
            >
              <Link className="transition hover:text-accent" href="/">
                Hercules Factory
              </Link>
              <ChevronRight aria-hidden className="size-3.5 shrink-0" />
              <span className="text-ink">{page.breadcrumb}</span>
            </nav>
            <p
              className="mt-6 inline-flex border-2 border-accent bg-paper-2 py-1.5 ps-3 pe-[calc(0.75rem-0.24em)] font-black text-accent text-xs uppercase tracking-[0.24em]"
              data-reveal
              style={{ "--i": 1 } as React.CSSProperties}
            >
              {page.kicker}
            </p>
            <h1
              className="display mt-5 text-(length:--text-h1-page) leading-[0.95]"
              data-reveal
              style={{ "--i": 2 } as React.CSSProperties}
            >
              {page.h1}
            </h1>
            <p
              className="mt-6 max-w-xl text-(length:--text-lead) leading-relaxed text-ink-dim"
              data-reveal
              style={{ "--i": 3 } as React.CSSProperties}
            >
              {page.lede}
            </p>
            <div
              className="mt-9"
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
          </div>

          {photoAt(0) ? (
            <figure
              className="photo-plate relative order-first aspect-4/5 w-full overflow-hidden lg:order-none"
              data-reveal
              style={{ "--i": 2 } as React.CSSProperties}
            >
              <Image
                alt={photoAt(0)?.alt ?? ""}
                className="object-cover"
                fill
                // The hero image is the LCP element on this page — never lazy.
                priority
                sizes="(min-width: 64rem) 40vw, 100vw"
                src={photoAt(0)?.imageUrl ?? ""}
              />
            </figure>
          ) : null}
        </Reveal>

        {/* 2 — The prose, as diptych rows that alternate direction. A section
            with no panel runs at full measure; that break is what stops the
            alternation from becoming its own kind of monotony. */}
        <div className="bg-paper-3">
          <div className="mx-auto max-w-6xl px-4 py-24 md:px-8 md:py-28">
            {page.sections.map((section, index) => {
              const flip = index % 2 === 1;

              if (!section.aside) {
                return (
                  <Reveal
                    key={section.heading}
                    as="section"
                    className={`max-w-2xl ${index ? "mt-20 md:mt-24" : ""}`}
                  >
                    <h2
                      className="display section-head text-(length:--text-h2)"
                      data-reveal
                    >
                      {section.heading}
                    </h2>
                    {section.body.map((paragraph) => (
                      <p
                        key={paragraph.slice(0, 40)}
                        className="mt-5 text-(length:--text-body) leading-8 text-ink-dim"
                        data-reveal
                      >
                        {paragraph}
                      </p>
                    ))}
                  </Reveal>
                );
              }

              return (
                <Reveal
                  key={section.heading}
                  as="section"
                  className={`grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)] lg:gap-16 ${
                    index ? "mt-20 md:mt-24" : ""
                  }`}
                >
                  <div className={flip ? "lg:order-2" : undefined}>
                    <h2
                      className="display section-head text-(length:--text-h2)"
                      data-reveal
                    >
                      {section.heading}
                    </h2>
                    {section.body.map((paragraph) => (
                      <p
                        key={paragraph.slice(0, 40)}
                        className="mt-5 text-(length:--text-body) leading-8 text-ink-dim"
                        data-reveal
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {/* Sticky so a tall paragraph run doesn't drag its panel off
                      the top of the screen; unsticks below the lg breakpoint,
                      where the two halves are simply stacked. */}
                  <div
                    className={`lg:sticky lg:top-28 ${flip ? "lg:order-1" : ""}`}
                    data-reveal
                    style={{ "--i": 1 } as React.CSSProperties}
                  >
                    <Aside aside={section.aside} photoIndex={index + 1} />
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* 3 — One real review, set large. Borrowed credibility between the
            prose and the offer, and the only place on the page where the type
            is bigger than the H1. */}
        {review ? (
          <Reveal as="section" className="mx-auto max-w-4xl px-4 py-24 md:px-8">
            <figure>
              <p className="text-accent" data-reveal>
                <span aria-hidden>{"★".repeat(review.rating)}</span>
                <span className="sr-only">
                  {t("starsLabel", { rating: review.rating })}
                </span>
              </p>
              <blockquote
                className="display mt-6 text-(length:--text-h2) leading-[1.08] tracking-tight"
                data-reveal
                style={{ "--i": 1 } as React.CSSProperties}
              >
                “{review.quote}”
              </blockquote>
              <figcaption
                className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-ink-dim"
                data-reveal
                style={{ "--i": 2 } as React.CSSProperties}
              >
                {[review.author, review.source].filter(Boolean).join(" · ")}
              </figcaption>
            </figure>
          </Reveal>
        ) : null}

        {/* 4 — Trial band, live from the CMS so the price here can never drift
            from the homepage. The page's only accent ground. */}
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

        {/* 5 — Prices and questions, side by side. Two lists that both want a
            narrow measure, so pairing them fills the row instead of leaving a
            half-empty one, and the page gets a third kind of diptych. */}
        <Reveal
          as="section"
          className="mx-auto grid max-w-6xl gap-14 px-4 py-24 md:px-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] lg:gap-20"
        >
          {plans.length ? (
            <div>
              <h2
                className="display section-head text-(length:--text-h2)"
                data-reveal
                id="pricing"
              >
                {content?.pricingTitle ?? "Pricing"}
              </h2>
              <ul className="mt-10 border-ink border-t-2">
                {plans.map((plan, index) => (
                  <li
                    key={plan.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-hairline border-b py-5"
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
            </div>
          ) : null}

          {/* Page-specific questions — different on every page, which is what
              makes the FAQPage markup worth carrying. */}
          <div>
            <h2
              className="display section-head text-(length:--text-h2)"
              data-reveal
              id="faq"
            >
              {content?.faqTitle ?? "FAQ"}
            </h2>
            <div className="mt-10">
              <FaqAccordion items={faqItems} />
            </div>
          </div>
        </Reveal>

        {/* 6 — Location: the last diptych, address against the map. */}
        <div className="bg-paper-3">
          <Reveal
            as="section"
            className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-24 md:px-8 lg:grid-cols-[minmax(0,0.68fr)_minmax(0,1fr)] lg:gap-16"
          >
            <div>
              <h2
                className="display section-head text-(length:--text-h2)"
                data-reveal
                id="location"
              >
                {content?.locationTitle ?? "Find us"}
              </h2>
              <p
                className="mt-6 text-(length:--text-lead) leading-relaxed text-ink-dim"
                data-reveal
              >
                {content?.locationAddress}
              </p>
            </div>
            {content?.mapEmbedUrl ? (
              <div
                className="photo-plate overflow-hidden"
                data-reveal
                style={{ "--i": 1 } as React.CSSProperties}
              >
                <iframe
                  allowFullScreen
                  className="block aspect-video w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={content.mapEmbedUrl}
                  title={t("mapTitle")}
                />
              </div>
            ) : null}
          </Reveal>
        </div>

        {/* 7 — Closing CTA, with the way back to the full site under it. */}
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
        instagramHref={instagram?.url}
        whatsappHref={wa(page.whatsappMessage)}
      />
      <PublicFooter social={social} />
    </>
  );
}
