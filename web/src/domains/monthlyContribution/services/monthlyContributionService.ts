// src/domains/monthlyContribution/services/monthlyContributionService.ts
"use client";

import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type {
    GenerateMonthlyContributionPaymentResponse,
    MonthlyContribution,
} from "../types";

class MonthlyContributionServiceClient extends BaseRepository<MonthlyContribution> {
    protected resource = "monthly-contributions";
    protected adapter = browserAdapter;

    /**
     * POST /monthly-contributions/{id}/payment-code
     *
     * Sinh hoặc trả lại mã thanh toán.
     */
    public async generateOrReuse(
        id: number,
    ): Promise<GenerateMonthlyContributionPaymentResponse> {
        return this.adapter.post(
            `${this.resource}/${id}/payment-code`,
        );
    }
}

export const monthlyContributionService = new MonthlyContributionServiceClient();

export const getMonthlyContributionService = (_clubSlug?: string) => monthlyContributionService;