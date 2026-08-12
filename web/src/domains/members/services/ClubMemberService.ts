// src/domains/club/services/clubMemberService.ts
"use client";
import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { ClubMember, RejectPayload } from "@/domains/members/types/member";
import type { ApiResponse } from "@/types/api";

class ClubMemberService extends BaseRepository<ClubMember> {
  protected resource = "members";
  protected adapter = browserAdapter;

  async approve(memberId: number, data?: Record<string, unknown>): Promise<ApiResponse<ClubMember>> {
    return this.adapter.post<ApiResponse<ClubMember>>(
      `/${this.resource}/${memberId}/approve`,
      data
    );
  }

  async reject(memberId: number, payload: RejectPayload & { club_slug?: string }): Promise<ApiResponse<ClubMember>> {
    return this.adapter.post<ApiResponse<ClubMember>>(
      `/${this.resource}/${memberId}/reject`,
      payload
    );
  }
}

export const clubMemberService = new ClubMemberService();
export const getClubMemberService = (_clubSlug?: string) => clubMemberService;
