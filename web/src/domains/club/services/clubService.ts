import { BaseService } from "@/lib/baseService";
import type { ApiResponse } from "@/types/api";
import type { Club } from "../types";

class ClubService extends BaseService<Club> {
  protected resource = "clubs";

  /**
   * PUT /clubs/{id}/owner — assign club owner.
   * Backend updates owner_id + ensures approved club_member record.
   */
  updateOwner(id: number, userId: number) {
    return this.put<ApiResponse<Club>>(`/clubs/${id}/owner`, { user_id: userId });
  }
}

export const clubService = new ClubService();
