import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * Reads the locale from the `[locale]` root param. This replaces the legacy
 * `setRequestLocale` call in every layout and page — static rendering now comes
 * for free, and an unknown locale 404s here instead of in the layout.
 */
export default getRequestConfig(async () => {
  const requested = await rootParams.locale();
  if (!hasLocale(routing.locales, requested)) notFound();

  return {
    locale: requested,
    messages: (await import(`../../messages/${requested}.json`)).default,
  };
});
