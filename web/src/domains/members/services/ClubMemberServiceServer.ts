// src/domains/club/services/clubMemberServiceServer.ts
import "server-only";
import { BaseRepository } from "@/lib/baseRepository";
import { serverAdapter } from "@/lib/http/serverAdapter";
import type { ClubMember } from "@/domains/members/types/member";

class ClubMemberServiceServer extends BaseRepository<ClubMember> {
    protected resource: string;
    protected adapter = serverAdapter;

    constructor(clubSlug: string) {
        super();
        this.resource = `clubs/${clubSlug}/members`;
    }
}

export function createClubMemberServiceServer(clubSlug: string) {
    return new ClubMemberServiceServer(clubSlug);
}
