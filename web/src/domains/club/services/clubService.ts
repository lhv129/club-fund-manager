"use client";

import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { Club } from "../types";
import type { ApiResponse } from "@/types/api";

class ClubServiceClient extends BaseRepository<Club> {
  protected resource = "clubs";
  protected adapter = browserAdapter;

  updateOwner(id: number, userId: number): Promise<ApiResponse<Club>> {
    return this.put<ApiResponse<Club>>(`/clubs/${id}/owner`, { user_id: userId });
  }

}

export const clubServiceClient = new ClubServiceClient();
