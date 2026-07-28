// @/domains/role/services/roleServiceServer.ts
import "server-only";
import { BaseRepository } from "@/lib/baseRepository";
import { serverAdapter } from "@/lib/http/serverAdapter";
import type { Role } from "@/domains/role/types";

class RoleServiceServer extends BaseRepository<Role> {
    protected resource = "roles";
    protected adapter = serverAdapter;
}

export const roleServiceServer = new RoleServiceServer();