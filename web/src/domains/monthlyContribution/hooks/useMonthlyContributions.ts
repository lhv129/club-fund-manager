// src/domains/monthlyContribution/hooks/useMonthlyContributions.ts
"use client";

import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { getMonthlyContributionService } from "@/domains/monthlyContribution/services/monthlyContributionService";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type {
    MonthlyContribution,
    MonthlyContributionFilters,
} from "@/domains/monthlyContribution/types";
import type { useListParams } from "@/hooks/useListParams";
import type {
    SubmitResult,
    ServerErrorResponse,
} from "@/components/shared/forms/FormModal";

function getServerError(err: unknown): ServerErrorResponse | null {
    const responseData = (
        err as {
            response?: {
                data?: ServerErrorResponse;
            };
        }
    )?.response?.data;

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

function buildPayload(values: Record<string, string>): FormData {
    const formData = new FormData();

    formData.append("user_id", values.user_id ?? "");
    formData.append("period_id", values.period_id ?? "");

    if (values.transaction_id) {
        formData.append("transaction_id", values.transaction_id);
    }

    formData.append("status", values.status || "pending");

    if (values.paid_by) {
        formData.append("paid_by", values.paid_by);
    }

    if (values.payment_date) {
        formData.append("payment_date", values.payment_date);
    }

    return formData;
}

export function useMonthlyContributions(
    params: ReturnType<
        typeof useListParams<MonthlyContributionFilters>
    >["params"]
) {
    const queryClient = useQueryClient();
    const t = useTranslations("common");

    const clubSlug = params.club_slug as string | undefined;

    const service = getMonthlyContributionService();

    const queryKey = [
        "monthly-contributions",
        clubSlug,
        params,
    ] as const;

    const { data: listData, isLoading } = useQuery({
        queryKey,
        queryFn: () => service.list(params),
        enabled: !!clubSlug,
    });

    const data = listData?.data ?? [];
    const total = listData?.meta?.total ?? 0;

    const createMutation = useMutation({
        mutationFn: (payload: FormData) => service.create(payload),
    });

    const updateMutation = useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: number;
            payload: FormData;
        }) => service.update(id, payload),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => service.destroy(id),

        onSuccess: (res, deletedId) => {
            if (!res.success) return;

            queryClient.setQueryData(
                queryKey,
                (
                    old:
                        | PaginatedResponse<MonthlyContribution>
                        | undefined
                ) => {
                    if (!old) return old;

                    return {
                        ...old,
                        data: (old.data ?? []).filter(
                            (item) => item.id !== deletedId
                        ),
                        meta: {
                            ...old.meta,
                            total: Math.max(
                                0,
                                (old.meta?.total ?? 1) - 1
                            ),
                        },
                    };
                }
            );

            toast.success(res.message || t("deleteSuccess"));
        },

        onError: (error: unknown) => {
            toast.error(
                (error as Error)?.message || t("loadError")
            );
        },
    });

    const handleCreate = async (
        values: Record<string, string>
    ): Promise<SubmitResult> => {
        try {
            const raw = await createMutation.mutateAsync(
                buildPayload(values)
            );

            const res = raw as ApiResponse<MonthlyContribution>;

            if (!res.success) {
                return {
                    success: false,
                    message: res.message,
                    errors: res.errors,
                };
            }

            await queryClient.invalidateQueries({
                queryKey: ["monthly-contributions", clubSlug],
            });

            toast.success(res.message || t("saveSuccess"));

            return;
        } catch (error: unknown) {
            const serverError = getServerError(error);

            if (serverError) return serverError;

            toast.error(
                (error as Error)?.message || t("loadError")
            );

            return {
                success: false,
            };
        }
    };

    const handleEdit = async (
        id: number,
        values: Record<string, string>
    ): Promise<SubmitResult> => {
        try {
            const raw = await updateMutation.mutateAsync({
                id,
                payload: buildPayload(values),
            });

            const res = raw as ApiResponse<MonthlyContribution>;

            if (!res.success) {
                return {
                    success: false,
                    message: res.message,
                    errors: res.errors,
                };
            }

            await queryClient.invalidateQueries({
                queryKey: ["monthly-contributions", clubSlug],
            });

            toast.success(res.message || t("updateSuccess"));

            return;
        } catch (error: unknown) {
            const serverError = getServerError(error);

            if (serverError) return serverError;

            toast.error(
                (error as Error)?.message || t("loadError")
            );

            return {
                success: false,
            };
        }
    };

    const handleDeleteConfirm = (id: number) => {
        deleteMutation.mutate(id);
    };

    return {
        data,
        total,
        isLoading,

        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,

        handleCreate,
        handleEdit,
        handleDeleteConfirm,
    };
}

// ─── Select hook (dùng bởi module khác cần dropdown monthly-contribution) ────
// Cùng query key với inline select (nếu có trong useMonthlyContributions) để share cache.
export function useMonthlyContributionSelect(params?: Partial<MonthlyContributionFilters> & { club_slug?: string | null }) {
    const clubSlug = params?.club_slug;
    const query = useQuery({
        queryKey: ["monthly-contributions-select", clubSlug],
        queryFn: () => {
            return getMonthlyContributionService().select(params);
        },
        enabled: true,
    });

    return {
        data: query.data?.data ?? [],
        isLoading: query.isLoading,
    };
}
