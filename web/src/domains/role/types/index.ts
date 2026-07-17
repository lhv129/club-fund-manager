import type { Permission } from "@/domains/permission/types";

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
  /** Detail endpoint: danh sách permission hiện tại của role. */
  permissions?: Permission[];
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
export interface RolePermission {
  module_id: number;
  module: string;
  label: string;
  actions: RolePermissionAction[];
}