"use client";

import { LOCALE_PATH_REGEX, FALLBACK_LOCALE } from "@/lib/locales";
import { buildQueryString } from "./queryString";
import type { HttpAdapter } from "./types";

/** Đọc locale từ URL — dùng regex động từ locales.ts, không hardcode. */
function getClientLocale(): string {
    if (typeof window !== "undefined") {
        const match = window.location.pathname.match(LOCALE_PATH_REGEX);
        if (match) return match[1];
    }
    return FALLBACK_LOCALE;
}

async function request<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    payload?: unknown
): Promise<T> {
    const isFormData = payload instanceof FormData;
    const isGet = method === "GET";
    const isDelete = method === "DELETE";
    const hasQuery = isGet || (isDelete && payload && !isFormData);
    const locale = getClientLocale();

    /**
     * PHP KHÔNG parse multipart/form-data cho PUT / PATCH request.
     * Laravel hỗ trợ _method spoofing: gửi POST + field _method=PUT/PATCH
     * thì Laravel tự route đúng vào controller update().
     *
     * Quy tắc:
     *   - FormData + PUT  → gửi POST, append _method=PUT  vào FormData
     *   - FormData + PATCH → gửi POST, append _method=PATCH vào FormData
     *   - JSON (không phải FormData) → gửi PUT/PATCH như bình thường (Laravel đọc được)
     */
    let actualMethod = method;
    let actualPayload: unknown = payload;

    if (isFormData && (method === "PUT" || method === "PATCH")) {
        // Clone FormData để không mutate object gốc của caller
        const fd = new FormData();
        for (const [key, val] of (payload as FormData).entries()) {
            fd.append(key, val);
        }
        fd.append("_method", method); // Laravel đọc _method để route đúng
        actualMethod = "POST";
        actualPayload = fd;
    }

    const url = `/api/proxy${path}${hasQuery ? buildQueryString(payload as Record<string, unknown>) : ""}`;

    const res = await fetch(url, {
        method: actualMethod,
        credentials: "include",
        headers: {
            // Không set Content-Type cho FormData — browser tự set boundary
            ...(isGet || actualPayload instanceof FormData ? {} : { "Content-Type": "application/json" }),
            "Accept-Language": locale,
        },
        body:
            isGet || method === "DELETE"
                ? undefined
                : actualPayload instanceof FormData
                    ? (actualPayload as FormData)
                    : JSON.stringify(actualPayload ?? {}),
    });

    return (await res.json().catch(() => null)) as T;
}

export const browserAdapter: HttpAdapter = {
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
    toggleStatus<T>(path: string) {
        return request<T>("POST", path);
    },
};
