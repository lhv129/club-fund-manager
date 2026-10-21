/**
 * Auth domain types — mirror backend Auth/ProfileResource.
 */

/**
 * Permission map từ backend.
 *
 * Superadmin:
 *   ["*"]
 *
 * Global/system permissions:
 *   {
 *     club: ["view", "create", ...],
 *     fund_period: ["view", ...]
 *   }
 *
 * Mixed global + club permissions:
 *   {
 *     club: ["view", ...],
 *     club_7: {
 *       club: ["view", ...]
 *     }
 *   }
 */
export type PermissionMap =
  | ["*"]
  | Record<string, string[] | Record<string, string[]>>;

/**
 * Role dùng chung cho cả Global/System role và Club role.
 */
export interface UserRole {
  id: number;
  slug: string;
  name: string | null;
}

/**
 * Role của user trong một Club.
 *
 * Ví dụ:
 *
 * {
 *   id: 3,
 *   slug: "owner",
 *   name: "Chủ CLB"
 * }
 */
export type ClubRole = UserRole;

/**
 * Global/System role của user.
 *
 * Ví dụ:
 *
 * {
 *   id: 2,
 *   slug: "system_admin",
 *   name: "System Administrator"
 * }
 */
export type GlobalRole = UserRole;

/**
 * Role map của user.
 *
 * Global role:
 *
 * {
 *   global: {
 *     id: 2,
 *     slug: "system_admin",
 *     name: "System Administrator"
 *   }
 * }
 *
 * Club role:
 *
 * {
 *   club_7: {
 *     id: 3,
 *     slug: "owner",
 *     name: "Chủ CLB"
 *   }
 * }
 *
 * Có thể tồn tại đồng thời:
 *
 * {
 *   global: {...},
 *   club_7: {...},
 *   club_10: {...}
 * }
 */
export type UserRoleMap = {
  global?: GlobalRole | null;
} & Partial<Record<`club_${number}`, ClubRole>>;

/**
 * User profile — matches Auth/Resources/ProfileResource.
 */
export interface Profile {
  id: number;

  first_name?: string | null;
  last_name?: string | null;
  fullname: string;

  email: string;
  phone: string | null;
  avatar: string | null;

  date_of_birth?: string | null;
  gender?: "male" | "female" | "other" | null;
  address?: string | null;

  is_superadmin: boolean;

  /**
   * True khi user có Global/System role.
   *
   * Ví dụ:
   *   system_admin
   */
  is_system_admin: boolean;

  is_active?: boolean | null;

  /**
   * Permissions được trả từ backend.
   */
  permissions: PermissionMap;

  /**
   * Roles của user theo scope.
   *
   * Global:
   *   roles.global
   *
   * Club:
   *   roles.club_{clubId}
   */
  roles: UserRoleMap | ["*"];
}

/** Login request payload. */
export interface LoginPayload {
  login: string;
  password: string;
}

/** Register request payload. */
export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
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