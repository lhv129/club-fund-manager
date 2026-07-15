import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { ApiResponse } from "@/types/api";
import type { ClubInvite } from "../types";

/**
 * ClubInviteService — endpoints under /clubs/{clubId}/invites.
 */
class ClubInviteService extends BaseRepository<ClubInvite> {
  protected resource = "clubs";
  protected adapter = browserAdapter;

  /** GET /clubs/{clubId}/invites — list invites. */
  listByClub(clubId: number, params?: Record<string, unknown>) {
    return this.get(`/clubs/${clubId}/invites`, params);
  }

  /** GET /clubs/{clubId}/invites/{id} — show invite. */
  showByClub(clubId: number, id: number) {
    return this.get<ApiResponse<ClubInvite>>(`/clubs/${clubId}/invites/${id}`);
  }

  /** POST /clubs/{clubId}/invites — create invite. */
  createForClub(clubId: number, data: Record<string, unknown>) {
    return this.post<ApiResponse<ClubInvite>>(`/clubs/${clubId}/invites`, data);
  }

  /** DELETE /clubs/{clubId}/invites/{id} — delete invite. */
  deleteFromClub(clubId: number, id: number) {
    return this.delete<ApiResponse<null>>(`/clubs/${clubId}/invites/${id}`);
  }

  /** POST /clubs/{clubId}/invites/{id}/toggle-status. */
  toggleStatusForClub(clubId: number, id: number) {
    return this.post<ApiResponse<ClubInvite>>(
      `/clubs/${clubId}/invites/${id}/toggle-status`,
    );
  }
}

export const clubInviteService = new ClubInviteService();
