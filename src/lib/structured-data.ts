import type { Locale } from "@/i18n/routing";
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

  // ponytail: the CMS stores one free-text address line, so it goes in
  // `streetAddress` whole. Split it into locality/postal code only if Search
  // Console ever complains about the address shape.
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
    ...(content?.locationAddress
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: content.locationAddress,
            addressCountry: "MY",
          },
        }
      : {}),
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
