import { BaseService } from "@/lib/baseService";
import type { ApiResponse } from "@/types/api";
import type { ClubMember } from "../types";

/**
 * ClubMemberService — club-scoped endpoints under /clubs/{clubId}/members.
 */
class ClubMemberService extends BaseService<ClubMember> {
  protected resource = "clubs";

  /** GET /clubs/{clubId}/members — list members of a club. */
  listByClub(clubId: number, params?: Record<string, unknown>) {
    return this.get(`/clubs/${clubId}/members`, params);
  }

  /** GET /clubs/{clubId}/members/{memberId} — show member detail. */
  showByClub(clubId: number, memberId: number) {
    return this.get<ApiResponse<ClubMember>>(`/clubs/${clubId}/members/${memberId}`);
  }

  /** POST /clubs/{clubId}/members/{memberId}/approve — approve member. */
  approve(clubId: number, memberId: number) {
    return this.post<ApiResponse<ClubMember>>(`/clubs/${clubId}/members/${memberId}/approve`);
  }

  /** POST /clubs/{clubId}/members/{memberId}/reject — reject member. */
  reject(clubId: number, memberId: number, reason?: string) {
    return this.post<ApiResponse<ClubMember>>(
      `/clubs/${clubId}/members/${memberId}/reject`,
      reason ? { rejected_reason: reason } : undefined,
    );
  }

  /** POST /clubs/join — request to join a club. */
  join(payload: Record<string, unknown>) {
    return this.post<ApiResponse<ClubMember>>("/clubs/join", payload);
  }

  /** DELETE /clubs/{clubId}/members/{memberId} — remove member. */
  removeFromClub(clubId: number, memberId: number) {
    return this.delete<ApiResponse<null>>(`/clubs/${clubId}/members/${memberId}`);
  }

  /** POST /clubs/{clubId}/members/{memberId}/toggle-status. */
  toggleStatusForClub(clubId: number, memberId: number) {
    return this.post<ApiResponse<ClubMember>>(
      `/clubs/${clubId}/members/${memberId}/toggle-status`,
    );
  }
}

export const clubMemberService = new ClubMemberService();
