import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/cookies";

/**
 * POST /api/auth/logout
 *
 * Clears auth cookies. Client-side logout only — backend has no logout endpoint.
 */
export async function POST() {
  const nextResponse = NextResponse.json({
    success: true,
    message: "Logged out",
    data: null,
  });

  clearAuthCookies(nextResponse);

  return nextResponse;
}
