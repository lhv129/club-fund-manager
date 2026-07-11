/**
 * App constants — routes, permissions, cookie names.
 */

/** Route paths used in sidebar + middleware (locale-prefixed paths). */
export const APP_ROUTES = {
  dashboard: "/",
  login: "/login",
  register: "/register",
  users: "/users",
  roles: "/roles",
  permissions: "/permissions",
  clubs: "/clubs",
  clubMembers: "/club-members",
  clubInvites: "/club-invites",
  settings: "/settings",
} as const;

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
