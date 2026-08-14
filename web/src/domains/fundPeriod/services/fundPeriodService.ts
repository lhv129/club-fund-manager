"use client";
import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { FundPeriod } from "@/domains/fundPeriod/types";
import type { ApiResponse, ListParams, PaginatedResponse } from "@/types/api";

class FundPeriodService extends BaseRepository<FundPeriod> {
    protected resource = "fund-periods";
    protected adapter = browserAdapter;

    trashed(params?: ListParams): Promise<PaginatedResponse<FundPeriod>> {
        return this.get<PaginatedResponse<FundPeriod>>(`/${this.resource}/trashed`, params);
    }

    restore(id: number, clubSlug: string): Promise<ApiResponse<FundPeriod>> {
        return this.post<ApiResponse<FundPeriod>>(`/${this.resource}/${id}/restore`, {
            club_slug: clubSlug,
        });
    }

    close(id: number, clubSlug: string): Promise<ApiResponse<FundPeriod>> {
        return this.post<ApiResponse<FundPeriod>>(`/${this.resource}/${id}/close`, {
            club_slug: clubSlug,
        });
    }

    reopen(id: number, clubSlug: string, reason: string): Promise<ApiResponse<FundPeriod>> {
        return this.post<ApiResponse<FundPeriod>>(`/${this.resource}/${id}/reopen`, {
            club_slug: clubSlug,
            reason,
        });
    }

    override toggleStatus(id: number | string, clubSlug?: string): Promise<ApiResponse<FundPeriod>> {
        return this.post<ApiResponse<FundPeriod>>(`/${this.resource}/${id}/toggle-status`, {
            club_slug: clubSlug,
        });
    }

}
export const fundPeriodService = new FundPeriodService();
export const getFundPeriodService = (_clubSlug?: string) => fundPeriodService;
