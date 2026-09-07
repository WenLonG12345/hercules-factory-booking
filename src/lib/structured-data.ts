import type { Locale } from "@/i18n/routing";
import type { LandingPage } from "@/lib/landing-pages";
import type { LandingData } from "@/server/services/queries";

/**
 * The landing page's JSON-LD `@graph`.
 *
 * No `review` / `aggregateRating` node: Google ignores review markup a business
 * publishes about itself, so the stars have to come from the Google Business
 * Profile. The `sameAs` link to that profile is what actually connects the two.
 */
export function landingJsonLd({
  data,
  locale,
  siteUrl,
  title,
  description,
}: {
  data: LandingData;
  locale: Locale;
  siteUrl: string;
  title: string;
  description: string;
}) {
  const { content, classes, pricing, faq, gallery, social } = data;
  const pageUrl = locale === "en" ? siteUrl : `${siteUrl}/${locale}`;
  const gymId = `${siteUrl}/#gym`;
  const websiteId = `${siteUrl}/#website`;
  const inLanguage = locale === "zh" ? "zh-Hans" : "en-MY";

  const prices = pricing.map((plan) => plan.priceCents).filter(Boolean);
  const images = [content?.heroImageUrl, ...gallery.map((i) => i.imageUrl)]
    .filter((url): url is string => Boolean(url))
    .slice(0, 6);

  const gym = {
    "@type": ["ExerciseGym", "SportsActivityLocation"],
    "@id": gymId,
    name: "Hercules Factory",
    description,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    ...(images.length ? { image: images } : {}),
    ...(content?.whatsappPhone
      ? { telephone: `+${content.whatsappPhone.replace(/\D/g, "")}` }
      : {}),
    // ponytail: hardcoded rather than parsed out of the CMS's one free-text
    // address line. Local search wants locality / postcode / region as separate
    // fields, the gym does not move, and splitting prose on commas would break
    // the first time someone retypes the line.
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jalan Cerdas, Taman Connaught",
      addressLocality: "Cheras",
      addressRegion: "Kuala Lumpur",
      postalCode: "56000",
      addressCountry: "MY",
    },
    // Mat time only. The kids class runs Sundays and PT is by appointment, but
    // neither has a fixed clock time to publish, and a wrong one in schema is
    // worse than a missing one.
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Thursday", "Friday"],
        opens: "19:00",
        closes: "22:00",
      },
    ],
    areaServed: [
      "Cheras",
      "Taman Connaught",
      "Kuala Lumpur",
      "Balakong",
      "Bandar Sungai Long",
      "Kajang",
      "Seri Kembangan",
    ].map((name) => ({ "@type": "Place", name })),
    // The embed URL is an iframe source; strip the flag to get the human map.
    ...(content?.mapEmbedUrl
      ? { hasMap: content.mapEmbedUrl.replace(/[&?]output=embed$/, "") }
      : {}),
    sameAs: [
      ...social.map((link) => link.url),
      ...(content?.googleReviewUrl ? [content.googleReviewUrl] : []),
    ],
    currenciesAccepted: "MYR",
    ...(prices.length
      ? {
          priceRange: `RM${Math.min(...prices) / 100}–RM${
            Math.max(...prices) / 100
          }`,
        }
      : {}),
    ...(pricing.length
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: content?.pricingTitle ?? "Pricing",
            itemListElement: pricing.map((plan) => ({
              "@type": "Offer",
              name: plan.name,
              price: (plan.priceCents / 100).toFixed(2),
              priceCurrency: "MYR",
              url: pageUrl,
              availability: "https://schema.org/InStock",
              ...(plan.unit
                ? {
                    priceSpecification: {
                      "@type": "UnitPriceSpecification",
                      price: (plan.priceCents / 100).toFixed(2),
                      priceCurrency: "MYR",
                      unitText: plan.unit,
                    },
                  }
                : {}),
            })),
          },
        }
      : {}),
    ...(classes.length
      ? {
          makesOffer: classes.map((offering) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: offering.name,
              description: offering.description,
              serviceType: "Muay Thai class",
              provider: { "@id": gymId },
            },
          })),
        }
      : {}),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      gym,
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: siteUrl,
        name: "Hercules Factory",
        publisher: { "@id": gymId },
        inLanguage,
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}/#webpage`,
        url: pageUrl,
        name: title,
        description,
        isPartOf: { "@id": websiteId },
        about: { "@id": gymId },
        ...(images[0] ? { primaryImageOfPage: images[0] } : {}),
        inLanguage,
      },
      ...(faq.length
        ? [
            {
              "@type": "FAQPage",
              "@id": `${pageUrl}/#faq`,
              isPartOf: { "@id": websiteId },
              mainEntity: faq.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
              })),
            },
          ]
        : []),
    ],
  };
}

/** `</script>` inside CMS copy would close the tag early. */
export const jsonLdScript = (graph: unknown) =>
  JSON.stringify(graph).replace(/</g, "\\u003c");

/**
 * JSON-LD for one of the search-landing pages in `landing-pages.ts`.
 *
 * Deliberately thinner than the homepage graph: the gym itself is described
 * once, on the homepage, and these pages point at that `@id` instead of
 * restating it. Repeating the whole `ExerciseGym` node on five URLs is how you
 * end up with five competing entities for one business.
 */
export function landingPageJsonLd({
  page,
  locale,
  siteUrl,
}: {
  page: LandingPage;
  locale: Locale;
  siteUrl: string;
}) {
  const home = locale === "en" ? siteUrl : `${siteUrl}/${locale}`;
  const pageUrl = `${home}/${page.slug}`;
  const inLanguage = locale === "zh" ? "zh-Hans" : "en-MY";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: page.title,
        description: page.description,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${siteUrl}/#gym` },
        inLanguage,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumbs`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Hercules Factory",
            item: home,
          },
          { "@type": "ListItem", position: 2, name: page.breadcrumb },
        ],
      },
      ...(page.faq.length
        ? [
            {
              "@type": "FAQPage",
              "@id": `${pageUrl}#faq`,
              isPartOf: { "@id": `${pageUrl}#webpage` },
              mainEntity: page.faq.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
              })),
            },
          ]
        : []),
    ],
  };
}
