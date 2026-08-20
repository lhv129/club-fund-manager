import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { COOKIE_NAMES, APP_ROUTES, AUTH_ROUTES } from "@/constants";

const intlMiddleware = createMiddleware(routing);

/**
 * Combined middleware: i18n + auth guard.
 *
 * Thứ tự xử lý:
 *  1. Skip API routes / Next internals / static files.
 *  2. Auth guard chạy TRƯỚC next-intl để không bị response của intlMiddleware
 *     "nuốt" redirect của auth guard:
 *     - Auth route (login/register) + còn access_token HOẶC refresh_token
 *       → redirect về home (recover session, không cho vào login).
 *     - Protected route + cả 2 token đều thiếu → redirect login (kèm ?redirect).
 *  3. Còn lại → nhường cho next-intl xử lý locale.
 *
 * Lưu ý: httpOnly cookie vẫn được gửi tới middleware (nằm trong header Cookie),
 * nên request.cookies.get() đọc được bình thường.
 */
export default async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Skip API routes và Next.js internals
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Xác định locale prefix để guard auth-route
  const locales = routing.locales;
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];
  const hasLocalePrefix =
    firstSegment !== undefined &&
    (locales as readonly string[]).includes(firstSegment);

  // Chưa có locale prefix → để next-intl xử lý redirect thêm locale.
  if (!hasLocalePrefix) {
    return intlMiddleware(request);
  }

  const locale = firstSegment;
  // pathAfterLocale: "/login", "/register", "/admin", "/club/xxx/dashboard", ...
  const pathAfterLocale = "/" + segments.slice(1).join("/");
  // Chuẩn hoá: bỏ trailing slash trừ root → "/login/" thành "/login"
  const normalizedPath =
    pathAfterLocale.length > 1 && pathAfterLocale.endsWith("/")
      ? pathAfterLocale.slice(0, -1)
      : pathAfterLocale;

  const accessToken = request.cookies.get(COOKIE_NAMES.accessToken)?.value;
  const refreshToken = request.cookies.get(COOKIE_NAMES.refreshToken)?.value;
  const hasAnyToken = !!(accessToken || refreshToken);

  // Auth route: login / register (chính xác, không match sub-path)
  const isAuthRoute = AUTH_ROUTES.includes(
    normalizedPath as (typeof AUTH_ROUTES)[number],
  );

  // 2a. Đã đăng nhập (còn token) → không cho vào login/register nữa
  if (isAuthRoute && hasAnyToken) {
    // /${locale} thay /${locale}/ để tránh trailing-slash fragment.
    const homeUrl = new URL(`/${locale}`, request.url);
    return NextResponse.redirect(homeUrl);
  }

  // 2b. Protected route + không token → về login (giữ ?redirect để quay lại)
  if (!isAuthRoute && !hasAnyToken) {
    const loginUrl = new URL(`/${locale}${APP_ROUTES.login}`, request.url);
    loginUrl.searchParams.set("redirect", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Còn lại → next-intl xử lý locale (rewrite/redirect thêm locale)
  const intlResponse = intlMiddleware(request);

  // Inject x-pathname vào request headers phía dưới (Server Component đọc
  // qua headers().get("x-pathname")) — dùng làm `next` khi recover session
  // sau refresh để quay lại đúng sub-page đang đứng thay vì dashboard.
  // next-intl đã set request headers qua convention x-middleware-override-headers
  // → append key của mình vào list đó.
  const overrideList = intlResponse.headers.get("x-middleware-override-headers");
  if (overrideList !== null) {
    intlResponse.headers.set(
      "x-middleware-override-headers",
      `${overrideList},x-pathname`,
    );
    intlResponse.headers.set("x-middleware-request-x-pathname", pathname);
  }

  return intlResponse;
}

export const config = {
  // Match all paths except API, _next, and static files
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};