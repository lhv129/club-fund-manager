// src/domains/monthlyContribution/services/monthlyContributionService.ts
"use client";
import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { MonthlyContribution } from "../types";

class MonthlyContributionServiceClient extends BaseRepository<MonthlyContribution> {
    protected resource: string;
    protected adapter = browserAdapter;

    constructor(clubSlug: string) {
        super();
        this.resource = `clubs/${clubSlug}/monthly-contributions`;
    }
}

const clientCache = new Map<string, MonthlyContributionServiceClient>();

export function getMonthlyContributionService(clubSlug: string) {
    if (!clientCache.has(clubSlug)) {
        clientCache.set(clubSlug, new MonthlyContributionServiceClient(clubSlug));
    }
    return clientCache.get(clubSlug)!;
}
