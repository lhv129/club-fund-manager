"use client";

import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { ApiResponse } from "@/types/api";
import type {
    ClubMemberRole,
    SyncUserRolePayload,
} from "@/domains/clubMemberRole/types/index";

class ClubMemberRoleService extends BaseRepository<ClubMemberRole> {
    protected resource = "club-member-roles";
    protected adapter = browserAdapter;

    syncMemberRole(
        payload: SyncUserRolePayload
    ): Promise<ApiResponse<ClubMemberRole>> {
        return this.put<ApiResponse<ClubMemberRole>>(
            `/${this.resource}/sync`,
            payload
        );
    }

    syncUserRole(
        payload: SyncUserRolePayload
    ): Promise<ApiResponse<ClubMemberRole>> {
        return this.put<ApiResponse<ClubMemberRole>>(
            `/${this.resource}/syncUserRole`,
            payload
        );
    }

    deleteUserRole(userId: number): Promise<ApiResponse<null>> {
        return this.delete<ApiResponse<null>>(
            `/${this.resource}/user-role/${userId}`
        );
    }
}

export const clubMemberRoleService = new ClubMemberRoleService();