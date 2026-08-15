import { defineRouting } from "next-intl/routing";

/**
 * English stays unprefixed (`/`) so the existing URL — and everything Google
 * has already indexed — does not move. Chinese lives at `/zh`.
 */
export const routing = defineRouting({
  locales: ["en", "zh"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
