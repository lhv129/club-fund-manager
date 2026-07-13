/**
 * Cookie helpers — SERVER-ONLY.
 *
 * Tokens are stored in httpOnly cookies — never accessible via client JS.
 * Set by Route Handlers (login/refresh), read by Server Components + apiClient.
 *
 * ⚠️ This file imports `next/headers` — do NOT import from Client Components.
 * Only import from Server Components, Route Handlers, or apiClient (server-only).
 */
import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAMES, COOKIE_MAX_AGE } from "@/constants";

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/** Set auth cookies on a NextResponse. */
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
): void {
  response.cookies.set({
    ...BASE_COOKIE_OPTIONS,
    name: COOKIE_NAMES.accessToken,
    value: accessToken,
    maxAge: COOKIE_MAX_AGE.accessToken,
  });

  response.cookies.set({
    ...BASE_COOKIE_OPTIONS,
    name: COOKIE_NAMES.refreshToken,
    value: refreshToken,
    maxAge: COOKIE_MAX_AGE.refreshToken,
  });
}

/** Clear auth cookies on a NextResponse (logout). */
export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set({
    ...BASE_COOKIE_OPTIONS,
    name: COOKIE_NAMES.accessToken,
    value: "",
    maxAge: 0,
  });

  response.cookies.set({
    ...BASE_COOKIE_OPTIONS,
    name: COOKIE_NAMES.refreshToken,
    value: "",
    maxAge: 0,
  });
}

/** Read access token from cookies (server-side only). */
export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAMES.accessToken)?.value;
}

/** Read refresh token from cookies (server-side only). */
export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAMES.refreshToken)?.value;
}

/** Check if user is authenticated (server-side only). */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return !!token;
}
