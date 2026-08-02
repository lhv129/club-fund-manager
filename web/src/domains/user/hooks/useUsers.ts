// @/domains/user/hooks/useUsers.ts
"use client";

import { useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { userServiceClient } from "@/domains/user/services/userService";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { User, UserFilters } from "@/domains/user/types";
import type {
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

function buildFormData(values: Record<string, string>): FormData {
    const formData = new FormData();
    Object.entries(values).forEach(([k, v]) => {
        if (v !== "") formData.append(k, v);
    });
    return formData;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Custom hook quản lý data fetching + cache strategy cho user.
 *
 * Chiến lược cache:
 *   - list           → useQuery (auto re-fetch khi params thay đổi)
 *   - create/update  → invalidateQueries (fetch lại để đảm bảo đúng)
 *   - updateStatus   → setQueryData (cập nhật item tại chỗ, không fetch lại)
 *   - delete         → setQueryData với data trả về từ BE (không fetch lại)
 */
export function useUsers(
    params: ReturnType<typeof useListParams<UserFilters>>["params"]
) {
    const queryClient = useQueryClient();
    const t = useTranslations("common");

    // Track nhiều updateStatus đồng thời không chặn nhau
    const [updatingStatusIds, setUpdatingStatusIds] = useState<Set<number>>(new Set());

    const queryKey = ["users", params] as const;

    // ── Fetch list ────────────────────────────────────────────────────────────
    const { data: listData, isLoading } = useQuery({
        queryKey,
        queryFn: () => userServiceClient.list(params),
    });

    const data = listData?.data ?? [];
    const total = listData?.meta?.total ?? 0;

    // ── Create → invalidateQueries ────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: (payload: FormData) => userServiceClient.create(payload),
    });

    // ── Update → invalidateQueries ────────────────────────────────────────────
    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FormData }) =>
            userServiceClient.update(id, payload),
    });

    // ── Delete → setQueryData với data trả về từ BE ───────────────────────────
    const deleteMutation = useMutation({
        mutationFn: (id: number) => userServiceClient.destroy(id, params),
        onSuccess: (res) => {
            queryClient.setQueryData(
                queryKey,
                (old: PaginatedResponse<User> | undefined) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: res.data ?? old.data,
                        meta: {
                            ...old.meta,
                            total: res.meta?.total ?? old.meta?.total,
                        },
                    };
                }
            );
            toast.success(res.message || t("deleteSuccess"));
        },
        onError: (error: unknown) => {
            toast.error((error as Error)?.message || t("loadError"));
        },
    });

    // ── updateStatus → setQueryData (cập nhật item tại chỗ) ──────────────────
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            (userServiceClient as any).updateStatus(id, status) as Promise<ApiResponse<User>>,
        onSuccess: (res, { id }) => {
            if (!res.success || !res.data) return;
            queryClient.setQueryData(
                queryKey,
                (old: PaginatedResponse<User> | undefined) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: (old.data ?? []).map((item) =>
                            item.id === id ? { ...item, ...res.data! } : item
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

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleCreate = async (
        values: Record<string, string>
    ): Promise<SubmitResult> => {
        try {
            const raw = await createMutation.mutateAsync(buildFormData(values));
            const res = raw as unknown as ApiResponse<User>;
            if (!res.success) {
                return { success: false, message: res.message, errors: res.errors };
            }
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success(res.message || t("saveSuccess"));
            return;
        } catch (error: unknown) {
            const serverErr = getServerError(error);
            if (serverErr) return serverErr;
            toast.error((error as Error)?.message || t("loadError"));
            return { success: false };
        }
    };

    const handleEdit = async (
        id: number,
        values: Record<string, string>
    ): Promise<SubmitResult> => {
        try {
            const raw = await updateMutation.mutateAsync({
                id,
                payload: buildFormData(values),
            });
            const res = raw as unknown as ApiResponse<User>;
            if (!res.success) {
                return { success: false, message: res.message, errors: res.errors };
            }
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success(res.message || t("updateSuccess"));
            return;
        } catch (error: unknown) {
            const serverErr = getServerError(error);
            if (serverErr) return serverErr;
            toast.error((error as Error)?.message || t("loadError"));
            return { success: false };
        }
    };

    /** delete → setQueryData (xử lý trong onSuccess của mutation) */
    const handleDeleteConfirm = (id: number) => {
        deleteMutation.mutate(id);
    };

    /** updateStatus → setQueryData (track loading per-row bằng updatingStatusIds) */
    const handleStatusChange = (row: User, newStatus: string) => {
        if (updatingStatusIds.has(row.id)) return;
        setUpdatingStatusIds((prev) => new Set(prev).add(row.id));
        updateStatusMutation.mutate(
            { id: row.id, status: newStatus },
            {
                onSettled: () =>
                    setUpdatingStatusIds((prev) => {
                        const next = new Set(prev);
                        next.delete(row.id);
                        return next;
                    }),
            }
        );
    };

    // ── Return ────────────────────────────────────────────────────────────────
    return {
        data,
        total,
        isLoading,
        updatingStatusIds,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        handleCreate,
        handleEdit,
        handleDeleteConfirm,
        handleStatusChange,
    };
}