import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { Permission } from "../types";

class PermissionService extends BaseRepository<Permission> {
  protected resource = "permissions";
  protected adapter = browserAdapter;


  /** GET /permissions/by-module — permissions grouped by module. */
  byModule() {
    return this.get("/permissions/by-module");
  }
}

export const permissionService = new PermissionService();
