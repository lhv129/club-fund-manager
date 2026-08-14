// src/domains/monthlyContribution/hooks/useMonthlyContributions.ts
"use client";

import { useCallback, useState } from "react";
import { keepPreviousData, useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
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

    const { data: listData, isLoading, isFetching } = useQuery({
        queryKey,
        queryFn: () => service.list(params),
        placeholderData: keepPreviousData,
        enabled: !!clubSlug,
    });

    const data = listData?.data ?? [];
    const total = listData?.meta?.total ?? 0;

    const matchesCurrentFilters = (item: MonthlyContribution) =>
        (!params.period_id || item.period_id === Number(params.period_id))
        && (!params.user_id || item.user_id === Number(params.user_id))
        && (!params.status || item.status === params.status)
        && (!params.paid_by || item.paid_by === params.paid_by);

    const updateCurrentList = (
        updater: (items: MonthlyContribution[]) => MonthlyContribution[],
    ) => {
        queryClient.setQueryData(
            queryKey,
            (old: PaginatedResponse<MonthlyContribution> | undefined) => {
                if (!old) return old;

                const nextData = updater(old.data ?? []);

                return {
                    ...old,
                    data: nextData,
                    meta: {
                        ...old.meta,
                        total: nextData.length === (old.data ?? []).length
                            ? old.meta.total
                            : Math.max(0, old.meta.total + nextData.length - (old.data ?? []).length),
                    },
                };
            },
        );
    };

    const createMutation = useMutation({
        mutationFn: (payload: FormData) => {
            if (clubSlug) payload.set("club_slug", clubSlug);
            return service.create(payload);
        },
        onSuccess: (res) => {
            const saved = res.data;
            if (!res.success || !saved) return;
            updateCurrentList((items) => matchesCurrentFilters(saved)
                ? [saved, ...items.filter((item) => item.id !== saved.id)]
                : items);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: number;
            payload: FormData;
        }) => {
            if (clubSlug) payload.set("club_slug", clubSlug);
            return service.update(id, payload);
        },
        onSuccess: (res) => {
            const saved = res.data;
            if (!res.success || !saved) return;
            updateCurrentList((items) => matchesCurrentFilters(saved)
                ? items.map((item) => item.id === saved.id
                    ? { ...item, ...saved }
                    : item)
                : items.filter((item) => item.id !== saved.id));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => service.destroyContribution(id, { club_slug: clubSlug }),

        onSuccess: (res, deletedId) => {
            if (!res.success) return;
            const saved = res.data;

            updateCurrentList((items) =>
                saved?.delete_action === "cancelled"
                    ? (matchesCurrentFilters(saved)
                        ? items.map((item) => item.id === deletedId
                            ? { ...item, ...saved }
                            : item)
                        : items.filter((item) => item.id !== deletedId))
                    : items.filter((item) => item.id !== deletedId)
            );

            void queryClient.invalidateQueries({
                queryKey: ["monthly-contributions", clubSlug],
            });

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
        isFetching,

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

export function useMonthlyContribution(id: number, clubSlug: string) {
    return useQuery({
        queryKey: ["monthly-contribution", clubSlug, id],
        queryFn: () => getMonthlyContributionService().show(id, clubSlug),
        enabled: Boolean(id && clubSlug),
    });
}

export function useMonthlyContributionPaymentQr(
    clubSlug?: string | null
) {
    const t = useTranslations("common");
    const tm = useTranslations("monthlyContribution");
    const [qrUrl, setQrUrl] = useState<string | null>(null);

    const paymentQrMutation = useMutation({
        mutationFn: (id: number) => {
            if (!clubSlug) {
                throw new Error(t("loadError"));
            }

            return getMonthlyContributionService().generateOrReuse(
                id,
                clubSlug
            );
        },
    });

    const closePaymentQrModal = useCallback(() => {
        setQrUrl(null);
    }, []);

    const handleGetPaymentQr = async (id: number) => {
        if (!clubSlug || paymentQrMutation.isPending) return;

        try {
            const response = await paymentQrMutation.mutateAsync(id);

            if (!response.success) {
                toast.error(response.message || t("loadError"));
                return;
            }

            const qr = response.data?.qr;

            if (!qr?.enabled || !qr.url) {
                toast.error(tm("paymentQrUnavailable"));
                return;
            }

            setQrUrl(qr.url);
            toast.success(
                response.message || tm("paymentQrSuccess")
            );
        } catch (error: unknown) {
            const serverError = getServerError(error);

            toast.error(
                serverError?.message ||
                (error as Error)?.message ||
                t("loadError")
            );
        }
    };

    return {
        qrUrl,
        isGettingPaymentQr: paymentQrMutation.isPending,
        gettingPaymentQrId: paymentQrMutation.variables ?? null,
        handleGetPaymentQr,
        closePaymentQrModal,
    };
}
