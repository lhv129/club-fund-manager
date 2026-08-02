// src/domains/club/types/member.ts

export interface ClubMemberUser {
    id: number;
    fullname: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    role?: {
        id: number;
        name: string;
    };
}

export interface ClubMemberActor {
    id: number;
    fullname: string;
}

export type ClubMemberStatus = "pending" | "approved" | "rejected" | "removed";
export type ClubMemberJoinType = "request" | "invite";

export interface ClubMember {
    id: number;
    join_type: ClubMemberJoinType;
    status: ClubMemberStatus;
    is_active: boolean;
    joined_at: string | null;
    rejected_reason: string | null;
    user: ClubMemberUser;
    reviewedBy: ClubMemberActor | null;
    invitedBy: ClubMemberActor | null;
    removedBy?: ClubMemberActor | null;
    created_at: string | null;
    reviewed_at: string | null;
    removed_at: string | null;
}

export type MemberFilters = {
    search: string;
};

export type MemberHistoryFilters = {
    search: string;
    status?: ClubMemberStatus | undefined;
    join_type: ClubMemberJoinType | undefined;
    is_active: 0 | 1 | undefined;
};

export interface RejectPayload {
    rejected_reason: string;
}
