import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * Reads the locale from the `[locale]` root param. This replaces the legacy
 * `setRequestLocale` call in every layout and page — static rendering now comes
 * for free, and an unknown locale 404s here instead of in the layout.
 *
 * Under `/admin` there is no `[locale]` segment, so the param is `undefined`.
 * The admin layout passes `locale`/`messages` to `NextIntlClientProvider`
 * explicitly, but the server-side provider still calls into this config for
 * `formats`/`now`/`timeZone` — so an absent param must fall back to English
 * rather than 404 the whole portal.
 */
export default getRequestConfig(async () => {
  const requested = await rootParams.locale();
  const locale =
    requested === undefined
      ? routing.defaultLocale
      : hasLocale(routing.locales, requested)
        ? requested
        : notFound();

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
