"use client";

import { useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { getFundPeriodService } from "@/domains/fundPeriod/services/fundPeriodService";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { FundPeriod, FundPeriodFilters } from "@/domains/fundPeriod/types";
import type {
    TranslationEntry,
    SubmitResult,
    ServerErrorResponse,
} from "@/components/shared/forms/FormModal";
import type { useListParams } from "@/hooks/useListParams";

// ─── Private helpers ──────────────────────────────────────────────────────────

function getServerError(err: unknown): ServerErrorResponse | null {
    const responseData = (err as { response?: { data?: ServerErrorResponse } })
        ?.response?.data;
    if (responseData) return responseData;
    if (
        err &&
        typeof err === "object" &&
        "success" in err &&
        (err as ServerErrorResponse).success === false
    ) {
        return err as ServerErrorResponse;
    }
    return null;
}

function buildPayload(
    values: Record<string, string>,
    translations?: TranslationEntry[]
): FormData {
    const formData = new FormData();
    formData.append("year", values.year ?? "");
    formData.append("month", values.month ?? "");
    formData.append("male_amount", values.male_amount ?? "0");
    formData.append("female_amount", values.female_amount ?? "0");
    formData.append("exchange_male_amount", values.exchange_male_amount ?? "0");
    formData.append("exchange_female_amount", values.exchange_female_amount ?? "0");
    formData.append("sort_order", values.sort_order ?? "1");
    formData.append(
        "is_active",
        values.is_active === "1" || values.is_active === "true" ? "1" : "0"
    );

    (translations ?? []).forEach((entry) => {
        // Cast sang Record vì TranslationEntry type chỉ khai báo "name", còn field "title" là dynamic
        const e = entry as Record<string, string>;
        formData.append(`translations[${entry.locale}][locale]`, entry.locale);
        formData.append(`translations[${entry.locale}][title]`, e["title"] ?? "");
        formData.append(`translations[${entry.locale}][description]`, e["description"] ?? "");
    });

    return formData;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFundPeriods(
    clubSlug: string,
    // ✅ Dùng ReturnType pattern — đồng bộ exact type với useListParams
    params: ReturnType<typeof useListParams<FundPeriodFilters>>["params"]
) {
    const queryClient = useQueryClient();
    const t = useTranslations("common");
    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

    const service = getFundPeriodService(clubSlug);
    const queryKey = ["fund-periods", clubSlug, params] as const;

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const { data: listData, isLoading } = useQuery({
        queryKey,
        queryFn: () => service.list(params),
        enabled: !!clubSlug,
    });

    const data = listData?.data ?? [];
    const total = listData?.meta?.total ?? 0;

    // ── Create ─────────────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: (payload: FormData) => service.create(payload),
    });

    // ── Delete → setQueryData ──────────────────────────────────────────────────
    const deleteMutation = useMutation({
        mutationFn: (id: number) => service.destroy(id),
        onSuccess: (res, deletedId) => {
            if (!res.success) return;
            queryClient.setQueryData(
                queryKey,
                (old: PaginatedResponse<FundPeriod> | undefined) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: (old.data ?? []).filter((item) => item.id !== deletedId),
                        meta: {
                            ...old.meta,
                            total: Math.max(0, (old.meta?.total ?? 1) - 1),
                        },
                    };
                }
            );
            toast.success(t("deleteSuccess"));
        },
        onError: (error: unknown) => {
            toast.error((error as Error)?.message || t("loadError"));
        },
    });

    // ── Toggle → setQueryData ──────────────────────────────────────────────────
    const toggleMutation = useMutation({
        mutationFn: (id: number) =>
            service.toggleStatus(id) as Promise<ApiResponse<FundPeriod>>,
        onSuccess: (res, id) => {
            if (!res.success) return;
            const saved = res.data;
            queryClient.setQueryData(
                queryKey,
                (old: PaginatedResponse<FundPeriod> | undefined) => {
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

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleCreate = async (
        values: Record<string, string>,
        translations?: TranslationEntry[]
    ): Promise<SubmitResult> => {
        try {
            const raw = await createMutation.mutateAsync(
                buildPayload(values, translations)
            );
            const res = raw as ApiResponse<FundPeriod>;
            if (!res.success) {
                return { success: false, message: res.message, errors: res.errors };
            }
            queryClient.invalidateQueries({ queryKey: ["fund-periods", clubSlug] });
            toast.success(res.message || t("saveSuccess"));
            return;
        } catch (error: unknown) {
            const serverErr = getServerError(error);
            if (serverErr) return serverErr;
            toast.error((error as Error)?.message || t("loadError"));
            return { success: false };
        }
    };

    const handleDeleteConfirm = (id: number) => deleteMutation.mutate(id);

    const handleToggleStatus = (row: FundPeriod) => {
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
        isCreating: createMutation.isPending,
        isDeleting: deleteMutation.isPending,
        handleCreate,
        handleDeleteConfirm,
        handleToggleStatus,
    };
}