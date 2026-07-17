/** Translation entry cho Permission. */
export interface PermissionTranslation {
  locale: string;
  name: string;
  description?: string | null;
}

export interface Permission {
  id: number;
  module: string;
  action: string;
  created_at: string | null;
  updated_at: string | null;
  /** List endpoint: bản dịch theo locale hiện tại. */
  translation?: PermissionTranslation;
  /** Show/edit endpoint: mảng đầy đủ bản dịch. */
  translations?: PermissionTranslation[];
}

/** Dùng type (không dùng interface) để thoả Record<string, FilterValue>. */
export type PermissionFilters = {
  search: string;
  module: string | undefined;
  is_active: 0 | 1 | undefined;
};

/** Danh sách module trong hệ thống — thêm module mới vào đây khi cần. */
export const SYSTEM_MODULES = [
  "club",
  "member",
  "role",
  "fund",
  "transaction",
  "exchange_session",
  "webhook",
] as const;

export type SystemModule = (typeof SYSTEM_MODULES)[number];

/** Các action chuẩn. */
export const PERMISSION_ACTIONS = ["view", "create", "update", "delete"] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];
