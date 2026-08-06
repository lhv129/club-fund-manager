"use client";
import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { FundPeriod } from "@/domains/fundPeriod/types";

class FundPeriodService extends BaseRepository<FundPeriod> {
    protected resource: string;
    protected adapter = browserAdapter;

    constructor(clubSlug: string) {
        super();
        this.resource = `/clubs/${clubSlug}/fund-periods`;
    }
}

const serviceCache = new Map<string, FundPeriodService>();

export function getFundPeriodService(clubSlug: string): FundPeriodService {
    if (!serviceCache.has(clubSlug)) {
        serviceCache.set(clubSlug, new FundPeriodService(clubSlug));
    }
    return serviceCache.get(clubSlug)!;
}