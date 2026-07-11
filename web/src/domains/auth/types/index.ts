/**
 * Auth domain types — mirror backend Auth/ProfileResource.
 */

/**
 * Permission map from backend.
 *
 * Superadmin: ['*']
 * Regular user: { [clubId]: { [moduleSlug]: ['view', 'create', ...] } }
 */
export type PermissionMap = ["*"] | Record<string, Record<string, string[]>>;

/** User profile — matches Auth/Resources/ProfileResource. */
export interface Profile {
  id: number;
  fullname: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  is_superadmin: boolean;
  is_active: boolean;
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
