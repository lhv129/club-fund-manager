"use client";
import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { FundPeriod } from "@/domains/fundPeriod/types";

class FundPeriodService extends BaseRepository<FundPeriod> {
    protected resource = "fund-periods";
    protected adapter = browserAdapter;

}
export const fundPeriodService = new FundPeriodService();
export const getFundPeriodService = (_clubSlug?: string) => fundPeriodService;
