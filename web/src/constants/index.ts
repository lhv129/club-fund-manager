/**
 * App constants — routes, permissions, cookie names.
 */

/**
 * Route paths used in sidebar + middleware (locale-prefixed paths).
 *
 * Hai khu vực:
 *  - Dashboard workspace  →  /dashboard/...   (system: clubs, users, roles, ...)
 *  - Club workspace   →  /club/[slug]/...   (một CLB cụ thể)
 */
export const APP_ROUTES = {
  // ── Auth ─────────────────────────────────────────────────────────────────
  login: "/login",
  register: "/register",

  // ── Dashboard workspace (system) ────────────────────────────────────────────
  dashboard: "/dashboard",
  adminDashboard: "/dashboard",
  adminClubs: "/dashboard/clubs",
  adminUsers: "/dashboard/users",
  adminRoles: "/dashboard/roles",
  adminPermissions: "/dashboard/permissions",
  adminSettings: "/dashboard/settings",
  noClub: "/dashboard/no-club",

  // ── Club workspace (route prefix; slug được ghép bằng clubRoute()) ────────
  club: "/club",
} as const;

/** Club workspace sub-routes — ghép với slug qua clubRoute(). */
export const CLUB_SUBROUTES = {
  dashboard: "dashboard",
  members: "members",
  invites: "invites",
  funds: "funds",
  events: "events",
  settings: "settings",
} as const;

/**
 * Build URL club workspace cho một CLB + sub-route.
 * @param slug  slug theo locale hiện tại (lấy từ club.translations)
 * @param sub   sub-route key từ CLUB_SUBROUTES (mặc định "dashboard")
 * @returns     path dạng "/club/{slug}[/{sub}]" (chưa có locale prefix —
 *              next-intl Link/useRouter tự thêm prefix)
 */
export function clubRoute(
  slug: string,
  sub: (typeof CLUB_SUBROUTES)[keyof typeof CLUB_SUBROUTES] = CLUB_SUBROUTES.dashboard,
): string {
  return `${APP_ROUTES.club}/${slug}/${sub}`;
}

/** Trang dashboard của một CLB. */
export function clubDashboardRoute(slug: string): string {
  return clubRoute(slug, CLUB_SUBROUTES.dashboard);
}

/** Auth-only routes (redirect to dashboard if already logged in). */
export const AUTH_ROUTES = [APP_ROUTES.login, APP_ROUTES.register];

/** Cookie names — httpOnly, set/read via Route Handlers + next/headers. */
export const COOKIE_NAMES = {
  accessToken: "access_token",
  refreshToken: "refresh_token",
} as const;

/** Cookie maxAge in seconds. */
export const COOKIE_MAX_AGE = {
  accessToken: 60 * 60, // 1 hour — matches JWT TTL
  refreshToken: 60 * 60 * 24 * 7, // 7 days — matches backend refresh token expiry
} as const;

/** Permission actions — match backend permission middleware. */
export const PERMISSION_ACTIONS = {
  view: "view",
  create: "create",
  update: "update",
  delete: "delete",
} as const;

/** Module slugs — match backend modules.slug. */
export const MODULE_SLUGS = {
  user: "user",
  role: "role",
  permission: "permission",
  module: "module",
  club: "club",
} as const;
