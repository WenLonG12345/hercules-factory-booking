/**
 * The public origin, used for every canonical, hreflang, og:url, sitemap and
 * JSON-LD `@id` on the site.
 *
 * ponytail: hardcoded in production rather than read from
 * `NEXT_PUBLIC_SITE_URL`, the same way the GA measurement ID is. The domain is
 * a constant, not a deployment knob, and when the env var drifted to the
 * `.vercel.app` preview alias every canonical on the live site pointed Google
 * at a duplicate of itself. Preview deploys also report `NODE_ENV=production`,
 * which is what we want: a preview must never canonicalise to its own URL.
 *
 * `auth-client.ts` and the invoice share link still read the env var — those
 * need the origin actually being served, not the marketing one.
 */
export const siteUrl =
  process.env.NODE_ENV === "production"
    ? "https://www.hercules-factory.com"
    : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");

/** Host part of {@link siteUrl}, for the canonical-host redirect in `proxy.ts`. */
export const siteHost = new URL(siteUrl).host;
