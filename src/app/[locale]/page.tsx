import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { FaqAccordion } from "@/components/faq-accordion";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { Reveal } from "@/components/reveal";
import { SiteFab } from "@/components/site-fab";
import type { Locale } from "@/i18n/routing";
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
  const { content, why, classes, faq, gallery, reviews, social } =
    await getLandingData(locale);

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const wa = (message?: string | null) =>
    whatsappLink(
      content?.whatsappPhone ?? "",
      message || content?.whatsappMessage || "Hi Hercules Factory!",
    );

  return (
    <>
      <PublicHeader
        ctaHref={wa()}
        ctaText={content?.primaryCtaText ?? "BOOK A CLASS"}
      />

      <main>
        {/* 1 — Hero */}
        <section className="on-dark grain relative flex min-h-[92svh] items-end overflow-hidden bg-paper">
          {content?.heroImageUrl ? (
            <Image
              alt=""
              className="ken-burns absolute inset-0 size-full object-cover"
              fill
              priority
              sizes="100vw"
              src={content.heroImageUrl}
            />
          ) : null}
          <div className="absolute inset-0 bg-linear-to-t from-paper via-paper/70 to-paper/30" />

          <Reveal className="relative mx-auto w-full max-w-6xl px-4 pb-16 md:px-8 md:pb-24">
            <p
              className="text-sm font-black uppercase tracking-[0.32em] text-accent-2"
              data-reveal
            >
              {content?.heroKicker ?? "HERCULES FACTORY"}
            </p>
            <h1
              className="display mt-4 text-(--text-display) leading-[0.86]"
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
            className="display section-head text-(--text-h2)"
            data-reveal
            id="why"
          >
            {content?.whyTitle ?? "Why Hercules Factory"}
          </h2>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {why.map((item, index) => (
              <li
                key={item.id}
                className="lift group flex flex-col rounded-2xl border border-hairline bg-paper-2 p-7 shadow-card"
                data-reveal
                style={{ "--i": index } as React.CSSProperties}
              >
                {/* Uploaded 3D icon when the CMS has one, emoji as the fallback —
                    both get the same lit disc and float/tilt treatment. */}
                <span aria-hidden className="icon-3d">
                  {item.iconUrl ? (
                    <Image
                      alt=""
                      className="size-11 object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.28)]"
                      height={44}
                      src={item.iconUrl}
                      width={44}
                    />
                  ) : (
                    <span className="text-3xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.25)]">
                      {item.emoji}
                    </span>
                  )}
                </span>
                <h3 className="display mt-5 text-(--text-h3) leading-tight">
                  {item.title}
                </h3>
                {item.description ? (
                  <p className="mt-3 text-[0.9375rem] leading-6 text-ink-dim">
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
              className="display section-head text-(--text-h2)"
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
                    <h3 className="display text-(--text-h3)">
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

        {/* 4 — Gallery */}
        <Reveal as="section" className="mx-auto max-w-6xl px-4 py-24 md:px-8">
          <h2
            className="display section-head text-(--text-h2)"
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
            {gallery.map((image, index) => (
              <figure
                key={image.id}
                className={`lift relative overflow-hidden rounded-xl border border-hairline ${
                  index % 3 === 0 ? "aspect-4/5" : "aspect-square"
                }`}
                data-reveal
                style={{ "--i": index } as React.CSSProperties}
              >
                <Image
                  alt={image.alt}
                  className="object-cover"
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  src={image.imageUrl}
                />
                {image.category || image.submittedBy ? (
                  <figcaption className="on-dark absolute inset-x-0 bottom-0 bg-linear-to-t from-scrim to-transparent px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-ink">
                    {image.category}
                    {image.submittedBy ? (
                      <span className="block font-normal normal-case tracking-normal text-ink-dim">
                        {t("sharedBy", { name: image.submittedBy })}
                      </span>
                    ) : null}
                  </figcaption>
                ) : null}
              </figure>
            ))}
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
                  className="display section-head text-(--text-h2)"
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
            className="display section-head mb-12 text-(--text-h2)"
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
            className="display section-head text-(--text-h2)"
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
              className="display mt-5 max-w-4xl text-(--text-h2)"
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

      <SiteFab whatsappHref={wa()} />
      <PublicFooter social={social} />
    </>
  );
}
