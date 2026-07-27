// ══════════════════════════════════════════════════════════════════
// 2. @/domains/club/hooks/useClubs.ts
// ══════════════════════════════════════════════════════════════════
"use client";

import { useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { clubServiceClient } from "@/domains/club/services/clubService";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { Club, ClubFilters } from "@/domains/club/types";
import type { SubmitResult } from "@/components/shared/forms/FormModalWithMedia";
import type { useListParams } from "@/hooks/useListParams";

// ─── Private helper ───────────────────────────────────────────────────────────
function getServerError(err: unknown) {
    return (err as { response?: { data?: unknown } })?.response?.data ?? null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * Cache strategy:
 *   - list          → useQuery
 *   - create/update → invalidateQueries (fetch lại để đảm bảo đúng)
 *   - delete        → setQueryData với data + meta trả về từ BE
 *   - toggle        → setQueryData (flip is_active hoặc merge res.data)
 */
export function useClubsQuery(
    params: ReturnType<typeof useListParams<ClubFilters>>["params"]
) {
    const queryClient = useQueryClient();
    const t = useTranslations("common");

    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

    const queryKey = ["clubs", params] as const;

    // ── Fetch list ────────────────────────────────────────────────────────────
    const { data: listData, isLoading } = useQuery({
        queryKey,
        queryFn: () => clubServiceClient.list(params),
    });

    const data = listData?.data ?? [];
    const total = listData?.meta?.total ?? 0;

    // ── Create → invalidateQueries ────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: (payload: FormData) => clubServiceClient.create(payload),
    });

    // ── Update → invalidateQueries ────────────────────────────────────────────
    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FormData }) =>
            clubServiceClient.update(id, payload),
    });

    // ── Delete → setQueryData với data + meta trả về từ BE ───────────────────
    const deleteMutation = useMutation({
        mutationFn: (id: number) => clubServiceClient.destroy(id, params),
        onSuccess: (res) => {
            queryClient.setQueryData(
                queryKey,
                (old: PaginatedResponse<Club> | undefined) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: res.data ?? old.data,
                        meta: { ...old.meta, total: res.meta?.total ?? old.meta?.total },
                    };
                }
            );
            toast.success(res.message || t("deleteSuccess"));
        },
        onError: (error: unknown) => {
            toast.error((error as Error)?.message || t("loadError"));
        },
    });

    // ── Toggle → setQueryData ─────────────────────────────────────────────────
    const toggleMutation = useMutation({
        mutationFn: (id: number) =>
            clubServiceClient.toggleStatus(id) as Promise<ApiResponse<Club>>,
        onSuccess: (res, id) => {
            if (!res.success) return;
            const saved = res.data;
            queryClient.setQueryData(
                queryKey,
                (old: PaginatedResponse<Club> | undefined) => {
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
        },
        onError: (error: unknown) => {
            toast.error((error as Error)?.message || t("loadError"));
        },
    });

    // ── Handlers ──────────────────────────────────────────────────────────────

    // FormModalWithMedia tự build FormData → hook chỉ cần nhận và gửi
    const handleCreate = async (formData: FormData): Promise<SubmitResult> => {
        try {
            const raw = await createMutation.mutateAsync(formData);
            const res = raw as unknown as ApiResponse<Club>;
            if (!res.success) return { success: false, message: res.message, errors: res.errors };
            queryClient.invalidateQueries({ queryKey: ["clubs"] });
            toast.success(res.message || t("saveSuccess"));
            return;
        } catch (error: unknown) {
            const serverErr = getServerError(error);
            if (serverErr) return serverErr as SubmitResult;
            toast.error((error as Error)?.message || t("loadError"));
            return { success: false };
        }
    };

    const handleEdit = async (id: number, formData: FormData): Promise<SubmitResult> => {
        try {
            const raw = await updateMutation.mutateAsync({ id, payload: formData });
            const res = raw as unknown as ApiResponse<Club>;
            if (!res.success) return { success: false, message: res.message, errors: res.errors };
            queryClient.invalidateQueries({ queryKey: ["clubs"] });
            toast.success(res.message || t("updateSuccess"));
            return;
        } catch (error: unknown) {
            const serverErr = getServerError(error);
            if (serverErr) return serverErr as SubmitResult;
            toast.error((error as Error)?.message || t("loadError"));
            return { success: false };
        }
    };

    const handleDeleteConfirm = (id: number) => deleteMutation.mutate(id);

    const handleToggle = (row: Club) => {
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

    // ── Return ────────────────────────────────────────────────────────────────
    return {
        data,
        total,
        isLoading,
        togglingIds,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        handleCreate,
        handleEdit,
        handleDeleteConfirm,
        handleToggle,
    };
}