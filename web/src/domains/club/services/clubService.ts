"use client";

import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { Club } from "../types";
import type { ApiResponse } from "@/types/api";
import type { ClubMember } from "../types";

class ClubServiceClient extends BaseRepository<Club> {
  protected resource = "clubs";
  protected adapter = browserAdapter;

  updateOwner(id: number, userId: number): Promise<ApiResponse<Club>> {
    return this.put<ApiResponse<Club>>(`/clubs/${id}/owner`, { user_id: userId });
  }

  /**
   * POST /clubs/join — xin vào CLB.
   *
   * Hai luồng:
   *  - Theo invite token: { token, join_type: "invite" }
   *  - Theo club_id (sau khi search): { club_id, join_type: "request", reason? }
   *
   * BE tạo ClubMember với status = pending → admin duyệt → approved/rejected.
   */
  join(payload: {
    token?: string;
    club_id?: number;
    join_type: "request" | "invite";
    reason?: string;
  }): Promise<ApiResponse<ClubMember>> {
    return this.post<ApiResponse<ClubMember>>("/clubs/join", payload);
  }
}

export const clubServiceClient = new ClubServiceClient();
