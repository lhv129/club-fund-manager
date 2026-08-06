// src/domains/monthlyContribution/services/monthlyContributionServiceServer.ts
import "server-only";
import { BaseRepository } from "@/lib/baseRepository";
import { serverAdapter } from "@/lib/http/serverAdapter";
import type { MonthlyContribution } from "../types";

class MonthlyContributionServiceServer extends BaseRepository<MonthlyContribution> {
    protected resource: string;
    protected adapter = serverAdapter;

    constructor(clubSlug: string) {
        super();
        this.resource = `clubs/${clubSlug}/monthly-contributions`;
    }
}

const serverCache = new Map<string, MonthlyContributionServiceServer>();

export function getMonthlyContributionServiceServer(clubSlug: string) {
    if (!serverCache.has(clubSlug)) {
        serverCache.set(clubSlug, new MonthlyContributionServiceServer(clubSlug));
    }
    return serverCache.get(clubSlug)!;
}
