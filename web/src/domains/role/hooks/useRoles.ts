// @/domains/role/hooks/useRoles.ts
"use client";

import { useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { roleService } from "@/domains/role/services/roleService";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { Role, RoleFilters, RoleTranslation } from "@/domains/role/types";
import type {
    SubmitResult,
    ServerErrorResponse,
    TranslationEntry
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
    formData.append("slug", values.slug ?? "");
    formData.append("sort_order", values.sort_order ?? "0");
    formData.append(
        "is_active",
        values.is_active === "1" || values.is_active === "true" ? "1" : "0"
    );
    (translations ?? []).forEach((entry) => {
        formData.append(`translations[${entry.locale}][locale]`, entry.locale);
        formData.append(`translations[${entry.locale}][name]`, entry.name ?? "");
        formData.append(`translations[${entry.locale}][description]`, entry.description ?? "");
    });
    return formData;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Custom hook quản lý data fetching + cache strategy cho role.
 *
 * Chiến lược cache:
 *   - list          → useQuery (auto re-fetch khi params thay đổi)
 *   - create/update → invalidateQueries (fetch lại để đảm bảo đúng)
 *   - delete        → setQueryData với data trả về từ BE (không fetch thêm)
 *   - toggle        → setQueryData (flip is_active, không fetch lại)
 */
export function useRoles(
    params: ReturnType<typeof useListParams<RoleFilters>>["params"]
) {
    const queryClient = useQueryClient();
    const t = useTranslations("common");

    // Track nhiều toggle đồng thời không chặn nhau
    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

    // Mỗi bộ filter/page/sort là một cache entry riêng
    const queryKey = ["roles", params] as const;

    // ── Fetch list ────────────────────────────────────────────────────────────
    const { data: listData, isLoading } = useQuery({
        queryKey,
        queryFn: () => roleService.list(params),
    });

    const data = listData?.data ?? [];
    const total = listData?.meta?.total ?? 0;

    // ── Create → invalidateQueries ────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: (payload: FormData) => roleService.create(payload),
    });

    // ── Update → invalidateQueries ────────────────────────────────────────────
    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FormData }) =>
            roleService.update(id, payload),
    });

    // ── Delete → setQueryData với data trả về từ BE ───────────────────────────
    // roleService.destroy trả về list mới kèm meta → dùng thẳng, không fetch lại
    const deleteMutation = useMutation({
        mutationFn: (id: number) => roleService.destroy(id, params),
        onSuccess: (res) => {
            queryClient.setQueryData(
                queryKey,
                (old: PaginatedResponse<Role> | undefined) => {
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

    // ── Toggle → setQueryData (flip is_active) ────────────────────────────────
    const toggleMutation = useMutation({
        mutationFn: (id: number) =>
            roleService.toggleStatus(id) as Promise<ApiResponse<Role>>,

        onSuccess: (res, id) => {
            if (!res.success) {
                toast.error(res.message || t("loadError"));
                return;
            }

            const saved = res.data;

            queryClient.setQueryData(
                queryKey,
                (old: PaginatedResponse<Role> | undefined) => {
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

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleCreate = async (
        values: Record<string, string>,
        translations?: { locale: string; name?: string; description?: string }[]
    ): Promise<SubmitResult> => {
        try {
            const raw = await createMutation.mutateAsync(
                buildPayload(values, translations)
            );
            const res = raw as unknown as ApiResponse<Role>;
            if (!res.success) {
                return { success: false, message: res.message, errors: res.errors };
            }
            queryClient.invalidateQueries({ queryKey: ["roles"] });
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
        values: Record<string, string>,
        translations?: { locale: string; name?: string; description?: string }[]
    ): Promise<SubmitResult> => {
        try {
            const raw = await updateMutation.mutateAsync({
                id,
                payload: buildPayload(values, translations),
            });
            const res = raw as unknown as ApiResponse<Role>;
            if (!res.success) {
                return { success: false, message: res.message, errors: res.errors };
            }
            queryClient.invalidateQueries({ queryKey: ["roles"] });
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

    /** toggle → setQueryData (xử lý trong onSuccess của mutation) */
    const handleToggleStatus = (row: Role) => {
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
        handleToggleStatus,
    };
}