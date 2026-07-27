"use client";

import { useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { moduleService } from "@/domains/module/services/moduleService";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { Module, ModuleFilters } from "@/domains/module/types";
import type {
    TranslationEntry,
    SubmitResult,
    ServerErrorResponse,
} from "@/components/shared/forms/FormModal";

// ─── Private helpers (không export ra ngoài) ──────────────────────────────────

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
    formData.append("sort_order", values.sort_order ?? "1");
    formData.append(
        "is_active",
        values.is_active === "1" || values.is_active === "true" ? "1" : "0"
    );
    if (values.action_view === "1" || values.action_view === "true")
        formData.append("actions[]", "view");
    if (values.action_create === "1" || values.action_create === "true")
        formData.append("actions[]", "create");
    if (values.action_update === "1" || values.action_update === "true")
        formData.append("actions[]", "update");
    if (values.action_delete === "1" || values.action_delete === "true")
        formData.append("actions[]", "delete");
    (translations ?? []).forEach((entry) => {
        formData.append(`translations[${entry.locale}][locale]`, entry.locale);
        formData.append(`translations[${entry.locale}][name]`, entry.name ?? "");
        formData.append(
            `translations[${entry.locale}][description]`,
            entry.description ?? ""
        );
    });
    return formData;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Custom hook quản lý toàn bộ data fetching + cache strategy cho module.
 *
 * Chiến lược cache:
 *   - list          → useQuery (auto re-fetch khi params thay đổi)
 *   - create/update → invalidateQueries (fetch lại để đảm bảo dữ liệu chính xác)
 *   - delete        → setQueryData    (filter item ra, không fetch lại)
 *   - toggle        → setQueryData    (flip is_active, không fetch lại)
 */
export function useModules(params: ReturnType<typeof import("@/hooks/useListParams").useListParams<ModuleFilters>>["params"]) {
    const queryClient = useQueryClient();
    const t = useTranslations("common");

    // Set để track nhiều toggle đồng thời không chặn nhau
    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

    // Query key: [resource, params] — mỗi bộ filter/page/sort là cache riêng
    const queryKey = ["modules", params] as const;

    // ── Fetch list ────────────────────────────────────────────────────────────
    const { data: listData, isLoading } = useQuery({
        queryKey,
        queryFn: () => moduleService.list(params),
    });

    const data = listData?.data ?? [];
    const total = listData?.meta?.total ?? 0;

    // ── Create → invalidateQueries (fetch lại) ────────────────────────────────
    const createMutation = useMutation({
        mutationFn: (payload: FormData) => moduleService.create(payload),
    });

    // ── Update → invalidateQueries (fetch lại) ────────────────────────────────
    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FormData }) =>
            moduleService.update(id, payload),
    });

    // ── Delete → setQueryData (cập nhật state, không fetch lại) ──────────────
    // BE trả { success, message, data: [] } — không dùng được response làm list mới
    const deleteMutation = useMutation({
        mutationFn: (id: number) => moduleService.destroy(id),
        onSuccess: (_, deletedId) => {
            queryClient.setQueryData(
                queryKey,
                (old: PaginatedResponse<Module> | undefined) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: (old.data ?? []).filter(
                            (item) => item.module_id !== deletedId
                        ),
                        meta: {
                            ...old.meta,
                            total: Math.max(0, (old.meta?.total ?? 1) - 1),
                        },
                    };
                }
            );
            toast.success(t("deleteSuccess"));
        },
        onError: (error: unknown) => {
            toast.error((error as Error)?.message || t("loadError"));
        },
    });

    // ── Toggle → setQueryData (cập nhật state, không fetch lại) ──────────────
    const toggleMutation = useMutation({
        mutationFn: (id: number) =>
            moduleService.toggleStatus(id) as Promise<ApiResponse<Module>>,
        onSuccess: (res, id) => {
            if (!res.success) return;
            const saved = res.data;
            queryClient.setQueryData(
                queryKey,
                (old: PaginatedResponse<Module> | undefined) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: (old.data ?? []).map((item) =>
                            item.module_id !== id
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

    // ── Handlers (logic xử lý response + toast) ───────────────────────────────

    /** create → invalidate sau khi thành công */
    const handleCreate = async (
        values: Record<string, string>,
        translations?: TranslationEntry[]
    ): Promise<SubmitResult> => {
        try {
            const raw = await createMutation.mutateAsync(
                buildPayload(values, translations)
            );
            const res = raw as ApiResponse<Module>;
            if (!res.success) {
                return { success: false, message: res.message, errors: res.errors };
            }
            queryClient.invalidateQueries({ queryKey: ["modules"] });
            toast.success(res.message || t("saveSuccess"));
            return;
        } catch (error: unknown) {
            const serverErr = getServerError(error);
            if (serverErr) return serverErr;
            toast.error((error as Error)?.message || t("loadError"));
            return { success: false };
        }
    };

    /** update → invalidate sau khi thành công */
    const handleEdit = async (
        id: number,
        values: Record<string, string>,
        translations?: TranslationEntry[]
    ): Promise<SubmitResult> => {
        try {
            const raw = await updateMutation.mutateAsync({
                id,
                payload: buildPayload(values, translations),
            });
            const res = raw as ApiResponse<Module>;
            if (!res.success) {
                return { success: false, message: res.message, errors: res.errors };
            }
            queryClient.invalidateQueries({ queryKey: ["modules"] });
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
    const handleToggleStatus = (row: Module) => {
        if (togglingIds.has(row.module_id)) return;
        setTogglingIds((prev) => new Set(prev).add(row.module_id));
        toggleMutation.mutate(row.module_id, {
            onSettled: () =>
                setTogglingIds((prev) => {
                    const next = new Set(prev);
                    next.delete(row.module_id);
                    return next;
                }),
        });
    };

    // ── Return ────────────────────────────────────────────────────────────────
    return {
        // Data
        data,
        total,
        isLoading,
        togglingIds,
        // Pending states (dùng cho loading indicator trên button/modal)
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        // Handlers
        handleCreate,
        handleEdit,
        handleDeleteConfirm,
        handleToggleStatus,
    };
}
