/** Translation entry cho Module. */
export interface ModuleTranslation {
  locale: string;
  name: string;
  description?: string | null;
}

/** Shape trả về từ GET /modules (paginated index). */
export interface Module {
  module_id: number;
  module: string;
  label?: string;
  description?: string | null;
  icon?: string | null;
  sort_order: number;
  is_active: boolean;
  actions: Record<string, boolean>;
  translations?: ModuleTranslation[];
  created_at?: string;
}

/** Shape trả về từ GET /modules/{id} (show/edit). */
export interface ModuleDetail {
  module_id: number;
  module: string;
  label?: string;
  description?: string | null;
  icon?: string | null;
  sort_order: number;
  is_active: boolean;
  actions: Record<string, boolean>;
  translations?: ModuleTranslation[];
  created_at?: string;
}

export type ModuleFilters = {
  search: string;
  is_active: 0 | 1 | undefined;
};

/** Các action chuẩn. */
export const MODULE_ACTIONS = ["view", "create", "update", "delete"] as const;

export type ModuleAction = (typeof MODULE_ACTIONS)[number];
