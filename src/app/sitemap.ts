import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getLandingData } from "@/server/services/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
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

  return routing.locales.map((locale) => ({
    url: href(locale),
    lastModified,
    changeFrequency: "weekly" as const,
    priority: locale === routing.defaultLocale ? 1 : 0.8,
    alternates: { languages },
  }));
}
