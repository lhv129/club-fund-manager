// src/domains/monthlyContribution/hooks/useMonthlyContributions.ts
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { getMonthlyContributionService } from "@/domains/monthlyContribution/services/monthlyContributionService";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { MonthlyContribution, MonthlyContributionFilters } from "@/domains/monthlyContribution/types";
import type { useListParams } from "@/hooks/useListParams";

// ─── Private helpers ──────────────────────────────────────────────────────────

function getServerError(err: unknown) {
    const responseData = (err as { response?: { data?: unknown } })?.response?.data;
    if (responseData && typeof responseData === "object" && "success" in responseData) {
        return responseData as { success: false; message?: string; errors?: Record<string, string[]> };
    }
    if (err && typeof err === "object" && "success" in err) {
        return err as { success: false; message?: string; errors?: Record<string, string[]> };
    }
    return null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMonthlyContributions(
    // ✅ Dùng ReturnType — đồng bộ exact type với useListParams
    params: ReturnType<typeof useListParams<MonthlyContributionFilters>>["params"]
) {
    const queryClient = useQueryClient();
    const t = useTranslations("common");
    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

    // ✅ Lấy slug từ URL bên trong hook — component không cần truyền xuống
    const { slug: clubSlug } = useParams<{ slug: string }>();
    const service = getMonthlyContributionService(clubSlug);

    const queryKey = ["monthly-contributions", clubSlug, params] as const;

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const { data: listData, isLoading } = useQuery({
        queryKey,
        queryFn: () => service.list(params),
        enabled: !!clubSlug,
    });

    const data = listData?.data ?? [];
    const total = listData?.meta?.total ?? 0;

    // ── Toggle is_active → setQueryData ───────────────────────────────────────
    const toggleMutation = useMutation({
        mutationFn: (id: number) =>
            service.toggleStatus(id) as Promise<ApiResponse<MonthlyContribution>>,
        onSuccess: (res, id) => {
            if (!res.success) return;
            const saved = res.data;
            queryClient.setQueryData(
                queryKey,
                (old: PaginatedResponse<MonthlyContribution> | undefined) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: (old.data ?? []).map((item) =>
                            item.id !== id
                                ? item
                                : saved
                                    ? { ...item, ...saved }
                                    : { ...item, is_active: !item.is_active }
                        ),
                    };
                }
            );
            toast.success(res.message || t("updateStatus"));
        },
        onError: (error: unknown) => {
            toast.error((error as Error)?.message || t("loadError"));
        },
    });

    // ── Handler ────────────────────────────────────────────────────────────────

    const handleToggleStatus = (row: MonthlyContribution) => {
        if (togglingIds.has(row.id)) return;
        setTogglingIds((prev) => new Set(prev).add(row.id));
        toggleMutation.mutate(row.id, {
            onSettled: () =>
                setTogglingIds((prev) => {
                    const next = new Set(prev);
                    next.delete(row.id);
                    return next;
                }),
        });
    };

    return {
        data,
        total,
        isLoading,
        togglingIds,
        handleToggleStatus,
    };
}
