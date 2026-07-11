/**
 * Central app configuration — single source of truth.
 */

/** Laravel API base URL (server-side only). */
export const API_URL =
  process.env.API_URL ?? "http://localhost:8000/api/v1";

/** Next.js app base URL (for internal Route Handler calls). */
export const APP_URL =
  process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

/** Supported locales — must match i18n/routing.ts. */
export const LOCALES = ["vi", "en"] as const;
export const DEFAULT_LOCALE = "vi";

/** Default locale for API requests when none detected. */
export const FALLBACK_LOCALE = "vi";
