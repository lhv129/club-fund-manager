import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { ApiResponse } from "@/types/api";
import type { Role, RolePermission } from "../types";

class RoleService extends BaseRepository<Role> {
  protected resource = "roles";
  protected adapter = browserAdapter;
  /**
   * Sync permissions cho role.
   * Lấy permissions của role theo slug.
   * GET /roles/{slug}/permissions — trả về RolePermission[] đã được backend
   * dịch label theo Accept-Language header.
   */
  async getPermissionsBySlug(slug: string): Promise<ApiResponse<RolePermission[]>> {
    return this.adapter.get(`/roles/${slug}/permissions`);
  }


  /**
 * POST /roles/permissions
 * Sync permissions cho role theo slug.
 *
 * @param slug Role slug
 * @param permissionIds Danh sách permission IDs
 */
  async syncPermissions(
    slug: string,
    permissionIds: number[]
  ): Promise<ApiResponse<RolePermission[]>> {
    return this.adapter.post(`/roles/syncPermissions`, {
      permission_ids: permissionIds,
      slug: slug
    });
  }
}

export const roleService = new RoleService();
