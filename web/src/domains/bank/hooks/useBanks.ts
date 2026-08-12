"use client";

import { useState } from "react";

import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { bankService } from "@/domains/bank/services/bankService";

import type {
    Bank,
    BankFilters,
} from "@/domains/bank/types";

import type { useListParams } from "@/hooks/useListParams";

import type {
    ApiResponse,
    PaginatedResponse,
} from "@/types/api";

import type {
    ServerErrorResponse,
    SubmitResult,
} from "@/components/shared/forms/FormModalWithMedia";

function getServerError(
    error: unknown,
): ServerErrorResponse | null {
    const responseData = (
        error as {
            response?: {
                data?: ServerErrorResponse;
            };
        }
    )?.response?.data;

    if (responseData) {
        return responseData;
    }

    if (
        error &&
        typeof error === "object" &&
        "success" in error &&
        (
            error as ServerErrorResponse
        ).success === false
    ) {
        return error as ServerErrorResponse;
    }

    return null;
}

export function useBanks(
    params: ReturnType<
        typeof useListParams<BankFilters>
    >["params"],
) {
    const queryClient = useQueryClient();
    const t = useTranslations("common");

    const [
        togglingIds,
        setTogglingIds,
    ] = useState<Set<number>>(new Set());

    const queryKey = [
        "banks",
        params,
    ] as const;

    const {
        data: listData,
        isLoading,
        isFetching: isBankListFetching,
    } = useQuery<
        PaginatedResponse<Bank>
    >({
        queryKey,

        queryFn: () => {
            return bankService.list(
                params,
            ) as Promise<
                PaginatedResponse<Bank>
            >;
        },

        /**
         * Giữ data cũ trong lúc
         * filter/page/sort thay đổi.
         */
        placeholderData: keepPreviousData,
    });

    const data = listData?.data ?? [];

    const total =
        listData?.meta?.total ?? 0;

    const createMutation = useMutation({
        mutationFn: (
            payload: FormData,
        ) => bankService.create(payload),
    });

    const updateMutation = useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: number;
            payload: FormData;
        }) => {
            return bankService.update(
                id,
                payload,
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => {
            return bankService.destroy(id);
        },

        onSuccess: (raw, id) => {
            const response =
                raw as ApiResponse<unknown>;

            if (!response.success) {
                toast.error(
                    response.message ||
                    t("loadError"),
                );

                return;
            }

            queryClient.setQueryData<
                PaginatedResponse<Bank>
            >(
                queryKey,
                (old) => {
                    if (!old) {
                        return old;
                    }

                    return {
                        ...old,

                        data: (
                            old.data ?? []
                        ).filter(
                            (row) =>
                                row.id !== id,
                        ),

                        meta: {
                            ...old.meta,
                            total: Math.max(
                                0,
                                (
                                    old.meta
                                        ?.total ?? 1
                                ) - 1,
                            ),
                        },
                    };
                },
            );

            toast.success(
                response.message ||
                t("deleteSuccess"),
            );
        },

        onError: (error: unknown) => {
            toast.error(
                (error as Error)?.message ||
                t("loadError"),
            );
        },
    });

    const toggleMutation = useMutation({
        mutationFn: (id: number) => {
            return bankService.toggleStatus(
                id,
            ) as Promise<
                ApiResponse<Bank>
            >;
        },

        onSuccess: (response, id) => {
            if (!response.success) {
                toast.error(
                    response.message ||
                    t("loadError"),
                );

                return;
            }

            queryClient.setQueryData<
                PaginatedResponse<Bank>
            >(
                queryKey,
                (old) => {
                    if (!old) {
                        return old;
                    }

                    return {
                        ...old,

                        data: (
                            old.data ?? []
                        ).map((row) => {
                            if (row.id !== id) {
                                return row;
                            }

                            return {
                                ...row,
                                ...(response.data ??
                                    {}),
                                is_active:
                                    response.data
                                        ?.is_active ??
                                    !row.is_active,
                            };
                        }),
                    };
                },
            );

            toast.success(
                response.message ||
                t("updateStatus"),
            );
        },

        onError: (error: unknown) => {
            toast.error(
                (error as Error)?.message ||
                t("loadError"),
            );
        },
    });

    const submit = async (
        operation: () => Promise<unknown>,
        successKey: string,
    ): Promise<SubmitResult> => {
        try {
            const raw = await operation();

            const response =
                raw as ApiResponse<Bank>;

            if (!response.success) {
                return {
                    success: false,
                    message: response.message,
                    errors: response.errors,
                };
            }

            await queryClient.invalidateQueries({
                queryKey: ["banks"],
            });

            toast.success(
                response.message ||
                t(successKey),
            );

            return;
        } catch (error: unknown) {
            const serverError =
                getServerError(error);

            if (serverError) {
                return serverError;
            }

            toast.error(
                (error as Error)?.message ||
                t("loadError"),
            );

            return {
                success: false,
            };
        }
    };

    const handleCreate = (
        payload: FormData,
    ) => {
        return submit(
            () =>
                createMutation.mutateAsync(
                    payload,
                ),
            "saveSuccess",
        );
    };

    const handleEdit = (
        id: number,
        payload: FormData,
    ) => {
        return submit(
            () =>
                updateMutation.mutateAsync({
                    id,
                    payload,
                }),
            "updateSuccess",
        );
    };

    const handleDeleteConfirm = (
        id: number,
    ) => {
        deleteMutation.mutate(id);
    };

    const handleToggleStatus = (
        id: number,
    ) => {
        if (togglingIds.has(id)) {
            return;
        }

        setTogglingIds((previous) => {
            return new Set(previous).add(id);
        });

        toggleMutation.mutate(id, {
            onSettled: () => {
                setTogglingIds((previous) => {
                    const next = new Set(previous);

                    next.delete(id);

                    return next;
                });
            },
        });
    };

    return {
        data,
        total,

        /**
         * Loading lần đầu,
         * khi chưa có data.
         */
        isLoading,

        /**
         * Loading khi đổi filter,
         * sort hoặc pagination.
         */
        isFetching: isBankListFetching,

        isCreating:
            createMutation.isPending,

        isUpdating:
            updateMutation.isPending,

        isDeleting:
            deleteMutation.isPending,

        togglingIds,

        handleCreate,
        handleEdit,
        handleDeleteConfirm,
        handleToggleStatus,
    };
}

export function useBankSelect() {
    const {
        data,
        isLoading,
        isFetching,
    } = useQuery({
        queryKey: ["banks-select"],

        queryFn: () => {
            return bankService.select() as Promise<
                ApiResponse<Bank[]>
            >;
        },
    });

    return {
        data: data?.data ?? [],
        isLoading,
        isFetching,
    };
}