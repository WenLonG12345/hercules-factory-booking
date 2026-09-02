import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { FaqAccordion } from "@/components/faq-accordion";
import { PhotoProvider, PhotoView } from "@/components/photo-viewer";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { Reveal } from "@/components/reveal";
import { SiteFab } from "@/components/site-fab";
import { WhyIcon } from "@/components/why-icon";
import type { Locale } from "@/i18n/routing";
import { jsonLdScript, landingJsonLd } from "@/lib/structured-data";
import { whatsappLink } from "@/lib/utils";
import { getLandingData } from "@/server/services/queries";

export const revalidate = 300;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Home");
  const meta = await getTranslations("Metadata");
  const data = await getLandingData(locale);
  const {
    content,
    why,
    classes,
    pricing,
    faq,
    gallery,
    promo,
    reviews,
    social,
  } = data;

  // The one flagged row runs as the band below the ledger; the rest are rows.
  const trial = pricing.find((plan) => plan.highlight);
  const plans = pricing.filter((plan) => !plan.highlight);

  // Trial copy: line one of the CMS features is the tagline under the name,
  // every line after it prints as a note under the price.
  const [trialTagline, ...trialNotes] = (trial?.features ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const wa = (message?: string | null) =>
    whatsappLink(
      content?.whatsappPhone ?? "",
      message || content?.whatsappMessage || "Hi Hercules Factory!",
    );

  // Cents in the column, ringgit on the page. Whole prices print without the
  // trailing ".00" — RM220, not RM220.00.
  const price = (cents: number) =>
    `RM${(cents / 100).toLocaleString("en-MY", { maximumFractionDigits: 2 })}`;

  const featureLines = (features?: string | null) =>
    (features ?? "").split("\n").filter((line) => line.trim());

  const graph = landingJsonLd({
    data,
    locale,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    title: meta("title"),
    description: meta("description"),
  });

  return (
    <>
      {/* JSON-LD has no React equivalent — a script tag is the only carrier. */}
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: serialized JSON-LD, escaped by `jsonLdScript`
        dangerouslySetInnerHTML={{ __html: jsonLdScript(graph) }}
        type="application/ld+json"
      />
      <PublicHeader
        ctaHref={wa()}
        ctaText={content?.primaryCtaText ?? "BOOK A CLASS"}
      />

      <main>
        {/* 1 — Hero */}
        <section className="on-dark grain relative flex min-h-[92svh] items-end overflow-hidden bg-paper">
          {content?.heroImageUrl || content?.heroImageMobileUrl ? (
            // ponytail: plain <picture>, not next/image — art direction needs
            // two sources behind a media query, which <Image> cannot express,
            // and a hidden second <Image> would still be downloaded.
            <picture>
              {content.heroImageMobileUrl ? (
                <source
                  media="(max-width: 767px)"
                  srcSet={content.heroImageMobileUrl}
                />
              ) : null}
              <img
                alt=""
                className="ken-burns absolute inset-0 size-full object-cover"
                fetchPriority="high"
                src={content.heroImageUrl ?? content.heroImageMobileUrl ?? ""}
              />
            </picture>
          ) : null}
          <div className="absolute inset-0 bg-linear-to-t from-paper via-paper/70 to-paper/30" />

          <Reveal className="relative mx-auto w-full max-w-6xl px-4 pb-16 md:px-8 md:pb-24">
            {/* Hard-edged slab, not a pill — the CTA below is the page's only
                pill, and the scrim keeps it legible over any hero photograph.
                The right pad subtracts the trailing letter-space so the box
                reads optically centred. */}
            <p
              className="inline-flex border-2 border-accent-2 bg-scrim py-1.5 ps-3 pe-[calc(0.75rem-0.24em)] font-black text-accent-2 text-xs uppercase tracking-[0.24em]"
              data-reveal
            >
              {content?.heroKicker ?? "HERCULES FACTORY"}
            </p>
            <h1
              className="display mt-4 text-3xl tracking-wide"
              data-reveal
              style={{ "--i": 1 } as React.CSSProperties}
            >
              {content?.heroHeadline ?? "Muay Thai for everyone"}
            </h1>
            <p
              className="mt-6 max-w-xl text-(length:--text-lead) leading-relaxed text-ink-dim"
              data-reveal
              style={{ "--i": 2 } as React.CSSProperties}
            >
              {content?.heroSubtitle ?? "Beginners. Fitness. Fighters."}
            </p>
            <div
              className="mt-10"
              data-reveal
              style={{ "--i": 3 } as React.CSSProperties}
            >
              <a className="cta" href={wa()} rel="noreferrer" target="_blank">
                {content?.primaryCtaText ?? "BOOK A CLASS"}
              </a>
            </div>
          </Reveal>
        </section>

        {/* 2 — Why */}
        <Reveal as="section" className="mx-auto max-w-6xl px-4 py-24 md:px-8">
          <h2
            className="display section-head text-(length:--text-h2)"
            data-reveal
            id="why"
          >
            {content?.whyTitle ?? "Why Hercules Factory"}
          </h2>
          {/* Cards, but hard-edged plates — square corners, 2px ink rule, an
              accent slab on the top edge. The Classes grid below is soft and
              rounded with photography, so the two never read as one component. */}
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {why.map((item, index) => (
              <li
                key={item.id}
                className="flex flex-col border-2 border-ink border-t-[6px] border-t-accent bg-paper-2 p-6"
                data-reveal
                style={{ "--i": index } as React.CSSProperties}
              >
                {/* The uploaded CMS icon when there is one, otherwise the Game
                    Icons mark keyed off the row's emoji. The ordinal stays
                    opposite it so the ledger reading survives. */}
                <span
                  aria-hidden
                  className="flex h-11 items-center justify-between"
                >
                  {item.iconUrl ? (
                    <Image
                      alt=""
                      className="size-11 object-contain"
                      height={44}
                      src={item.iconUrl}
                      width={44}
                    />
                  ) : (
                    <WhyIcon
                      className="size-11 text-accent"
                      emoji={item.emoji}
                    />
                  )}
                  <span className="font-black text-sm tabular-nums tracking-[0.2em] text-ink-dim">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </span>
                <h3 className="display mt-4 text-(length:--text-h3) leading-tight">
                  {item.title}
                </h3>
                {item.description ? (
                  <p className="mt-3 text-(length:--text-body) leading-7 text-ink-dim">
                    {item.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* 3 — Classes */}
        <div className="bg-paper-3">
          <Reveal as="section" className="mx-auto max-w-6xl px-4 py-24 md:px-8">
            <h2
              className="display section-head text-(length:--text-h2)"
              data-reveal
              id="classes"
            >
              {content?.classesTitle ?? "Classes"}
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {classes.map((offering, index) => (
                <article
                  key={offering.id}
                  className="lift flex flex-col overflow-hidden rounded-2xl border border-hairline bg-paper-2"
                  data-reveal
                  style={{ "--i": index } as React.CSSProperties}
                >
                  {offering.imageUrl ? (
                    <div className="relative aspect-4/5 w-full">
                      <Image
                        alt={offering.name}
                        className="object-cover"
                        fill
                        sizes="(min-width: 768px) 33vw, 100vw"
                        src={offering.imageUrl}
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="display text-(length:--text-h3)">
                      {offering.name}
                    </h3>
                    <p className="mt-3 flex-1 text-ink-dim">
                      {offering.description}
                    </p>
                    <a
                      className="cta cta-sm cta-quiet mt-6"
                      href={wa(offering.whatsappMessage)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {t("enquire")}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        </div>

        {/* 3.5 — Pricing: a ruled rate card, not a card grid. The Why section
            owns the hard-edged plates and Classes owns the rounded photo
            cards, so the price list takes the third voice — hairline rows,
            name and features left, the figure right. */}
        {plans.length ? (
          <Reveal as="section" className="mx-auto max-w-6xl px-4 py-24 md:px-8">
            <h2
              className="display section-head text-(length:--text-h2)"
              data-reveal
              id="pricing"
            >
              {content?.pricingTitle ?? "Pricing"}
            </h2>
            <ul className="mt-14 border-ink border-t-2">
              {plans.map((plan, index) => (
                <li
                  key={plan.id}
                  className="grid gap-x-10 gap-y-4 border-hairline border-b py-8 sm:grid-cols-[minmax(0,1fr)_auto]"
                  data-reveal
                  style={{ "--i": index } as React.CSSProperties}
                >
                  <div className="min-w-0">
                    <h3 className="display text-(length:--text-h3) leading-tight">
                      {plan.name}
                    </h3>
                    <ul className="mt-3 grid gap-1.5 text-(length:--text-body) text-ink-dim">
                      {featureLines(plan.features).map((line) => (
                        <li
                          key={line}
                          className="before:me-2 before:font-black before:text-accent before:content-['—']"
                        >
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="sm:text-end">
                    <p className="display flex items-baseline gap-1.5 text-(length:--text-h2) tabular-nums sm:justify-end">
                      {price(plan.priceCents)}
                      {plan.unit ? (
                        <span className="font-normal text-(length:--text-body) text-ink-dim normal-case tracking-normal">
                          / {plan.unit}
                        </span>
                      ) : null}
                    </p>
                    <a
                      className="mt-3 inline-block whitespace-nowrap font-black text-accent text-sm uppercase tracking-[0.14em] underline underline-offset-4"
                      href={wa(plan.whatsappMessage)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {t("enquire")}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}

        {/* 3.6 — Trial: the one plan flagged in the CMS, lifted out of the
            ledger onto an accent ground. It is the only red band on the page,
            so it reads as the offer rather than as another price row.
            The CMS feature lines split in two: the first is the tagline under
            the name, the rest print as notes under the price. */}
        {trial ? (
          <div className="grain relative overflow-hidden bg-accent text-accent-ink">
            <Reveal
              as="section"
              className="mx-auto max-w-4xl px-4 py-20 text-center md:px-8 md:py-24"
            >
              <h2
                className="display text-(length:--text-h2) leading-[0.92]"
                data-reveal
                id="trial"
              >
                {trial.name}
              </h2>
              {trialTagline ? (
                <p
                  className="mt-4 text-(length:--text-lead) opacity-90"
                  data-reveal
                  style={{ "--i": 1 } as React.CSSProperties}
                >
                  {trialTagline}
                </p>
              ) : null}
              <p
                className="display mt-10 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 leading-none tabular-nums"
                data-reveal
                style={{ "--i": 2 } as React.CSSProperties}
              >
                <span aria-hidden="true" className="not-italic">
                  🥊
                </span>
                <span className="text-(length:--text-h3)">
                  {t("trialPriceLabel")}
                </span>
                <span className="text-(length:--text-price)">
                  {price(trial.priceCents)}
                </span>
                {trial.unit ? (
                  <span className="font-normal text-(length:--text-body) normal-case tracking-normal opacity-80">
                    / {trial.unit}
                  </span>
                ) : null}
              </p>
              {trialNotes.length ? (
                <ul
                  className="mt-4 grid gap-1 text-(length:--text-lead) opacity-90"
                  data-reveal
                  style={{ "--i": 3 } as React.CSSProperties}
                >
                  {trialNotes.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : null}
              <a
                className="cta cta-invert mt-10"
                data-reveal
                href={wa(trial.whatsappMessage)}
                rel="noreferrer"
                style={{ "--i": 4 } as React.CSSProperties}
                target="_blank"
              >
                {t("trialCta", { price: price(trial.priceCents) })}
              </a>
            </Reveal>
          </div>
        ) : null}

        {/* 3.7 — Promotion: one 9:16 poster at a time, straight to WhatsApp.
            Dark band so the offer is the loudest beat between the two light
            card grids around it. */}
        {promo ? (
          <div className="on-dark grain relative overflow-hidden bg-paper">
            <Reveal
              as="section"
              className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 md:grid-cols-[minmax(0,0.78fr)_minmax(0,1fr)] md:gap-16 md:px-8"
            >
              <div className="promo-frame mx-auto w-full max-w-80 md:mx-0">
                <PhotoProvider maskOpacity={0.9}>
                  <PhotoView src={promo.imageUrl}>
                    <Image
                      alt={promo.title}
                      className="promo-poster lift cursor-zoom-in"
                      data-reveal
                      height={1600}
                      sizes="(min-width: 768px) 340px, 80vw"
                      src={promo.imageUrl}
                      width={900}
                    />
                  </PhotoView>
                </PhotoProvider>
              </div>
              <div>
                <p
                  className="text-sm font-black uppercase tracking-[0.32em] text-accent-2"
                  data-reveal
                  style={{ "--i": 1 } as React.CSSProperties}
                >
                  {content?.promotionsTitle ?? "Promotions"}
                </p>
                <h2
                  className="display mt-4 text-(length:--text-h2) leading-[0.92]"
                  data-reveal
                  id="promotions"
                  style={{ "--i": 2 } as React.CSSProperties}
                >
                  {promo.title}
                </h2>
                <div
                  className="mt-10"
                  data-reveal
                  style={{ "--i": 3 } as React.CSSProperties}
                >
                  <a
                    className="cta"
                    href={wa(promo.whatsappMessage)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {t("promoCta")}
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        ) : null}

        {/* 4 — Gallery */}
        <Reveal as="section" className="mx-auto max-w-6xl px-4 py-24 md:px-8">
          <h2
            className="display section-head text-(length:--text-h2)"
            data-reveal
            id="gallery"
          >
            {content?.galleryTitle ?? "Gallery"}
          </h2>
          <p
            className="mt-4 max-w-xl text-(length:--text-lead) text-ink-dim"
            data-reveal
          >
            {t("galleryBlurb")}
          </p>
          <div className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-4">
            <PhotoProvider maskOpacity={0.9}>
              {gallery.map((image, index) => (
                <figure
                  key={image.id}
                  className={`lift relative overflow-hidden rounded-xl border border-hairline ${
                    index % 3 === 0 ? "aspect-4/5" : "aspect-square"
                  }`}
                  data-reveal
                  style={{ "--i": index } as React.CSSProperties}
                >
                  <PhotoView src={image.imageUrl}>
                    <Image
                      alt={image.alt}
                      className="cursor-zoom-in object-cover"
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      src={image.imageUrl}
                    />
                  </PhotoView>
                  {image.label || image.submittedBy ? (
                    <figcaption className="on-dark pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-scrim to-transparent px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-ink">
                      {image.label}
                      {image.submittedBy ? (
                        <span className="block font-normal normal-case tracking-normal text-ink-dim">
                          {t("sharedBy", { name: image.submittedBy })}
                        </span>
                      ) : null}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </PhotoProvider>
          </div>
        </Reveal>

        {/* 5 — Reviews */}
        {reviews.length ? (
          <div className="bg-paper-3">
            <Reveal
              as="section"
              className="mx-auto max-w-6xl px-4 py-24 md:px-8"
            >
              <div
                className="flex flex-wrap items-end justify-between gap-4"
                data-reveal
              >
                <h2
                  className="display section-head text-(length:--text-h2)"
                  id="reviews"
                >
                  {content?.testimonialsTitle ?? "What members say"}
                </h2>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-accent">
                  {t("reviewsSummary", {
                    rating: averageRating.toFixed(1),
                    count: reviews.length,
                  })}
                </p>
              </div>
              <div className="mt-12 grid gap-6 md:grid-cols-3">
                {reviews.map((review, index) => (
                  <figure
                    key={review.id}
                    className="lift flex flex-col rounded-2xl border border-hairline bg-paper-2 p-6"
                    data-reveal
                    style={{ "--i": index } as React.CSSProperties}
                  >
                    <p className="text-accent">
                      <span aria-hidden>{"★".repeat(review.rating)}</span>
                      <span className="sr-only">
                        {t("starsLabel", { rating: review.rating })}
                      </span>
                    </p>
                    <blockquote className="mt-4 flex-1 text-ink-dim">
                      “{review.quote}”
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3">
                      <span
                        aria-hidden
                        className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-black text-accent-ink"
                      >
                        {review.author.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="text-xs font-black uppercase tracking-[0.14em]">
                        {review.author}
                        <span className="block font-normal normal-case tracking-normal text-ink-dim">
                          {[review.source, review.reviewedAt]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </Reveal>
          </div>
        ) : null}

        {/* 6 — FAQ */}
        <Reveal as="section" className="mx-auto max-w-4xl px-4 py-24 md:px-8">
          <h2
            className="display section-head mb-12 text-(length:--text-h2)"
            data-reveal
            id="faq"
          >
            {content?.faqTitle ?? "FAQ"}
          </h2>
          <FaqAccordion items={faq} />
        </Reveal>

        {/* 7 — Location */}
        <Reveal as="section" className="mx-auto max-w-6xl px-4 py-24 md:px-8">
          <h2
            className="display section-head text-(length:--text-h2)"
            data-reveal
            id="location"
          >
            {content?.locationTitle ?? "Find us"}
          </h2>
          <p
            className="mt-6 max-w-xl text-(length:--text-lead) text-ink-dim"
            data-reveal
          >
            {content?.locationAddress}
          </p>
          {content?.mapEmbedUrl ? (
            <div
              className="mt-10 overflow-hidden rounded-2xl border border-hairline"
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

        {/* 8 — Closing CTA */}
        <Reveal as="section" className="on-dark bg-paper">
          <div className="mx-auto max-w-6xl px-4 py-28 md:px-8 md:py-36">
            <p
              className="text-sm font-black uppercase tracking-[0.32em] text-accent-2"
              data-reveal
            >
              {t("closingKicker")}
            </p>
            <h2
              className="display mt-5 max-w-4xl text-(length:--text-h2)"
              data-reveal
              style={{ "--i": 1 } as React.CSSProperties}
            >
              {t.rich("closingTitle", {
                br: () => <br />,
                accent: (chunks) => (
                  <span className="text-accent-2">{chunks}</span>
                ),
              })}
            </h2>
            <p
              className="mt-6 max-w-xl text-(length:--text-lead) leading-relaxed text-ink-dim"
              data-reveal
              style={{ "--i": 2 } as React.CSSProperties}
            >
              {t("closingBody")}
            </p>
            <div
              className="mt-10 flex flex-wrap gap-4"
              data-reveal
              style={{ "--i": 3 } as React.CSSProperties}
            >
              <a className="cta" href={wa()} rel="noreferrer" target="_blank">
                {content?.primaryCtaText ?? "BOOK A CLASS"}
              </a>
              <a className="cta cta-quiet" href="#classes">
                {t("seeClasses")}
              </a>
            </div>
          </div>
        </Reveal>
      </main>

      <SiteFab
        googleReviewHref={content?.googleReviewUrl ?? undefined}
        whatsappHref={wa()}
      />
      <PublicFooter social={social} />
    </>
  );
}
