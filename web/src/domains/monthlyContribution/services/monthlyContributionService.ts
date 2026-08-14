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
        clubSlug: string,
    ): Promise<GenerateMonthlyContributionPaymentResponse> {
        return this.post<GenerateMonthlyContributionPaymentResponse>(
            `/${this.resource}/${id}/payment-code`,
            { club_slug: clubSlug },
        );
    }

    override show(
        id: number | string,
        clubSlug?: string,
    ): Promise<import("@/types/api").ApiResponse<MonthlyContribution>> {
        return this.get(`/${this.resource}/${id}`, {
            club_slug: clubSlug,
        });
    }
}

export const monthlyContributionService = new MonthlyContributionServiceClient();

export const getMonthlyContributionService = (_clubSlug?: string) => monthlyContributionService;
