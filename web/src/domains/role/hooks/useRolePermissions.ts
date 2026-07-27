// ══════════════════════════════════════════════════════════════════
// 1. @/domains/role/hooks/useRolePermissions.ts
// ══════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { roleService } from "@/domains/role/services/roleService";
import type { RolePermission } from "@/domains/role/types";

// ─── Helpers (dùng cả trong hook lẫn page) ───────────────────────────────────
export function getCheckedIds(data: RolePermission[]) {
    return data.flatMap((m) => m.actions.filter((a) => a.checked).map((a) => a.id));
}

export function normalizeIds(ids: number[]) {
    return [...ids].sort((a, b) => a - b).join(",");
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * Cache strategy:
 *   - fetch     → useQuery (cache by slug)
 *   - toggle    → setPermissions local only (KHÔNG gọi API mỗi click)
 *   - sync save → useMutation → setQueryData + reset local state
 */
export function useRolePermissions(slug: string) {
    const queryClient = useQueryClient();
    const t = useTranslations("common");

    const queryKey = ["role-permissions", slug] as const;

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const { data: queryData, isLoading } = useQuery({
        queryKey,
        queryFn: async () => {
            const res = await roleService.getPermissionsBySlug(slug);
            if (!res.success) throw new Error(res.message || t("loadError"));
            return res;
        },
    });

    // ── Local state cho toggle (không qua API mỗi click) ─────────────────────
    const [permissions, setPermissions] = useState<RolePermission[]>([]);
    const [originalPermissions, setOriginalPermissions] = useState<RolePermission[]>([]);

    // Seed khi query data về lần đầu (hoặc refetch)
    useEffect(() => {
        const data = Array.isArray(queryData?.data) ? queryData.data : [];
        setPermissions(data);
        setOriginalPermissions(data);
    }, [queryData]);

    // ── Derived state ─────────────────────────────────────────────────────────
    const originalCheckedIds = useMemo(() => getCheckedIds(originalPermissions), [originalPermissions]);
    const currentCheckedIds = useMemo(() => getCheckedIds(permissions), [permissions]);
    const hasChanged = normalizeIds(originalCheckedIds) !== normalizeIds(currentCheckedIds);

    // ── Toggle handlers (local state only — KHÔNG gọi API) ───────────────────
    const togglePermission = (permissionId: number) =>
        setPermissions((prev) =>
            prev.map((m) => ({
                ...m,
                actions: m.actions.map((a) =>
                    a.id === permissionId ? { ...a, checked: !a.checked } : a
                ),
            }))
        );

    const toggleModule = (moduleName: string, checked: boolean) =>
        setPermissions((prev) =>
            prev.map((m) =>
                m.module === moduleName
                    ? { ...m, actions: m.actions.map((a) => ({ ...a, checked })) }
                    : m
            )
        );

    const toggleGroup = (moduleName: string, names: string[], checked: boolean) =>
        setPermissions((prev) =>
            prev.map((m) =>
                m.module === moduleName
                    ? { ...m, actions: m.actions.map((a) => (names.includes(a.name) ? { ...a, checked } : a)) }
                    : m
            )
        );

    const handleSelectAll = () => setPermissions((prev) => prev.map((m) => ({ ...m, actions: m.actions.map((a) => ({ ...a, checked: true })) })));
    const handleDeselectAll = () => setPermissions((prev) => prev.map((m) => ({ ...m, actions: m.actions.map((a) => ({ ...a, checked: false })) })));
    const handleReset = () => setPermissions(originalPermissions);

    // ── Sync mutation — gọi API một lần khi Save ─────────────────────────────
    const syncMutation = useMutation({
        mutationFn: (ids: number[]) => roleService.syncPermissions(slug, ids),
        onSuccess: (res) => {
            if (!res.success) { toast.error(res.message || t("loadError")); return; }
            const data = Array.isArray(res.data) ? res.data : [];
            // Cập nhật local state + cache
            setPermissions(data);
            setOriginalPermissions(data);
            queryClient.setQueryData(queryKey, res);
            toast.success(res.message || t("saveSuccess"));
        },
        onError: (error: unknown) => {
            toast.error((error as Error)?.message || t("loadError"));
        },
    });

    const handleSync = () => syncMutation.mutate(currentCheckedIds);

    // ── Return ────────────────────────────────────────────────────────────────
    return {
        permissions,
        isLoading,
        isSyncing: syncMutation.isPending,
        hasChanged,
        currentCheckedIds,
        togglePermission,
        toggleModule,
        toggleGroup,
        handleSelectAll,
        handleDeselectAll,
        handleReset,
        handleSync,
    };
}