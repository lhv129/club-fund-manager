// src/domains/club/types/member.ts

import type { User } from "@/domains/user/types";
import type { Role } from "@/domains/role/types";

export interface ClubMemberActor {
    id: number;
    fullname: string;
}

/**
 * Trạng thái membership của user trong club.
 *
 * pending   : đang chờ duyệt
 * approved  : đã là thành viên
 * rejected  : bị từ chối đơn xin vào
 * removed   : đã bị remove khỏi club, có thể xin vào lại
 * banned    : bị cấm khỏi club, không được xin vào lại
 */
export type ClubMemberStatus =
    | "pending"
    | "approved"
    | "rejected"
    | "removed"
    | "banned";

export type ClubMemberJoinType =
    | "request"
    | "invite";

export interface ClubMember {
    id: number;

    user_id?: number;

    club_id?: number;

    invite_id?: number | null;

    join_type: ClubMemberJoinType;

    status: ClubMemberStatus;

    is_active: boolean;

    joined_at: string | null;

    rejected_reason: string | null;

    user: User;

    role?: Role;

    reviewedBy: ClubMemberActor | null;

    invitedBy: ClubMemberActor | null;

    removedBy?: ClubMemberActor | null;

    /**
     * Người thực hiện ban member.
     *
     * Backend nên trả relation bannedBy.
     */
    bannedBy?: ClubMemberActor | null;

    created_at: string | null;

    reviewed_at: string | null;

    removed_at: string | null;

    /**
     * Thời điểm bị ban.
     */
    banned_at?: string | null;

    /**
     * Lý do bị ban.
     */
    banned_reason?: string | null;
}

/**
 * Filter cho danh sách member hiện tại.
 */
export type MemberFilters = {
    search: string;
};

/**
 * Filter cho lịch sử membership.
 */
export type MemberHistoryFilters = {
    search: string;

    status?: ClubMemberStatus | undefined;

    join_type: ClubMemberJoinType | undefined;

    is_active: 0 | 1 | undefined;
};

/**
 * Payload reject member.
 */
export interface RejectPayload {
    rejected_reason: string;
}

/**
 * Payload ban member.
 */
export interface BanMemberPayload {
    banned_reason?: string;
}

/**
 * Payload join club.
 */
export interface JoinClubPayload {
    invite_code?: string;
}

/**
 * Payload approve member.
 *
 * Hiện tại API approve chỉ cần memberId,
 * giữ interface để thuận tiện mở rộng sau này.
 */
export interface ApproveMemberPayload {
    member_id?: number;
}

/**
 * Member dùng cho select/dropdown.
 */
export interface ClubMemberSelect {
    id: number;

    user_id: number;

    user: {
        id: number;
        fullname: string;
        email: string;
        phone: string | null;
    };
}