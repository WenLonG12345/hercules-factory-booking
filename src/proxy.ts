import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { siteHost } from "@/lib/site";

const intlProxy = createMiddleware(routing);

/**
 * Next.js allows exactly one proxy, so the admin guard and next-intl's locale
 * negotiation share this file. `/admin` is never localized — the portal has a
 * single (English-reading) user — so it short-circuits before next-intl runs.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vercel keeps serving the production `.vercel.app` alias at 200 alongside
  // the real domain, and unlike branch previews it carries no `noindex`. That
  // is a whole duplicate site for Google to split our signals across, so send
  // it home. Branch previews (`*-git-*.vercel.app`) are left alone — they are
  // noindexed already and still need to be browsable.
  const host = request.headers.get("host");
  if (
    process.env.NODE_ENV === "production" &&
    host?.endsWith(".vercel.app") &&
    !host.includes("-git-")
  ) {
    const canonical = new URL(request.url);
    canonical.host = siteHost;
    canonical.protocol = "https:";
    canonical.port = "";
    return NextResponse.redirect(canonical, 308);
  }

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    // Fast-path cookie check — full session validation happens in the auth guard.
    const sessionToken =
      request.cookies.get("better-auth.session_token") ??
      request.cookies.get("__Secure-better-auth.session_token");

    if (!sessionToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next();
  }

  return intlProxy(request);
}

export const config = {
  // Everything except API routes, Next internals and files with an extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
