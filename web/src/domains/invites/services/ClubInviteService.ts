// src/domains/invites/services/ClubInviteService.ts
"use client";
import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { ClubInvite, CreateInvitePayload } from "@/domains/invites/types/invite";
import type { ApiResponse } from "@/types/api";

class ClubInviteService extends BaseRepository<ClubInvite> {
  protected resource = "invites";
  protected adapter = browserAdapter;

  async create(payload: CreateInvitePayload & { club_slug?: string }): Promise<ApiResponse<ClubInvite>> {
    return this.adapter.post<ApiResponse<ClubInvite>>(
      `/${this.resource}`,
      payload
    );
  }

  async toggleStatus(id: number, data?: Record<string, unknown>): Promise<ApiResponse<ClubInvite>> {
    return this.adapter.post<ApiResponse<ClubInvite>>(
      `/${this.resource}/${id}/toggle-status`,
      data
    );
  }
}

export const clubInviteService = new ClubInviteService();
export const getClubInviteService = (_clubSlug?: string) => clubInviteService;
