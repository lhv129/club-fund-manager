/**
 * Auth service — CLIENT-SAFE.
 *
 * Used by client components (hooks, forms) for login/register/refresh/logout.
 * All token-sensitive operations go through Route Handlers (same-origin /api/auth/*)
 * which set/clear httpOnly cookies — tokens never touch client JS.
 *
 * NOTE: Does NOT extend BaseService because BaseService is server-only (uses
 * next/headers for cookies). Auth calls from client go through Route Handlers.
 */

import type { ApiResponse } from "@/types/api";
import { API_URL } from "@/lib/config";
import type { LoginPayload, LoginResponse, Profile, RegisterPayload } from "../types";

/** Read current locale from URL pathname (/vi/... or /en/...). */
function getClientLocale(): string {
  if (typeof window !== "undefined") {
    const match = window.location.pathname.match(/^\/(vi|en)(\/|$)/);
    if (match) return match[1];
  }
  return "vi";
}

/** Build headers with locale for backend SetLocale middleware. */
function getLocaleHeaders(): Record<string, string> {
  const locale = getClientLocale();
  return {
    Accept: "application/json",
    "Accept-Language": locale,
    locale,
  };
}

/**
 * Call a same-origin Route Handler.
 * Route Handlers manage httpOnly cookies — client never sees tokens.
 */
async function callRouteHandler<T>(
  path: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getLocaleHeaders(),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  return response.json();
}

export const authService = {
  /**
   * Login via Route Handler — sets httpOnly cookies.
   * Returns user profile (tokens never exposed to client JS).
   */
  async login(payload: LoginPayload): Promise<Profile> {
    const response = await callRouteHandler<LoginResponse>(
      "/api/auth/login",
      payload,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Login failed");
    }

    return response.data.user;
  },

  /**
   * Register — direct API call (no auth needed).
   * Backend returns success message, no tokens (email verification required).
   */
  async register(payload: RegisterPayload): Promise<ApiResponse<null>> {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    });

    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: getLocaleHeaders(),
      body: formData,
      cache: "no-store",
    });

    return response.json();
  },

  /** Refresh tokens via Route Handler — rotates httpOnly cookies. */
  async refresh(): Promise<boolean> {
    const response = await callRouteHandler<null>("/api/auth/refresh");
    return response.success;
  },

  /** Logout via Route Handler — clears httpOnly cookies. */
  async logout(): Promise<void> {
    await callRouteHandler<null>("/api/auth/logout");
  },
};
