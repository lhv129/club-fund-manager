import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { COOKIE_NAMES, APP_ROUTES, AUTH_ROUTES } from "@/constants";

const intlMiddleware = createMiddleware(routing);

/**
 * Combined middleware: i18n + auth guard.
 *
 * - API routes (/api/*): skip entirely
 * - Auth routes (login, register): redirect to dashboard if already logged in
 * - Protected routes: redirect to login if no access_token cookie
 * - Everything else: pass to next-intl for locale handling
 */
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes and Next.js internals
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Let next-intl handle locale resolution first
  const intlResponse = intlMiddleware(request);

  // Determine the locale-prefixed path for redirects
  const locales = routing.locales;
  const pathnameSegments = pathname.split("/").filter(Boolean);
  const firstSegment = pathnameSegments[0];
  const hasLocalePrefix =
    firstSegment !== undefined &&
    (locales as readonly string[]).includes(firstSegment);

  // If no locale prefix, let next-intl handle the redirect
  if (!hasLocalePrefix) {
    return intlResponse;
  }

  const locale = firstSegment;
  const pathAfterLocale = "/" + pathnameSegments.slice(1).join("/");
  const accessToken = request.cookies.get(COOKIE_NAMES.accessToken)?.value;

  // Auth routes — redirect to dashboard if already logged in
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathAfterLocale === route || pathAfterLocale === route + "/",
  );

  if (isAuthRoute && accessToken) {
    const dashboardUrl = new URL(`/${locale}${APP_ROUTES.dashboard}`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Protected routes — redirect to login if not authenticated
  if (!isAuthRoute && !accessToken) {
    const loginUrl = new URL(`/${locale}${APP_ROUTES.login}`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return intlResponse;
}

export const config = {
  // Match all paths except API, _next, and static files
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
