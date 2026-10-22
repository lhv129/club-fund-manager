/**
 * Types for the system-level user-role endpoints.
 */
export interface ClubMemberRoleTranslation {
    id: number;
    role_id: number;
    locale: string;
    name: string;
}

export interface ClubMemberRole {
    id: number;
    slug: string;
    name?: string,
    scope: string;
    sort_order: number;
    is_active: boolean;
    translation?: ClubMemberRoleTranslation | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface ClubMemberRole {
    id: number;
    club_id: number | null;
    user_id: number;
    sort_order: number;
    is_active: boolean;
    role: ClubMemberRole;
}

/** Request body assumed by syncUserRole: the user id and the selected role id. */
export interface SyncUserRolePayload {
    user_id: number;
    role_slug: string;
    club_slug: string | null;
}