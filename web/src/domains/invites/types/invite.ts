// src/domains/members/types/invite.ts

import type { ListParams } from "@/types/api";

export interface ClubInvite {
    id: number;
    invite_code: string;
    club: {
        locale: string;
        name: string;
        slug: string;
    };
    expires_at: string | null;
    used_count: number;
    is_active: boolean;
    is_expired: boolean;
    created_by: {
        id: number;
        fullname: string;
        phone: string | null;
        avatar: string | null;
    } | null;
    created_at: string;
}

export type InviteFilters = {
    search: string;
    is_active?: 0 | 1;
};


export interface CreateInvitePayload {
    max_uses?: number | null;
    expires_at?: string | null;
}

// Derived — dùng cho StatusDropdown
export type InviteDisplayStatus = "active" | "inactive" | "expired";

export function getInviteDisplayStatus(invite: ClubInvite): InviteDisplayStatus {
    if (invite.is_expired) return "expired";
    return invite.is_active ? "active" : "inactive";
}