"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { roleService } from "@/domains/role/services/roleService";
import type { RolePermission } from "@/domains/role/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function getCheckedIds(data: RolePermission[]) {
    return data.flatMap((m) => m.actions.filter((a) => a.checked).map((a) => a.id));
}

export function normalizeIds(ids: number[]) {
    return [...ids].sort((a, b) => a - b).join(",");
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
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

    // ── Local state cho toggle ────────────────────────────────────────────────
    const [permissions, setPermissions] = useState<RolePermission[]>([]);
    const [originalPermissions, setOriginalPermissions] = useState<RolePermission[]>([]);

    // Seed khi query data về (lần đầu hoặc sau sync)
    useEffect(() => {
        const data = queryData?.data?.permissions ?? [];
        setPermissions(data);
        setOriginalPermissions(data);
    }, [queryData]);

    // ── Derived state ─────────────────────────────────────────────────────────
    const originalCheckedIds = useMemo(() => getCheckedIds(originalPermissions), [originalPermissions]);
    const currentCheckedIds = useMemo(() => getCheckedIds(permissions), [permissions]);
    const hasChanged = normalizeIds(originalCheckedIds) !== normalizeIds(currentCheckedIds);
    const roleName = queryData?.data?.translation?.name ?? slug;

    // ── Toggle handlers ───────────────────────────────────────────────────────
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

    // ── Sync mutation ─────────────────────────────────────────────────────────
    const syncMutation = useMutation({
        mutationFn: (ids: number[]) => roleService.syncPermissions(slug, ids),
        onSuccess: (res) => {
            if (!res.success) { toast.error(res.message || t("loadError")); return; }

            // Sync và GET giờ cùng shape → setQueryData trực tiếp
            // useEffect sẽ tự seed lại permissions từ res.data.permissions
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
        roleName,
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