import { NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/cookies";
import { API_URL } from "@/lib/config";
import { FALLBACK_LOCALE } from "@/lib/locales";

/**
 * POST /api/auth/login
 *
 * Receives { login, password } from client.
 * Calls Laravel backend, sets httpOnly cookies with tokens.
 * Returns { user } to client (tokens never exposed to JS).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { login, password } = body;

    if (!login || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "login and password are required",
          data: null,
        },
        { status: 422 },
      );
    }

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Accept-Language": request.headers.get("Accept-Language") ?? FALLBACK_LOCALE,
        locale: request.headers.get("Accept-Language") ?? FALLBACK_LOCALE,
      },
      body: JSON.stringify({ login, password }),
      cache: "no-store",
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      return NextResponse.json(
        {
          success: false,
          message: json.message ?? "Login failed",
          data: null,
        },
        { status: response.status },
      );
    }

    const { access_token, refresh_token, user } = json.data;

    // Set httpOnly cookies — tokens never accessible via client JS
    const nextResponse = NextResponse.json({
      success: true,
      message: json.message,
      data: { user },
    });

    setAuthCookies(nextResponse, access_token, refresh_token);

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
