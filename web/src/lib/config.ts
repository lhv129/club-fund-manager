/**
 * Central app configuration — single source of truth.
 * Locale constants đã chuyển sang lib/locales.ts — import từ đó.
 */

/** Laravel API base URL (server-side only). */
export const API_URL = process.env.API_URL ?? "http://localhost:8000/api/v1";

export const API_URL_PUBLIC = process.env.API_URL_PUBLIC ?? "http://localhost:8000/storage";

/** Next.js app base URL (cho internal Route Handler calls). */
export const APP_URL = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
