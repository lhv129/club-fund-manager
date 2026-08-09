"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { getBankAccountService } from "@/domains/bankAccount/services/bankAccountService";
import { useBankSelect } from "@/domains/bank/hooks/useBanks";

import type {
    BankAccount,
    BankAccountFilters,
} from "@/domains/bankAccount/types";

import type { useListParams } from "@/hooks/useListParams";

import type {
    ApiResponse,
    PaginatedResponse,
} from "@/types/api";

import type {
    ServerErrorResponse,
    SubmitResult,
} from "@/components/shared/forms/FormModalWithMedia";

/**
 * Kiểu dữ liệu cache của danh sách bank account.
 */
type BankAccountListCache =
    PaginatedResponse<BankAccount>;

/**
 * Context dùng để rollback optimistic update
 * nếu toggle API bị lỗi.
 */
type ToggleMutationContext = {
    previous?: BankAccountListCache;
};

/**
 * Lấy lỗi validation/server từ nhiều dạng response khác nhau.
 */
function getServerError(
    error: unknown
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
        (error as ServerErrorResponse).success === false
    ) {
        return error as ServerErrorResponse;
    }

    return null;
}

export function useBankAccounts(
    params: ReturnType<
        typeof useListParams<BankAccountFilters>
    >["params"]
) {
    const queryClient = useQueryClient();
    const t = useTranslations("common");
    const [togglingStatusIds, setTogglingStatusIds] = useState<Set<number>>(new Set());
    const [togglingDefaultIds, setTogglingDefaultIds] = useState<Set<number>>(new Set());

    const { slug } = useParams<{
        slug: string;
    }>();

    const clubSlug = slug;

    const service =
        getBankAccountService(clubSlug);

    const { data: banks, isLoading: isBanksLoading } = useBankSelect();

    /**
     * Query key phải được dùng thống nhất khi đọc
     * và cập nhật cache.
     */
    const queryKey = [
        "bank-accounts",
        clubSlug,
        params,
    ] as const;

    /**
     * Get list
     */
    const {
        data: listData,
        isLoading,
    } = useQuery<
        PaginatedResponse<BankAccount>
    >({
        queryKey,
        queryFn: async () => {
            return service.list(params) as Promise<
                PaginatedResponse<BankAccount>
            >;
        },
        enabled: Boolean(clubSlug),
    });

    const data = listData?.data ?? [];
    const total = listData?.meta?.total ?? 0;

    /**
     * Create
     */
    const createMutation = useMutation({
        mutationFn: async (payload: FormData) => {
            return service.create(payload);
        },
    });

    /**
     * Update
     */
    const updateMutation = useMutation({
        mutationFn: async ({
            id,
            payload,
        }: {
            id: number;
            payload: FormData;
        }) => {
            return service.update(id, payload);
        },
    });

    /**
     * Delete
     */
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            return service.destroy(id);
        },

        onSuccess: (result, deletedId) => {
            const response =
                result as ApiResponse<unknown>;

            if (!response.success) {
                toast.error(
                    response.message ||
                    t("deleteError")
                );

                return;
            }

            /**
             * Xóa trực tiếp item khỏi cache,
             * không cần fetch lại danh sách.
             */
            queryClient.setQueryData<BankAccountListCache>(
                queryKey,
                (old) => {
                    if (!old) {
                        return old;
                    }

                    return {
                        ...old,
                        data: (old.data ?? []).filter(
                            (item) =>
                                item.id !== deletedId
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

            toast.success(
                response.message ||
                t("deleteSuccess")
            );
        },

        onError: (error: unknown) => {
            toast.error(
                (error as Error)?.message ||
                t("deleteError")
            );
        },
    });

    /**
     * Toggle is_active
     *
     * - Cập nhật UI ngay lập tức.
     * - Không invalidate query.
     * - Nếu API lỗi thì rollback state cũ.
     */
    const toggleStatusMutation = useMutation<
        ApiResponse<BankAccount>,
        unknown,
        number,
        ToggleMutationContext
    >({
        mutationFn: async (id: number) => {
            return service.toggleStatus(id) as Promise<
                ApiResponse<BankAccount>
            >;
        },

        onMutate: async (id) => {
            await queryClient.cancelQueries({
                queryKey,
            });

            const previous =
                queryClient.getQueryData<BankAccountListCache>(
                    queryKey
                );

            queryClient.setQueryData<BankAccountListCache>(
                queryKey,
                (old) => {
                    if (!old) {
                        return old;
                    }

                    return {
                        ...old,
                        data: (old.data ?? []).map(
                            (item) =>
                                item.id === id
                                    ? {
                                        ...item,
                                        is_active:
                                            !item.is_active,
                                    }
                                    : item
                        ),
                    };
                }
            );

            return {
                previous,
            };
        },

        onSuccess: (
            response,
            id,
            context
        ) => {
            /**
             * Một số API có thể trả success=false
             * thay vì throw error.
             */
            if (!response.success) {
                if (context?.previous) {
                    queryClient.setQueryData(
                        queryKey,
                        context.previous
                    );
                }

                toast.error(
                    response.message ||
                    t("updateError")
                );

                return;
            }

            /**
             * Nếu backend trả về bank account mới,
             * đồng bộ lại row tương ứng.
             *
             * Nếu response không có data,
             * giữ nguyên optimistic state hiện tại.
             */
            if (response.data) {
                queryClient.setQueryData<BankAccountListCache>(
                    queryKey,
                    (old) => {
                        if (!old) {
                            return old;
                        }

                        return {
                            ...old,
                            data: (old.data ?? []).map(
                                (item) =>
                                    item.id === id
                                        ? {
                                            ...item,
                                            ...response.data,
                                        }
                                        : item
                            ),
                        };
                    }
                );
            }

            toast.success(
                response.message ||
                t("updateStatus")
            );
        },

        onError: (
            error,
            _id,
            context
        ) => {
            /**
             * Rollback về state trước khi click.
             */
            if (context?.previous) {
                queryClient.setQueryData(
                    queryKey,
                    context.previous
                );
            }

            toast.error(
                (error as Error)?.message ||
                t("updateError")
            );
        },
    });

    /**
     * Toggle is_default
     *
     * Quy tắc:
     * - Bật một account làm default:
     *   các account khác trong list sẽ thành false.
     * - Tắt account default:
     *   không tự bật account khác.
     * - Không fetch lại API.
     * - API lỗi thì rollback toàn bộ list.
     */
    const toggleDefaultMutation = useMutation<
        ApiResponse<BankAccount>,
        unknown,
        number,
        ToggleMutationContext
    >({
        mutationFn: async (id: number) => {
            return service.toggleDefault(id) as Promise<
                ApiResponse<BankAccount>
            >;
        },

        onMutate: async (id) => {
            await queryClient.cancelQueries({
                queryKey,
            });

            const previous =
                queryClient.getQueryData<BankAccountListCache>(
                    queryKey
                );

            queryClient.setQueryData<BankAccountListCache>(
                queryKey,
                (old) => {
                    if (!old) {
                        return old;
                    }

                    const current =
                        old.data?.find(
                            (item) => item.id === id
                        );

                    const nextIsDefault =
                        !Boolean(
                            current?.is_default
                        );

                    return {
                        ...old,
                        data: (old.data ?? []).map(
                            (item) => {
                                /**
                                 * Row đang toggle.
                                 */
                                if (item.id === id) {
                                    return {
                                        ...item,
                                        is_default:
                                            nextIsDefault,
                                    };
                                }

                                /**
                                 * Nếu row hiện tại được bật
                                 * làm default thì tắt default
                                 * của các row khác.
                                 */
                                if (nextIsDefault) {
                                    return {
                                        ...item,
                                        is_default: false,
                                    };
                                }

                                return item;
                            }
                        ),
                    };
                }
            );

            return {
                previous,
            };
        },

        onSuccess: (
            response,
            id,
            context
        ) => {
            if (!response.success) {
                if (context?.previous) {
                    queryClient.setQueryData(
                        queryKey,
                        context.previous
                    );
                }

                toast.error(
                    response.message ||
                    t("updateError")
                );

                return;
            }

            /**
             * Nếu backend trả về row mới,
             * đồng bộ row đó vào cache.
             */
            if (response.data) {
                const serverRow =
                    response.data;

                const serverIsDefault =
                    Boolean(
                        serverRow.is_default
                    );

                queryClient.setQueryData<BankAccountListCache>(
                    queryKey,
                    (old) => {
                        if (!old) {
                            return old;
                        }

                        return {
                            ...old,
                            data: (old.data ?? []).map(
                                (item) => {
                                    /**
                                     * Cập nhật row vừa toggle
                                     * bằng dữ liệu backend.
                                     */
                                    if (item.id === id) {
                                        return {
                                            ...item,
                                            ...serverRow,
                                        };
                                    }

                                    /**
                                     * Backend xác nhận row này
                                     * là default thì các row khác
                                     * phải false.
                                     */
                                    if (serverIsDefault) {
                                        return {
                                            ...item,
                                            is_default: false,
                                        };
                                    }

                                    return item;
                                }
                            ),
                        };
                    }
                );
            }

            toast.success(
                response.message ||
                t("updateStatus")
            );
        },

        onError: (
            error,
            _id,
            context
        ) => {
            /**
             * Rollback toàn bộ cache nếu request lỗi.
             */
            if (context?.previous) {
                queryClient.setQueryData(
                    queryKey,
                    context.previous
                );
            }

            toast.error(
                (error as Error)?.message ||
                t("updateError")
            );
        },
    });

    /**
     * Create handler
     */
    const handleCreate = async (
        formData: FormData
    ): Promise<SubmitResult> => {
        try {
            const result =
                await createMutation.mutateAsync(
                    formData
                );

            const response =
                result as ApiResponse<BankAccount>;

            if (!response.success) {
                return {
                    success: false,
                    message: response.message,
                    errors: response.errors,
                };
            }

            /**
             * Create cần fetch lại để lấy row mới,
             * vì row mới chưa có trong cache hiện tại.
             */
            await queryClient.invalidateQueries({
                queryKey: [
                    "bank-accounts",
                    clubSlug,
                ],
            });

            toast.success(
                response.message ||
                t("saveSuccess")
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
                t("saveError")
            );

            return {
                success: false,
            };
        }
    };

    /**
     * Update handler
     */
    const handleEdit = async (
        id: number,
        formData: FormData
    ): Promise<SubmitResult> => {
        try {
            const result =
                await updateMutation.mutateAsync({
                    id,
                    payload: formData,
                });

            const response =
                result as ApiResponse<BankAccount>;

            if (!response.success) {
                return {
                    success: false,
                    message: response.message,
                    errors: response.errors,
                };
            }

            /**
             * Update cần fetch lại để đảm bảo
             * các field như qr_image đồng bộ chính xác.
             */
            await queryClient.invalidateQueries({
                queryKey: [
                    "bank-accounts",
                    clubSlug,
                ],
            });

            toast.success(
                response.message ||
                t("updateSuccess")
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
                t("updateError")
            );

            return {
                success: false,
            };
        }
    };

    /**
     * Public handlers
     */
    const handleDeleteConfirm = (id: number) => {
        deleteMutation.mutate(id);
    };

    const handleToggleStatus = (id: number) => {
        if (togglingStatusIds.has(id)) {
            return;
        }

        setTogglingStatusIds((previous) =>
            new Set(previous).add(id)
        );

        toggleStatusMutation.mutate(id, {
            onSettled: () => {
                setTogglingStatusIds((previous) => {
                    const next = new Set(previous);
                    next.delete(id);
                    return next;
                });
            },
        });
    };

    const handleToggleDefault = (id: number) => {
        if (togglingDefaultIds.has(id)) {
            return;
        }

        setTogglingDefaultIds((previous) =>
            new Set(previous).add(id)
        );

        toggleDefaultMutation.mutate(id, {
            onSettled: () => {
                setTogglingDefaultIds((previous) => {
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
        isLoading,
        banks,
        isBanksLoading,

        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,

        togglingStatusIds,
        togglingDefaultIds,

        handleCreate,
        handleEdit,
        handleDeleteConfirm,
        handleToggleStatus,
        handleToggleDefault,
    };
}
