/**
 * API client — SERVER-ONLY.
 *
 * Reads JWT from httpOnly cookie, attaches Authorization + Accept-Language headers.
 * Auto-refreshes on 401 (calls /api/auth/refresh Route Handler), then retries once.
 *
 * ⚠️ Do NOT import from Client Components.
 * Use `authServiceClient` for client-side auth calls (Route Handlers via fetch).
 */

import "server-only";
import { ApiError } from "./errors";
import { getAccessToken, getRefreshToken } from "./cookies";
import { API_URL, APP_URL, FALLBACK_LOCALE } from "./config";
import type { ApiResponse } from "@/types/api";

/** Internal: resolve locale for Accept-Language header. */
async function resolveLocale(): Promise<string> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const nextLocale = cookieStore.get("NEXT_LOCALE")?.value;
  return nextLocale ?? FALLBACK_LOCALE;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  /** Skip auth header (for public endpoints like login/register). */
  skipAuth?: boolean;
  /** Internal: prevent infinite refresh loop. */
  _isRetry?: boolean;
}

/** Build query string from params object. */
function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return "";

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    searchParams.append(key, String(value));
  }

  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

/** Core fetch — throws ApiError on non-2xx. */
async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    params,
    headers = {},
    skipAuth = false,
    _isRetry = false,
  } = options;

  const url = `${API_URL}${path}${buildQueryString(params)}`;

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    "Accept-Language": await resolveLocale(),
    locale: await resolveLocale(),
    ...headers,
  };

  if (!skipAuth) {
    const token = await getAccessToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  if (body !== undefined && method !== "GET") {
    if (!(body instanceof FormData)) {
      requestHeaders["Content-Type"] = "application/json";
    }
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
    cache: "no-store",
  });

  // 401 → attempt refresh + retry once
  if (response.status === 401 && !skipAuth && !_isRetry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, { ...options, _isRetry: true });
    }
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 422 && json?.errors) {
      throw new ApiError(
        json.message ?? "Validation failed",
        422,
        json.code ?? "VALIDATION_ERROR",
        json.errors,
        json.data,
      );
    }

    throw new ApiError(
      json?.message ?? `Request failed with status ${response.status}`,
      response.status,
      json?.code ?? "ERROR",
      undefined,
      json?.data,
    );
  }

  return json as T;
}

/** Attempt to refresh tokens via Route Handler. Returns true on success. */
async function tryRefresh(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${APP_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  }
}

/** Public API methods — server-side only. */
export const apiClient = {
  get<T>(
    path: string,
    params?: Record<string, unknown>,
    options?: RequestOptions,
  ) {
    return request<T>(path, { ...options, method: "GET", params });
  },

  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return request<T>(path, { ...options, method: "POST", body });
  },

  put<T>(path: string, body?: unknown, options?: RequestOptions) {
    return request<T>(path, { ...options, method: "PUT", body });
  },

  patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return request<T>(path, { ...options, method: "PATCH", body });
  },

  delete<T>(path: string, options?: RequestOptions) {
    return request<T>(path, { ...options, method: "DELETE" });
  },
};
