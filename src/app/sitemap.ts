import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { landingPageSlugs } from "@/lib/landing-pages";
import { siteUrl } from "@/lib/site";
import { getLandingData } from "@/server/services/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getLandingData();

  // A `new Date()` here restamps every URL on every build, which teaches Google
  // to stop trusting lastmod. The newest CMS row is the page's real last edit.
  const edits = [
    data.content,
    ...data.why,
    ...data.classes,
    ...data.pricing,
    ...data.faq,
    ...data.gallery,
    ...data.reviews,
    ...data.social,
    // Demo-mode rows carry no timestamps, so the build date stands in below.
  ].map((row) => ("updatedAt" in row ? row.updatedAt.getTime() : 0));
  const newest = Math.max(0, ...edits);
  const lastModified = new Date(newest || Date.now());

  const href = (locale: string) =>
    locale === routing.defaultLocale ? siteUrl : `${siteUrl}/${locale}`;

  const languages = {
    ...Object.fromEntries(routing.locales.map((l) => [l, href(l)])),
    // Tells Google which URL to serve a searcher whose language matches neither.
    "x-default": href(routing.defaultLocale),
  };

  const home = routing.locales.map((locale) => ({
    url: href(locale),
    lastModified,
    changeFrequency: "weekly" as const,
    priority: locale === routing.defaultLocale ? 1 : 0.8,
    alternates: { languages },
  }));

  // The search-landing pages. Their copy lives in the repo rather than the CMS,
  // so the build date is genuinely their last edit — unlike the homepage above,
  // stamping it here does not lie to Google.
  const pages = landingPageSlugs.flatMap((slug) =>
    routing.locales.map((locale) => ({
      url: `${href(locale)}/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: locale === routing.defaultLocale ? 0.9 : 0.7,
      alternates: {
        languages: {
          ...Object.fromEntries(
            routing.locales.map((l) => [l, `${href(l)}/${slug}`]),
          ),
          "x-default": `${href(routing.defaultLocale)}/${slug}`,
        },
      },
    })),
  );

  return [...home, ...pages];
}
