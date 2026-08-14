"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { paymentCodeService } from "@/domains/paymentCode/services/paymentCodeService";
import type { PaymentCodeFilters } from "@/domains/paymentCode/types";
import type { useListParams } from "@/hooks/useListParams";

export function usePaymentCodes(
    params: ReturnType<typeof useListParams<PaymentCodeFilters>>["params"],
) {
    const query = useQuery({
        queryKey: ["payment-codes", params],
        queryFn: () => paymentCodeService.list(params),
        placeholderData: keepPreviousData,
        enabled: Boolean(params.club_slug),
    });

    return {
        data: query.data?.data ?? [],
        total: query.data?.meta?.total ?? 0,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
    };
}

export function usePaymentCode(code: string, clubSlug: string) {
    return useQuery({
        queryKey: ["payment-code", clubSlug, code],
        queryFn: () => paymentCodeService.getByCode(code, clubSlug),
        enabled: Boolean(code && clubSlug),
    });
}
