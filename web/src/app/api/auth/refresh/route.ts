import { NextResponse } from "next/server";
import { getRefreshToken, setAuthCookies, clearAuthCookies } from "@/lib/cookies";
import { API_URL } from "@/lib/config";
import { FALLBACK_LOCALE } from "@/lib/locales";


/**
 * POST /api/auth/refresh
 *
 * Reads refresh_token from httpOnly cookie.
 * Calls Laravel backend to rotate tokens.
 * Updates both cookies with new rotated values.
 */
export async function POST(request: Request) {
  try {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: "No refresh token",
          data: null,
        },
        { status: 401 },
      );
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

    const json = await response.json();

    if (!response.ok || !json.success) {
      // Clear cookies if refresh failed (token expired/invalid)
      const nextResponse = NextResponse.json(
        {
          success: false,
          message: json.message ?? "Refresh failed",
          data: null,
        },
        { status: response.status },
      );
      clearAuthCookies(nextResponse);
      return nextResponse;
    }

    const { access_token, refresh_token: newRefreshToken } = json.data;

    const nextResponse = NextResponse.json({
      success: true,
      message: json.message,
      data: null,
    });

    // Rotate cookies
    setAuthCookies(nextResponse, access_token, newRefreshToken);

    return nextResponse;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        data: null,
      },
      { status: 500 },
    );
  }
}
