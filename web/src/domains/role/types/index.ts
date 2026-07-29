/** Translation entry cho Role. */
export interface RoleTranslation {
  id?: number;
  role_id?: number;
  locale: string;
  name: string;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Role {
  id: number;
  slug: string;
  is_active: boolean;
  sort_order: number;
  permissions_count?: number;
  created_at: string | null;
  updated_at?: string | null;
  /** List + show endpoint: mảng đầy đủ bản dịch theo mọi locale. */
  translations?: RoleTranslation[];
  translation?: RoleTranslation;
}

/** Dùng type (không dùng interface) để thoả Record<string, FilterValue>. */
export type RoleFilters = {
  search: string;
  is_active: 0 | 1 | undefined;
};


/** Một action trong danh sách permissions của role (từ /roles/[slug]/permissions). */
export interface RolePermissionAction {
  id: number;
  /** Slug hành động: "view" | "create" | "update" | "delete" | "view_all" | ... */
  name: string;
  checked: boolean;
}
/**
 * Module quyền của role — response từ GET /roles/[slug]/permissions.
 * `label` đã được backend dịch theo Accept-Language header.
 */
export interface RolePermissionLabelTranslation {
  id: number;
  module_id: number;
  locale: string;
  name: string;
  description?: string | null;
}

export interface RolePermission {
  module_id: number;
  module: string;
  label: RolePermissionLabelTranslation[];  // was: string
  actions: RolePermissionAction[];
}

export interface RolePermissionsResponse {
  id: number;
  slug: string;
  translations: RoleTranslation[];  // was: translation (object đơn)
  permissions: RolePermission[];
}