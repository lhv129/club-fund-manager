"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { bankService } from "@/domains/bank/services/bankService";
import type { Bank, BankFilters } from "@/domains/bank/types";
import type { useListParams } from "@/hooks/useListParams";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { ServerErrorResponse, SubmitResult } from "@/components/shared/forms/FormModalWithMedia";

function getServerError(error: unknown): ServerErrorResponse | null {
    const responseData = (error as { response?: { data?: ServerErrorResponse } })?.response?.data;
    if (responseData) return responseData;
    if (error && typeof error === "object" && "success" in error && (error as ServerErrorResponse).success === false) return error as ServerErrorResponse;
    return null;
}

export function useBanks(params: ReturnType<typeof useListParams<BankFilters>>["params"]) {
    const queryClient = useQueryClient();
    const t = useTranslations("common");
    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
    const queryKey = ["banks", params] as const;
    const { data: listData, isLoading } = useQuery({ queryKey, queryFn: () => bankService.list(params) as Promise<PaginatedResponse<Bank>> });
    const data = listData?.data ?? [];
    const total = listData?.meta?.total ?? 0;
    const createMutation = useMutation({ mutationFn: (payload: FormData) => bankService.create(payload) });
    const updateMutation = useMutation({ mutationFn: ({ id, payload }: { id: number; payload: FormData }) => bankService.update(id, payload) });
    const deleteMutation = useMutation({
        mutationFn: (id: number) => bankService.destroy(id),
        onSuccess: (raw, id) => {
            const res = raw as ApiResponse<unknown>;
            if (!res.success) { toast.error(res.message || t("loadError")); return; }
            queryClient.setQueryData<PaginatedResponse<Bank>>(queryKey, (old) => old ? { ...old, data: (old.data ?? []).filter((row) => row.id !== id), meta: { ...old.meta, total: Math.max(0, (old.meta?.total ?? 1) - 1) } } : old);
            toast.success(res.message || t("deleteSuccess"));
        },
        onError: (error: unknown) => toast.error((error as Error)?.message || t("loadError")),
    });
    const toggleMutation = useMutation({
        mutationFn: (id: number) => bankService.toggleStatus(id) as Promise<ApiResponse<Bank>>,
        onSuccess: (res, id) => {
            if (!res.success) { toast.error(res.message || t("loadError")); return; }
            queryClient.setQueryData<PaginatedResponse<Bank>>(queryKey, (old) => old ? { ...old, data: (old.data ?? []).map((row) => row.id === id ? { ...row, ...(res.data ?? {}), is_active: res.data?.is_active ?? !row.is_active } : row) } : old);
            toast.success(res.message || t("updateStatus"));
        },
        onError: (error: unknown) => toast.error((error as Error)?.message || t("loadError")),
    });
    const submit = async (operation: () => Promise<unknown>, successKey: string): Promise<SubmitResult> => {
        try {
            const res = await operation() as ApiResponse<Bank>;
            if (!res.success) return { success: false, message: res.message, errors: res.errors };
            await queryClient.invalidateQueries({ queryKey: ["banks"] });
            toast.success(res.message || t(successKey));
            return;
        } catch (error) {
            const serverError = getServerError(error);
            if (serverError) return serverError;
            toast.error((error as Error)?.message || t("loadError"));
            return { success: false };
        }
    };
    return {
        data, total, isLoading,
        isCreating: createMutation.isPending, isUpdating: updateMutation.isPending, isDeleting: deleteMutation.isPending, togglingIds,
        handleCreate: (payload: FormData) => submit(() => createMutation.mutateAsync(payload), "saveSuccess"),
        handleEdit: (id: number, payload: FormData) => submit(() => updateMutation.mutateAsync({ id, payload }), "updateSuccess"),
        handleDeleteConfirm: (id: number) => deleteMutation.mutate(id),
        handleToggleStatus: (id: number) => {
            if (togglingIds.has(id)) return;
            setTogglingIds((previous) => new Set(previous).add(id));
            toggleMutation.mutate(id, {
                onSettled: () => setTogglingIds((previous) => {
                    const next = new Set(previous);
                    next.delete(id);
                    return next;
                }),
            });
        },
    };
}

export function useBankSelect() {
    const query = useQuery({ queryKey: ["banks-select"], queryFn: () => bankService.select() as Promise<ApiResponse<Bank[]>> });
    return { data: query.data?.data ?? [], isLoading: query.isLoading };
}
