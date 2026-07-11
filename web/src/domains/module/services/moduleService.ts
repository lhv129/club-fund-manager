import { BaseService } from "@/lib/baseService";
import type { Module } from "../types";

class ModuleService extends BaseService<Module> {
  protected resource = "modules";
}

export const moduleService = new ModuleService();
