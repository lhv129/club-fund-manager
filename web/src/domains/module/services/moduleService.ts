import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { Module } from "../types";

class ModuleService extends BaseRepository<Module> {
  protected resource = "modules";
  protected adapter = browserAdapter;

  /**
   * GET /modules/permissions
   * Toàn bộ modules + actions dạng checkbox — dùng cho màn hình assign permission của role.
   */
  permissions() {
    return this.get("/modules/permissions");
  }
}

export const moduleService = new ModuleService();
