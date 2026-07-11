/** Permission domain types — mirror PermissionResource. */

import type { Translation } from "@/domains/club/types";

export type PermissionAction = "view" | "create" | "update" | "delete";

/** Permission — matches PermissionResource. */
export interface Permission {
  id: number;
  module_id: number;
  action: PermissionAction;
  sort_order: number;
  is_active: boolean;
  translations?: Translation[];
  module?: { id: number; slug: string; translations?: Translation[] };
  created_at: string | null;
  updated_at: string | null;
}

export interface PermissionListParams {
  search?: string;
  is_active?: 0 | 1;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  limit?: number;
  page?: number;
}
