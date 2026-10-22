
import type { PermissionMap } from "@/domains/auth/types";

/**
 * Permission helpers — mirror backend User::hasPermission(module, action, clubId).
 *
 * Permission shapes:
 *   ["*"]                                     → bypass permissions
 *   { [module]: string[] }                    → system scope
 *   { ["club_{id}"]: { [module]: string[] } }  → club scope
 *   { ...merge... }                           → hybrid scope
 *
 * Quy tắc:
 * - Superadmin và System Admin được bypass toàn bộ permission.
 * - clubId = null / undefined → system scope.
 * - clubId = number → club scope tương ứng.
 * - Không fallback permission từ Club khác.
 */

// ─── Scope key helpers ─────────────────────────────────────────────

/** Build club scope key — mirror backend convention club_{id}. */
export function scopeKey(clubId: number): `club_${number}` {
  return `club_${clubId}`;
}

/** Check whether a key is a club_{number} scope key. */
export function isClubKey(key: string): key is `club_${number}` {
  return /^club_\d+$/.test(key);
}

// ─── System permissions ────────────────────────────────────────────

/**
 * Get permissions in system scope.
 *
 * Only flat module → actions entries are included.
 * Club-specific entries are excluded.
 *
 * Returns null when there are no system permissions.
 */
export function systemPermissions(
  perms: PermissionMap,
): Record<string, string[]> | null {
  if (Array.isArray(perms)) {
    return null;
  }

  const result: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(perms)) {
    if (isClubKey(key)) {
      continue;
    }

    if (Array.isArray(value)) {
      result[key] = value;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

// ─── Club permissions ──────────────────────────────────────────────

/**
 * Get permissions for one specific Club.
 *
 * Returns null when no permissions exist for that Club.
 */
export function clubPermissions(
  perms: PermissionMap,
  clubId: number,
): Record<string, string[]> | null {
  if (Array.isArray(perms)) {
    return null;
  }

  const value = perms[scopeKey(clubId)];

  if (!value || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, string[]>;
}

// ─── Permission check ──────────────────────────────────────────────

/**
 * Check whether a user can perform an action.
 *
 * Rules:
 * - Superadmin → bypass.
 * - System Admin → bypass.
 * - permissions === ["*"] → bypass.
 * - clubId null / undefined → system scope.
 * - clubId number → that specific Club scope.
 */
export function can(
  perms: PermissionMap | undefined | null,
  isSuperAdmin: boolean,
  module: string,
  action: string,
  clubId?: number | null,
  isSystemAdmin = false,
): boolean {
  // Global authorization bypass.
  // Must run before checking clubId or permissions.
  if (isSuperAdmin || isSystemAdmin) {
    return true;
  }

  // Legacy wildcard permission shape.
  if (Array.isArray(perms)) {
    return perms.includes("*");
  }

  if (!perms) {
    return false;
  }

  // SYSTEM SCOPE — flat module key.
  if (clubId == null) {
    const sys = systemPermissions(perms);

    return sys?.[module]?.includes(action) ?? false;
  }

  // CLUB SCOPE — only the requested club_{id}.
  const club = clubPermissions(perms, clubId);

  return club?.[module]?.includes(action) ?? false;
}

// ─── Club access ───────────────────────────────────────────────────

/**
 * Check whether a user can access a Club workspace.
 *
 * Superadmin and System Admin can access every Club.
 * Other users need at least one permission in that specific Club.
 */
export function canAccessClub(
  perms: PermissionMap | undefined | null,
  isSuperAdmin: boolean,
  clubId: number,
  isSystemAdmin = false,
): boolean {
  if (isSuperAdmin || isSystemAdmin) {
    return true;
  }

  if (Array.isArray(perms)) {
    return perms.includes("*");
  }

  if (!perms) {
    return false;
  }

  const club = clubPermissions(perms, clubId);

  if (!club) {
    return false;
  }

  return Object.values(club).some(
    (actions) => Array.isArray(actions) && actions.length > 0,
  );
}

// ─── Any Club permission ───────────────────────────────────────────

/**
 * Check whether a user can access the Club list / Club navigation.
 *
 * Superadmin and System Admin return true even without club_{id} keys.
 */
export function hasAnyClubPermission(
  perms: PermissionMap | undefined | null,
  isSuperAdmin: boolean,
  isSystemAdmin = false,
): boolean {
  if (isSuperAdmin || isSystemAdmin) {
    return true;
  }

  if (Array.isArray(perms)) {
    return perms.includes("*");
  }

  if (!perms) {
    return false;
  }

  return Object.keys(perms).some(isClubKey);
}

// ─── Club count ────────────────────────────────────────────────────

/**
 * Count club_{id} permission scopes.
 *
 * This counts explicit Club scopes only. It does not count global roles.
 */
export function clubPermissionCount(
  perms: PermissionMap | undefined | null,
): number {
  if (!perms || Array.isArray(perms)) {
    return 0;
  }

  return Object.keys(perms).filter(isClubKey).length;
}

// ─── Any system permission ─────────────────────────────────────────

/**
 * Check whether a user has access to the system area.
 *
 * Superadmin and System Admin always return true.
 * Other users need at least one flat system permission.
 */
export function hasAnySystemPermission(
  perms: PermissionMap | undefined | null,
  isSuperAdmin: boolean,
  isSystemAdmin = false,
): boolean {
  if (isSuperAdmin || isSystemAdmin) {
    return true;
  }

  if (Array.isArray(perms)) {
    return perms.includes("*");
  }

  if (!perms) {
    return false;
  }

  return systemPermissions(perms) !== null;
}
