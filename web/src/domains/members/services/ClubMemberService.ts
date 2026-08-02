// src/domains/club/services/clubMemberService.ts
"use client";
import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { ClubMember, RejectPayload } from "@/domains/members/types/member";
import type { ApiResponse } from "@/types/api";

class ClubMemberService extends BaseRepository<ClubMember> {
  protected resource: string;
  protected adapter = browserAdapter;

  constructor(clubSlug: string) {
    super();
    this.resource = `/clubs/${clubSlug}/members`;
  }

  async approve(memberId: number): Promise<ApiResponse<ClubMember>> {
    return this.adapter.post<ApiResponse<ClubMember>>(
      `${this.resource}/${memberId}/approve`,
      {}
    );
  }

  async reject(memberId: number, payload: RejectPayload): Promise<ApiResponse<ClubMember>> {
    return this.adapter.post<ApiResponse<ClubMember>>(
      `${this.resource}/${memberId}/reject`,
      payload
    );
  }
}

const serviceCache = new Map<string, ClubMemberService>();

export function getClubMemberService(clubSlug: string): ClubMemberService {
  if (!serviceCache.has(clubSlug)) {
    serviceCache.set(clubSlug, new ClubMemberService(clubSlug));
  }
  return serviceCache.get(clubSlug)!;
}
