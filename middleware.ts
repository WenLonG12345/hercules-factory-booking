import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/admin/login" ||
    pathname === "/member/login" ||
    pathname === "/member/register" ||
    pathname.startsWith("/member/register/")
  ) {
    return NextResponse.next();
  }

  // Fast-path cookie check — full session validation happens in the layout.
  const sessionToken =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");

  if (!sessionToken) {
    if (pathname.startsWith("/member")) {
      return NextResponse.redirect(new URL("/member/login", request.url));
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/member/:path*"],
};
