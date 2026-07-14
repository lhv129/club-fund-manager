import type { PermissionMap } from "@/domains/auth/types";

/**
 * Permission helpers — mirror backend `User::hasPermission(module, action, clubId)`.
 *
 * 4 shape của `permissions` (xem docs/permission-guide.md §2):
 *   ["*"]                                    → superadmin (bypass)
 *   { [module]: string[] }                   → admin (system scope, flat)
 *   { ["club_{id}"]: { [module]: string[] } } → owner/manager/member (club scope)
 *   { ...merge... }                          → hybrid (admin + club member)
 *
 * Quy tắc vàng: 2 scope KHÔNG mix — `clubId = null` → system scope,
 * `clubId = number` → club scope. KHÔNG fallback "any club".
 */

// ─── Scope key helpers ─────────────────────────────────────────────────────

/** Build club scope key — mirror backend quy ước `club_{id}`. */
export function scopeKey(clubId: number): `club_${number}` {
  return `club_${clubId}`;
}

/** Type guard: key có dạng `club_{number}` không. */
export function isClubKey(key: string): key is `club_${number}` {
  return /^club_\d+$/.test(key);
}

/**
 * Lấy module→actions ở SYSTEM scope (admin: user/role/permission/club/...).
 * Superadmin → null (bypass, không cần). Hybrid → chỉ lọc flat keys.
 *
 * @returns { module: [actions] } hoặc null nếu user không có system scope.
 */
export function systemPermissions(
  perms: PermissionMap,
): Record<string, string[]> | null {
  if (Array.isArray(perms)) return null; // superadmin bypass
  const result: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(perms)) {
    if (isClubKey(key)) continue; // bỏ club scope
    if (Array.isArray(value)) result[key] = value; // flat module → actions
  }
  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Lấy module→actions ở CLUB scope cho 1 club cụ thể.
 * Superadmin → null (bypass). Còn lại → lấy nested `club_{id}`.
 *
 * @returns { module: [actions] } hoặc null nếu user không có quyền ở club đó.
 */
export function clubPermissions(
  perms: PermissionMap,
  clubId: number,
): Record<string, string[]> | null {
  if (Array.isArray(perms)) return null; // superadmin bypass
  const key = scopeKey(clubId);
  const value = perms[key];
  if (!value || Array.isArray(value)) return null; // không phải club scope
  return value as Record<string, string[]>;
}

/**
 * Check permission — mirror backend `User::hasPermission(module, action, clubId)`.
 *
 * @param module   module slug (vd: 'club', 'user', 'member', 'fund')
 * @param action   action (vd: 'view', 'create', 'update', 'delete')
 * @param clubId   scope:
 *                 - undefined/null → SYSTEM SCOPE (admin/role/permission/user/...)
 *                 - number         → CLUB SCOPE (chỉ club cụ thể)
 *
 * Quy tắc:
 *   - is_superadmin → bypass tất cả
 *   - permissions === ["*"] → bypass tất cả
 *   - clubId == null → check system scope (flat module key)
 *   - clubId == number → check `club_{id}` key (nested)
 *
 * KHÔNG fallback "any club" khi clubId null — match backend hasPermission().
 */
export function can(
  perms: PermissionMap | undefined | null,
  isSuperAdmin: boolean,
  module: string,
  action: string,
  clubId?: number | null,
): boolean {
  if (isSuperAdmin) return true;
  if (Array.isArray(perms) && perms.includes("*")) return true;
  if (!perms || Array.isArray(perms)) return false;

  if (clubId == null) {
    // SYSTEM SCOPE — flat top-level key = module slug.
    const sys = systemPermissions(perms);
    return sys?.[module]?.includes(action) ?? false;
  }

  // CLUB SCOPE — nested dưới club_{id}.
  const club = clubPermissions(perms, clubId);
  return club?.[module]?.includes(action) ?? false;
}

/**
 * Check user có bất kỳ quyền nào ở club cụ thể (dùng cho layout guard).
 * Superadmin → true. `["*"]` → true. Còn lại → `club_{id}` có ít nhất
 * 1 module non-empty.
 */
export function canAccessClub(
  perms: PermissionMap | undefined | null,
  isSuperAdmin: boolean,
  clubId: number,
): boolean {
  if (isSuperAdmin) return true;
  if (Array.isArray(perms)) return perms.includes("*");
  if (!perms) return false;
  const club = clubPermissions(perms, clubId);
  if (!club) return false;
  return Object.values(club).some(
    (actions) => Array.isArray(actions) && actions.length > 0,
  );
}

/**
 * Check user có quyền ở bất kỳ club nào (dùng cho nút "← Quay lại CLB"
 * trong ClubSidebar). Superadmin → true. `["*"]` → true.
 */
export function hasAnyClubPermission(
  perms: PermissionMap | undefined | null,
  isSuperAdmin: boolean,
): boolean {
  if (isSuperAdmin) return true;
  if (Array.isArray(perms)) return perms.includes("*");
  if (!perms || Array.isArray(perms)) return false;
  return Object.keys(perms).some(isClubKey);
}

/**
 * Check user có quyền system nào (dùng cho (system) layout gate).
 * Superadmin → true. `["*"]` → true. Admin → có flat module key.
 */
export function hasAnySystemPermission(
  perms: PermissionMap | undefined | null,
  isSuperAdmin: boolean,
): boolean {
  if (isSuperAdmin) return true;
  if (Array.isArray(perms)) return perms.includes("*");
  return systemPermissions(perms ?? (["*"] as PermissionMap)) !== null;
}
