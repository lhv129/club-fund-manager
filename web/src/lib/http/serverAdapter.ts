import "server-only";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { COOKIE_NAMES } from "@/constants";
import { API_URL } from "@/lib/config";
import { FALLBACK_LOCALE } from "@/lib/locales";
import { buildQueryString } from "./queryString";
import type { HttpAdapter } from "./types";

async function resolveLocale(override?: string): Promise<string> {
    if (override) return override;
    try {
        return await getLocale();
    } catch {
        return FALLBACK_LOCALE;
    }
}

function createRequest(localeOverride?: string) {
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
        const url = `${API_URL}${path}${isGet ? buildQueryString(payload as Record<string, unknown>) : ""}`;

        const res = await fetch(url, {
            method,
            headers: {
                Accept: "application/json",
                "Accept-Language": locale,
                locale,
                ...(isGet || isFormData ? {} : { "Content-Type": "application/json" }),
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body:
                isGet || method === "DELETE"
                    ? undefined
                    : isFormData
                        ? (payload as FormData)
                        : JSON.stringify(payload ?? {}),
            cache: "no-store",
        });

        return (await res.json().catch(() => null)) as T;
    };
}

/**
 * Factory — dùng khi cần truyền locale tường minh (vd: proxy route handler).
 * Locale lấy từ request.headers.get("Accept-Language") thay vì getLocale().
 *
 * @example
 * const locale = request.headers.get("Accept-Language") ?? FALLBACK_LOCALE;
 * const adapter = createServerAdapter(locale);
 */
export function createServerAdapter(localeOverride?: string): HttpAdapter {
    const request = createRequest(localeOverride);
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
        delete<T>(path: string) {
            return request<T>("DELETE", path);
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
