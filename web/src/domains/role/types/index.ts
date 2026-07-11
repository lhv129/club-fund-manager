/** Role domain types — mirror RoleResource. */

import type { Translation } from "@/domains/club/types";

/** Permission entry within a role. */
export interface RolePermission {
  id: number;
  module_id: number;
  action: "view" | "create" | "update" | "delete";
  is_active: boolean;
  translations?: unknown[];
}

/** Role — matches RoleResource. */
export interface Role {
  id: number;
  club_id: number | null;
  slug: string;
  sort_order: number;
  is_active: boolean;
  translations?: Translation[];
  permissions?: RolePermission[];
  created_at: string | null;
  updated_at: string | null;
}

export interface RoleListParams {
  search?: string;
  is_active?: 0 | 1;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  limit?: number;
  page?: number;
}
