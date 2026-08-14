"use client";

import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { ApiResponse } from "@/types/api";
import type { PaymentCode } from "@/domains/paymentCode/types";

class PaymentCodeService extends BaseRepository<PaymentCode> {
    protected resource = "payment-codes";
    protected adapter = browserAdapter;

    getByCode(code: string, clubSlug: string): Promise<ApiResponse<PaymentCode>> {
        return this.get<ApiResponse<PaymentCode>>(
            `/${this.resource}/${encodeURIComponent(code)}`,
            { club_slug: clubSlug },
        );
    }
}

export const paymentCodeService = new PaymentCodeService();
