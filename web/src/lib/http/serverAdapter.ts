import "server-only";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { COOKIE_NAMES, COOKIE_MAX_AGE } from "@/constants";
import { API_URL } from "@/lib/config";
import { FALLBACK_LOCALE } from "@/lib/locales";
import { ApiError } from "@/lib/errors";
import { buildQueryString } from "./queryString";
import { refreshWithToken } from "./tokenRefresh";
import type { HttpAdapter } from "./types";

async function resolveLocale(override?: string): Promise<string> {
    if (override) return override;
    try {
        return await getLocale();
    } catch {
        return FALLBACK_LOCALE;
    }
}

const BASE_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
};

/**
 * Dedupe + grace period cho refresh live ở `tokenRefresh.ts` (dùng chung
 * với /api/auth/refresh route handler) — xem comment ở đó.
 */

function clearAuthCookiesFromStore(cookieStore: Awaited<ReturnType<typeof cookies>>) {
    cookieStore.set({
        ...BASE_COOKIE_OPTIONS,
        name: COOKIE_NAMES.accessToken,
        value: "",
        maxAge: 0,
    });
    cookieStore.set({
        ...BASE_COOKIE_OPTIONS,
        name: COOKIE_NAMES.refreshToken,
        value: "",
        maxAge: 0,
    });
}

/**
 * Gọi Laravel /auth/refresh bằng refresh_token trong cookie,
 * rồi set lại access_token + refresh_token mới vào cookie.
 *
 * Trả về access_token mới, hoặc null nếu refresh thất bại.
 * Dùng cookies().set() trực tiếp — khả thi trong Route Handler
 * (Next.js 16). Server Component phải để autoRefresh = false và
 * recover qua ensureProfile → /api/auth/refresh.
 */
async function refreshAccessToken(locale: string): Promise<string | null> {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(COOKIE_NAMES.refreshToken)?.value;
    if (!refreshToken) return null;

    const result = await refreshWithToken(refreshToken, locale);
    if (!result.ok) {
        // Chỉ clear cookie khi refresh_token thật sự invalid (401/403).
        // Lỗi 5xx/network là tạm thời — giữ cookie để retry sau.
        if (result.status === 401 || result.status === 403) {
            clearAuthCookiesFromStore(cookieStore);
        }
        return null;
    }

    cookieStore.set({
        ...BASE_COOKIE_OPTIONS,
        name: COOKIE_NAMES.accessToken,
        value: result.access_token,
        maxAge: COOKIE_MAX_AGE.accessToken,
    });
    cookieStore.set({
        ...BASE_COOKIE_OPTIONS,
        name: COOKIE_NAMES.refreshToken,
        value: result.refresh_token,
        maxAge: COOKIE_MAX_AGE.refreshToken,
    });

    return result.access_token;
}

