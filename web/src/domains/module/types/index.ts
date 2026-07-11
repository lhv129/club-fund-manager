/** Module domain types — mirror ModuleResource. */

import type { Translation } from "@/domains/club/types";
import type { Permission } from "@/domains/permission/types";

/** Module — matches ModuleResource. */
export interface Module {
  id: number;
  slug: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  translations?: Translation[];
  permissions?: Permission[];
  created_at: string | null;
  updated_at: string | null;
}

export interface ModuleListParams {
  search?: string;
  is_active?: 0 | 1;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  limit?: number;
  page?: number;
}
