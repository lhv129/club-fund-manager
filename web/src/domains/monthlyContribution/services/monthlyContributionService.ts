// src/domains/monthlyContribution/services/monthlyContributionService.ts
"use client";
import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { MonthlyContribution } from "../types";

class MonthlyContributionServiceClient extends BaseRepository<MonthlyContribution> {
    protected resource = "monthly-contributions";
    protected adapter = browserAdapter;

}
export const monthlyContributionService = new MonthlyContributionServiceClient();
export const getMonthlyContributionService = (_clubSlug?: string) => monthlyContributionService;