function createRequest(localeOverride?: string, autoRefresh = false) {
    return async function request<T>(
        method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
        path: string,
        payload?: unknown
    ): Promise<T> {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get(COOKIE_NAMES.accessToken)?.value;
        const locale = await resolveLocale(localeOverride);

        const isFormData = payload instanceof FormData;
        const isGet = method === "GET";
        const isDelete = method === "DELETE";
        const hasQuery = isGet || (isDelete && payload && !isFormData);
        const url = `${API_URL}${path}${hasQuery ? buildQueryString(payload as Record<string, unknown>) : ""}`;

        const buildHeaders = (token?: string) => ({
            Accept: "application/json",
            "Accept-Language": locale,
            locale,
            ...(isGet || isFormData ? {} : { "Content-Type": "application/json" }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        });

        const buildBody = () =>
            isGet || method === "DELETE"
                ? undefined
                : isFormData
                    ? (payload as FormData)
                    : JSON.stringify(payload ?? {});

        // Lưu ý: FormData chỉ consume được 1 lần → clone khi cần retry.
        let formDataSnapshot: FormData | undefined;
        if (isFormData) {
            formDataSnapshot = new FormData();
            for (const [key, val] of (payload as FormData).entries()) {
                formDataSnapshot.append(key, val);
            }
        }

        let res = await fetch(url, {
            method,
            headers: buildHeaders(accessToken),
            body: buildBody(),
            cache: "no-store",
        });

        // ─── 401 → thử refresh 1 lần rồi retry ────────────────────────────────
        // CHỈ bật ở Route Handler (/api/proxy) — nơi cookies().set() hợp lệ.
        // Server Component không set cookie được (Next.js 16), nên SSR không
        // auto-refresh ở đây (tránh rotate refresh_token mà không persist cookie).
        if (autoRefresh && res.status === 401) {
            const newToken = await refreshAccessToken(locale);
            if (newToken) {
                // Clone FormData cho retry (vì body đã bị consume)
                const retryBody = isFormData && formDataSnapshot
                    ? (() => {
                        const fd = new FormData();
                        for (const [key, val] of formDataSnapshot.entries()) {
                            fd.append(key, val);
                        }
                        return fd as BodyInit;
                    })()
                    : buildBody();

                res = await fetch(url, {
                    method,
                    headers: buildHeaders(newToken),
                    body: retryBody,
                    cache: "no-store",
                });
            }
        }

        return (await parseResponse<T>(res)) as T;
    };
}

/**
 * Parse response body thành JSON, throw ApiError khi HTTP error.
 *
 * Trước đây adapter nuốt mọi HTTP error (chỉ return JSON đã parse) → caller
 * không phân biệt được "không tồn tại" (404) với "token hết hạn" (401) hay
 * "backend đang lỗi" (5xx) — club layout từng biến tất cả thành 404 giả.
 *
 * Proxy route đã catch ApiError và map về JSON envelope + đúng status,
 * nên client-side qua /api/proxy không bị ảnh hưởng.
 */
async function parseResponse<T>(res: Response): Promise<T> {
    const json = await res.json().catch(() => null);

    if (!res.ok) {
        throw new ApiError(
            json?.message ?? `Request failed with status ${res.status}`,
            res.status,
            json?.code ?? "ERROR",
            json?.errors,
            json?.data,
        );
    }

    return json as T;
}

/**
 * Factory — dùng khi cần truyền locale tường minh (vd: proxy route handler).
 * Locale lấy từ request.headers.get("Accept-Language") thay vì getLocale().
 *
 * `autoRefresh: true` → bật refresh-on-401 + rotate cookie. CHỈ dùng trong
 * Route Handler ( nơi cookies().set() hợp lệ). Server Component phải để false
 * (mặc định) và dùng ensureProfile để recover session qua /api/auth/refresh.
 *
 * @example
 * const locale = request.headers.get("Accept-Language") ?? FALLBACK_LOCALE;
 * const adapter = createServerAdapter(locale, { autoRefresh: true });
 */
export function createServerAdapter(
    localeOverride?: string,
    options?: { autoRefresh?: boolean },
): HttpAdapter {
    const request = createRequest(localeOverride, options?.autoRefresh ?? false);
    return {
        get<T>(path: string, params?: Record<string, unknown>) {
            return request<T>("GET", path, params);
        },
        post<T>(path: string, body?: unknown) {
            return request<T>("POST", path, body);
        },
        put<T>(path: string, body?: unknown) {
            return request<T>("PUT", path, body);
        },
        patch<T>(path: string, body?: unknown) {
            return request<T>("PATCH", path, body);
        },
        delete<T>(path: string, params?: Record<string, unknown>) {
            return request<T>("DELETE", path, params);
        },
        // Toggle trạng thái — POST không kèm body, BE tự đảo giá trị hiện tại.
        toggleStatus<T>(path: string) {
            return request<T>("POST", path);
        },
    };
}

/**
 * Singleton dùng trong Server Components / domain services.
 * Tự resolve locale qua getLocale() của next-intl.
 */
export const serverAdapter: HttpAdapter = createServerAdapter();
