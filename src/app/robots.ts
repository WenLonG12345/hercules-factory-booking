import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    // GPTBot, ClaudeBot, PerplexityBot and the rest are covered by the `*`
    // rule above and are deliberately allowed: being quotable in an AI answer
    // is the same win as ranking, for a gym nobody has heard of yet.
  };
}
