import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const lastModified = new Date();

  const href = (locale: string) =>
    locale === routing.defaultLocale ? siteUrl : `${siteUrl}/${locale}`;

  return routing.locales.map((locale) => ({
    url: href(locale),
    lastModified,
    changeFrequency: "weekly" as const,
    priority: locale === routing.defaultLocale ? 1 : 0.8,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((other) => [other, href(other)]),
      ),
    },
  }));
}
