import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { Module } from "../types";

class ModuleService extends BaseRepository<Module> {
    protected resource = "modules";
    protected adapter = browserAdapter;
}

export const moduleService = new ModuleService();
