/**
 * Auth service — CLIENT-SAFE.
 *
 * Không extend BaseRepository vì auth calls đi qua Route Handlers
 * (/api/auth/*) để quản lý httpOnly cookie — token không bao giờ
 * chạm client JS. Chỉ fix: bỏ hardcode locale regex.
 */

import type { ApiResponse } from "@/types/api";
import { API_URL } from "@/lib/config";
import { LOCALE_PATH_REGEX, FALLBACK_LOCALE } from "@/lib/locales";
import type { LoginPayload, LoginResponse, Profile, RegisterPayload } from "../types";

/** Đọc locale từ URL — dùng regex động, không hardcode. */
function getClientLocale(): string {
  if (typeof window !== "undefined") {
    const match = window.location.pathname.match(LOCALE_PATH_REGEX);
    if (match) return match[1];
  }
  return FALLBACK_LOCALE;
}

function getLocaleHeaders(): Record<string, string> {
  const locale = getClientLocale();
  return {
    Accept: "application/json",
    "Accept-Language": locale,
    locale,
  };
}

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

  async refresh(): Promise<boolean> {
    const response = await callRouteHandler<null>("/api/auth/refresh");
    return response.success;
  },

  async logout(): Promise<void> {
    await callRouteHandler<null>("/api/auth/logout");
  },
};
