import { BaseService } from "@/lib/baseService";
import type { ApiResponse } from "@/types/api";
import type { Role } from "../types";

class RoleService extends BaseService<Role> {
  protected resource = "roles";

  /**
   * POST /roles/{id}/permissions — sync permissions to a role.
   * @param roleId    Role ID
   * @param permissionIds  Array of permission IDs to sync
   */
  syncPermissions(roleId: number, permissionIds: number[]) {
    return this.post<ApiResponse<Role>>(
      `/roles/${roleId}/permissions`,
      { permission_ids: permissionIds },
    );
  }
}

export const roleService = new RoleService();
