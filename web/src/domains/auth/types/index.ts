/**
 * Auth domain types — mirror backend Auth/ProfileResource.
 */

/**
 * Permission map từ backend — 4 shape (xem docs/permission-guide.md §2).
 *
 * ["*"]                                   → superadmin (bypass)
 * { [module]: string[] }                  → admin (system scope, flat)
 * { [clubId: `club_${number}`]: {...} }  → owner/manager/member (club scope, nested)
 * { ...merge... }                         → hybrid (admin + club member)
 *
 * Lưu ý: key top-level có thể là module slug (string) HOẶC `club_{id}`.
 * Phân biệt bằng helper isClubKey() / scopeKey() trong lib/permissions.ts.
 */
export type PermissionMap =
  | ["*"]
  | Record<string, string[] | Record<string, string[]>>;

/** User profile — matches Auth/Resources/ProfileResource. */
export interface Profile {
  id: number;
  fullname: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  is_superadmin: boolean;
  /** admin (system scope) — true nếu user có role `admin` do superadmin cấp. */
  is_system_admin: boolean;
  is_active: boolean | null;
  permissions: PermissionMap;
}

/** Login request payload. */
export interface LoginPayload {
  login: string; // email or username
  password: string;
}

/** Register request payload. */
export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
  username?: string;
  gender?: "male" | "female" | "other";
  avatar?: File;
  bgImage?: File;
  count?: number;
  description?: string;
}

/** Login response data (from Route Handler — tokens stripped). */
export interface LoginResponse {
  user: Profile;
}

/** Token data from backend (only used in Route Handler). */
export interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}
