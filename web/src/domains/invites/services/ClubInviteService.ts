// src/domains/invites/services/ClubInviteService.ts
"use client";
import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { ClubInvite, CreateInvitePayload } from "@/domains/invites/types/invite";
import type { ApiResponse } from "@/types/api";

class ClubInviteService extends BaseRepository<ClubInvite> {
  protected resource: string;
  protected adapter = browserAdapter;

  constructor(clubSlug: string) {
    super();
    this.resource = `/clubs/${clubSlug}/invites`;
  }

  async store(payload: CreateInvitePayload): Promise<ApiResponse<ClubInvite>> {
    return this.adapter.post<ApiResponse<ClubInvite>>(
      this.resource,
      payload
    );
  }

  async toggleStatus(id: number): Promise<ApiResponse<ClubInvite>> {
    return this.adapter.post<ApiResponse<ClubInvite>>(
      `${this.resource}/${id}/toggle-status`,
      {}
    );
  }
}

const serviceCache = new Map<string, ClubInviteService>();

export function getClubInviteService(clubSlug: string): ClubInviteService {
  if (!serviceCache.has(clubSlug)) {
    serviceCache.set(clubSlug, new ClubInviteService(clubSlug));
  }
  return serviceCache.get(clubSlug)!;
}