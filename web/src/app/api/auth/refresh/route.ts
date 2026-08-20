//src/app/api/auth/refresh/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { getRefreshToken, setAuthCookies, clearAuthCookies } from "@/lib/cookies";
import { refreshWithToken, type RefreshResult } from "@/lib/http/tokenRefresh";
import { FALLBACK_LOCALE } from "@/lib/locales";
import { APP_ROUTES } from "@/constants";


/**
 * Auth refresh route handler (Route Handler → cookies().set() hợp lệ).
 *
 * Hai chế độ:
 *  1. JSON (mặc định) — POST /api/auth/refresh: rotate cookies + trả JSON.
 *     Dùng cho client `authService.refresh()`.
 *  2. Redirect (có query `?next=<path>`) — GET/POST: rotate cookies rồi
 *     redirect về `next` (thành công) hoặc login (thất bại).
 *     Dùng cho Server Component recover session khi access_token hết hạn
 *     (vì SSR không set cookie được → phải nhờ Route Handler).
 *
 * `next` phải là path có locale prefix (vd /vi/admin). Tránh open redirect:
 *   - Bắt buộc bắt đầu bằng "/".
 *   - Loại bỏ prefix "//" và "/api".
 */
function sanitizeNext(next: string | null, locale: string): string {
    const fallback = `/${locale}${APP_ROUTES.home}`;
    if (!next || !next.startsWith("/") || next.startsWith("//")) {
        return fallback;
    }
    if (next.startsWith("/api")) {
        return fallback;
    }
    return next;
}

function localeFromNext(next: string): string {
    const m = next.match(/^\/([a-z]{2})(\/|$)/i);
    return m ? m[1] : FALLBACK_LOCALE;
}

async function performRefresh(request: NextRequest): Promise<RefreshResult> {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
        return { ok: false, status: 401, message: "No refresh token" };
    }

    // Dùng chung single-flight + grace period với serverAdapter (proxy) —
    // tránh 2 đường refresh cùng đánh một refresh_token khiến Laravel
    // rotate 2 lần và request thua cuộc bị clear cookie oan.
    const locale = request.headers.get("Accept-Language") ?? FALLBACK_LOCALE;
    return refreshWithToken(refreshToken, locale);
}

async function handle(request: NextRequest) {
    const url = request.nextUrl;
    const next = url.searchParams.get("next");
    const isRedirectMode = next !== null;

    try {
        const result = await performRefresh(request);

        if (!result.ok) {
            if (isRedirectMode) {
                const locale = localeFromNext(next);
                const safeNext = sanitizeNext(next, locale);

                // Chỉ 401/403 mới là session thật sự invalid → login + clear cookie.
                // Lỗi khác (5xx/network) là tạm thời: GIỮ cookie, trả 503 để tránh
                // redirect loop giữa middleware (bounce về home vì còn token) và
                // SSR recovery (redirect sang refresh vì hết access_token).
                if (result.status === 401 || result.status === 403) {
                    const loginUrl = new URL(`/${locale}${APP_ROUTES.login}`, request.url);
                    loginUrl.searchParams.set("redirect", safeNext);
                    const res = NextResponse.redirect(loginUrl);
                    clearAuthCookies(res);
                    return res;
                }

                return new NextResponse("Session refresh temporarily unavailable. Please retry.", {
                    status: 503,
                });
            }

            const res = NextResponse.json(
                { success: false, message: result.message, data: null },
                { status: result.status },
            );
            // Clear cookies nếu refresh token thực sự invalid (401/403),
            // tránh trạng thái cookie stale gây redirect loop.
            if (result.status === 401 || result.status === 403) {
                clearAuthCookies(res);
            }
            return res;
        }

        if (isRedirectMode) {
            const locale = localeFromNext(next);
            const safeNext = sanitizeNext(next, locale);
            const res = NextResponse.redirect(new URL(safeNext, request.url));
            setAuthCookies(res, result.access_token, result.refresh_token);
            return res;
        }

        const res = NextResponse.json({
            success: true,
            message: result.message,
            data: null,
        });
        setAuthCookies(res, result.access_token, result.refresh_token);
        return res;
    } catch {
        return NextResponse.json(
            { success: false, message: "Internal server error", data: null },
            { status: 500 },
        );
    }
}

// GET dùng cho redirect mode (SSR recovery). Nếu không có `?next` thì coi
// như JSON mode (rotate cookies + trả JSON) cho tương thích.
export async function GET(request: NextRequest) {
    return handle(request);
}

export async function POST(request: NextRequest) {
    return handle(request);
}
