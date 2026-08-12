// src/domains/club/services/clubMemberServiceServer.ts
import "server-only";
import { BaseRepository } from "@/lib/baseRepository";
import { serverAdapter } from "@/lib/http/serverAdapter";
import type { ClubMember } from "@/domains/members/types/member";

class ClubMemberServiceServer extends BaseRepository<ClubMember> {
    protected resource = "members";
    protected adapter = serverAdapter;

}

export const clubMemberServiceServer = new ClubMemberServiceServer();
