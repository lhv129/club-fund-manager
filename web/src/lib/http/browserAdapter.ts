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
    const locale = getClientLocale();

    const url = `/api/proxy${path}${isGet ? buildQueryString(payload as Record<string, unknown>) : ""}`;

    const res = await fetch(url, {
        method,
        credentials: "include",
        headers: {
            ...(isGet || isFormData ? {} : { "Content-Type": "application/json" }),
            "Accept-Language": locale,
        },
        body:
            isGet || method === "DELETE"
                ? undefined
                : isFormData
                    ? (payload as FormData)
                    : JSON.stringify(payload ?? {}),
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
    delete<T>(path: string) {
        return request<T>("DELETE", path);
    },
    // Toggle trạng thái — PATCH không kèm body, BE tự đảo giá trị hiện tại
    // (VD: POST/PATCH /clubs/1/toggle-status).
    toggleStatus<T>(path: string) {
        return request<T>("POST", path);
    },
};
