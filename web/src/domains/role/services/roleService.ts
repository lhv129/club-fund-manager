import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { ApiResponse } from "@/types/api";
import type { Role, RolePermissionsResponse } from "../types";

class RoleService extends BaseRepository<Role> {
  protected resource = "roles";
  protected adapter = browserAdapter;

  async getPermissionsBySlug(slug: string): Promise<ApiResponse<RolePermissionsResponse>> {
    return this.adapter.get(`/roles/${slug}/permissions`);
  }

  async syncPermissions(
    slug: string,
    permissionIds: number[]
  ): Promise<ApiResponse<RolePermissionsResponse>> {
    return this.adapter.post(`/roles/syncPermissions`, {
      permission_ids: permissionIds,
      slug,
    });
  }
}

export const roleService = new RoleService();