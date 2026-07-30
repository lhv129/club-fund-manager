//src/app/api/auth/refresh/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { getRefreshToken, setAuthCookies, clearAuthCookies } from "@/lib/cookies";
import { API_URL } from "@/lib/config";
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

type RefreshResult =
    | { ok: true; access_token: string; refresh_token: string; message?: string }
    | { ok: false; status: number; message?: string };

async function performRefresh(request: NextRequest): Promise<RefreshResult> {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
        return { ok: false, status: 401, message: "No refresh token" };
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Accept-Language": request.headers.get("Accept-Language") ?? FALLBACK_LOCALE,
            locale: request.headers.get("Accept-Language") ?? FALLBACK_LOCALE,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store",
    });

    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.success || !json?.data?.access_token) {
        return {
            ok: false,
            status: response.status,
            message: json?.message ?? "Refresh failed",
        };
    }

    return {
        ok: true,
        access_token: json.data.access_token,
        refresh_token: json.data.refresh_token,
        message: json.message,
    };
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
                const loginUrl = new URL(`/${locale}${APP_ROUTES.login}`, request.url);
                loginUrl.searchParams.set("redirect", safeNext);
                const res = NextResponse.redirect(loginUrl);
                clearAuthCookies(res);
                return res;
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
