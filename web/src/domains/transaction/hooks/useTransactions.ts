// src/domains/transaction/hooks/useTransactions.ts
"use client";

import {
    keepPreviousData,
    useQueryClient,
    useQuery,
    useMutation,
} from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { getTransactionService } from "@/domains/transaction/services/transactionService";
import type {
    Transaction,
    TransactionFilters,
} from "@/domains/transaction/types";
import type { useListParams } from "@/hooks/useListParams";
import type { ApiResponse } from "@/types/api";
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

function buildPayload(
    values: Record<string, string>,
    clubSlug?: string,
    includeSource = false,
): FormData {
    const formData = new FormData();
    const fields = includeSource
        ? ["source", "type", "amount", "bank_account_id", "transaction_date", "description"]
        : ["type", "amount", "bank_account_id", "transaction_date", "description"];

    for (const field of fields) {
        if (Object.prototype.hasOwnProperty.call(values, field)) {
            formData.append(field, values[field] ?? "");
        }
    }

    if (clubSlug) formData.set("club_slug", clubSlug);
    return formData;
}

function getResponseMessage<T>(response: ApiResponse<T>, fallback: string): string {
    return response.message || fallback;
}

export function useTransactions(
    params: ReturnType<
        typeof useListParams<TransactionFilters>
    >["params"]
) {
    const clubSlug = params.club_slug as string | undefined;
    const queryClient = useQueryClient();
    const t = useTranslations("common");
    const service = getTransactionService();
    const queryKey = ["transactions", clubSlug, params] as const;

    const {
        data: listData,
        isLoading,
        isFetching,
    } = useQuery({
        queryKey,
        queryFn: () => service.list(params),
        enabled: Boolean(clubSlug),
        placeholderData: keepPreviousData,
    });

    const createMutation = useMutation({
        mutationFn: (payload: FormData) => service.create(payload),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FormData }) =>
            service.update(id, payload),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => service.destroy(
            id,
            clubSlug ? { club_slug: clubSlug } : undefined,
        ),
    });

    const invalidateTransactions = async () => {
        await queryClient.invalidateQueries({
            queryKey: ["transactions", clubSlug],
        });
    };

    const data = listData?.data ?? [];
    const total = listData?.meta?.total ?? 0;

    const handleCreate = async (
        values: Record<string, string>,
    ): Promise<SubmitResult> => {
        try {
            const raw = await createMutation.mutateAsync(
                buildPayload(values, clubSlug, true),
            );
            const response = raw as ApiResponse<Transaction>;

            if (!response.success) {
                return {
                    success: false,
                    message: response.message,
                    errors: response.errors,
                };
            }

            await invalidateTransactions();
            toast.success(getResponseMessage(response, t("createSuccess")));
            return;
        } catch (error: unknown) {
            const serverError = getServerError(error);
            if (serverError) return serverError;

            toast.error((error as Error)?.message || t("loadError"));
            return { success: false };
        }
    };

    const handleEdit = async (
        id: number,
        values: Record<string, string>,
    ): Promise<SubmitResult> => {
        try {
            const raw = await updateMutation.mutateAsync({
                id,
                payload: buildPayload(values, clubSlug),
            });
            const response = raw as ApiResponse<Transaction>;

            if (!response.success) {
                return {
                    success: false,
                    message: response.message,
                    errors: response.errors,
                };
            }

            await invalidateTransactions();
            toast.success(getResponseMessage(response, t("updateSuccess")));
            return;
        } catch (error: unknown) {
            const serverError = getServerError(error);
            if (serverError) return serverError;

            toast.error((error as Error)?.message || t("loadError"));
            return { success: false };
        }
    };

    const handleDeleteConfirm = async (id: number): Promise<boolean> => {
        try {
            const raw = await deleteMutation.mutateAsync(id);
            const response = raw as unknown as ApiResponse<unknown>;

            // BaseRepository.destroy is typed as PaginatedResponse, while the
            // controller may return ApiResponse or an empty success body.
            // Only an explicit API failure should keep the confirm modal open.
            if (response?.success === false) {
                toast.error(response?.message || t("loadError"));
                return false;
            }

            await invalidateTransactions();
            toast.success(response.message || t("deleteSuccess"));
            return true;
        } catch (error: unknown) {
            const serverError = getServerError(error);
            if (serverError) {
                toast.error(serverError.message || t("loadError"));
                return false;
            }

            toast.error((error as Error)?.message || t("loadError"));
            return false;
        }
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

export function useTransaction(
    clubSlug: string,
    id: number,
) {
    return useQuery({
        queryKey: ["transactions", clubSlug, id],
        queryFn: () => getTransactionService().show(id, clubSlug),
        enabled: Boolean(clubSlug) && Number.isFinite(id) && id > 0,
    });
}
