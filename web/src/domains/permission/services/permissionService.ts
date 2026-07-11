import { BaseService } from "@/lib/baseService";
import type { Permission } from "../types";

class PermissionService extends BaseService<Permission> {
  protected resource = "permissions";

  /** GET /permissions/by-module — permissions grouped by module. */
  byModule() {
    return this.get("/permissions/by-module");
  }
}

export const permissionService = new PermissionService();
