// src/domains/transaction/hooks/useTransactions.ts
"use client";

import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { getTransactionService } from "@/domains/transaction/services/transactionService";
import type {
    Transaction,
    TransactionFilters,
    TransactionSelect,
} from "@/domains/transaction/types";
import type { useListParams } from "@/hooks/useListParams";
import type {
    ApiResponse,
    PaginatedResponse,
} from "@/types/api";
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
    values: Record<string, string>
): FormData {
    const formData = new FormData();

    if (values.bank_account_id) {
        formData.append(
            "bank_account_id",
            values.bank_account_id
        );
    }

    formData.append("type", values.type || "income");

    if (values.source) {
        formData.append("source", values.source);
    }

    formData.append("amount", (values.amount ?? "").replace(/,/g, ""));

    if (values.description) {
        formData.append("description", values.description);
    }

    if (values.transaction_date) {
        formData.append(
            "transaction_date",
            values.transaction_date
        );
    }

    return formData;
}

export function useTransactions(
    clubSlug: string,
    params: ReturnType<
        typeof useListParams<TransactionFilters>
    >["params"]
) {
    const queryClient = useQueryClient();
    const t = useTranslations("common");

    const service = getTransactionService(clubSlug);

    const queryKey = ["transactions", clubSlug, params] as const;

    const { data: listData, isLoading } = useQuery({
        queryKey,
        queryFn: () => service.list(params),
        enabled: !!clubSlug,
    });

    const {
        data: selectResponse,
        isLoading: isSelectLoading,
    } = useQuery({
        queryKey: ["transactions-select", clubSlug],
        queryFn: () =>
            service.select() as Promise<
                ApiResponse<TransactionSelect[]>
            >,
        enabled: !!clubSlug,
    });

    const data = listData?.data ?? [];
    const total = listData?.meta?.total ?? 0;
    const selectData = selectResponse?.data ?? [];

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

    const handleCreate = async (
        values: Record<string, string>
    ): Promise<SubmitResult> => {
        try {
            const raw = await createMutation.mutateAsync(
                buildPayload(values)
            );

            const res = raw as ApiResponse<Transaction>;

            if (!res.success) {
                return {
                    success: false,
                    message: res.message,
                    errors: res.errors,
                };
            }

            await queryClient.invalidateQueries({
                queryKey: ["transactions", clubSlug],
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

            const res = raw as ApiResponse<Transaction>;

            if (!res.success) {
                return {
                    success: false,
                    message: res.message,
                    errors: res.errors,
                };
            }

            await queryClient.invalidateQueries({
                queryKey: ["transactions", clubSlug],
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

    const deleteMutation = useMutation({
        mutationFn: (id: number) => service.destroy(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["transactions", clubSlug] });
            toast.success(t("deleteSuccess"));
        },
        onError: (error: unknown) => {
            toast.error((error as Error)?.message || t("loadError"));
        },
    });

    return {
        data,
        total,
        isLoading,

        selectData,
        isSelectLoading,

        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,

        handleCreate,
        handleEdit,
        handleDelete: (id: number) => deleteMutation.mutate(id),
    };
}

export function useTransaction(clubSlug: string, id: number) {
    return useQuery({
        queryKey: ["transactions", clubSlug, id],
        queryFn: () => getTransactionService(clubSlug).show(id),
        enabled: Boolean(clubSlug) && Number.isFinite(id) && id > 0,
    });
}

export function useTransactionSelect(
    clubSlug?: string | null,
    params?: Partial<TransactionFilters>
) {
    const query = useQuery({
        queryKey: [
            "transactions-select",
            clubSlug,
            params,
        ],

        queryFn: () => {
            if (!clubSlug) {
                throw new Error("Club slug is required");
            }

            return getTransactionService(clubSlug).select(params) as Promise<
                ApiResponse<TransactionSelect[]>
            >;
        },

        enabled: Boolean(clubSlug),
    });

    return {
        data: query.data?.data ?? [],
        isLoading: query.isLoading,
    };
}
