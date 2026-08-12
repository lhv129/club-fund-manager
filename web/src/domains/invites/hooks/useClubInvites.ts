// src/domains/invites/hooks/useClubInvites.ts
"use client";

import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { getClubInviteService } from "@/domains/invites/services/ClubInviteService";
import type { PaginatedResponse } from "@/types/api";
import type { ClubInvite, InviteFilters, CreateInvitePayload } from "@/domains/invites/types/invite";

export function useClubInvites(
    params: InviteFilters & { page: number; limit: number; club_slug?: string | null }
) {
    const clubSlug = params.club_slug as string | undefined;
    const queryClient = useQueryClient();
    const t = useTranslations("common");
    const ti = useTranslations("invite");
    const service = getClubInviteService();
    const queryKey = ["club-invites", clubSlug, params] as const;

    const { data: listData, isLoading } = useQuery({
        queryKey,
        queryFn: () => service.list(params),
        enabled: !!clubSlug,
    });

    const data = listData?.data ?? [];
    const total = listData?.meta?.total ?? 0;

    // ── Create ────────────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: (payload: CreateInvitePayload) => service.create({ ...payload, club_slug: clubSlug }),
        onSuccess: (res) => {
            if (!res.success) return;
            queryClient.invalidateQueries({ queryKey: ["club-invites", clubSlug] });
            toast.success(res.message || t("createSuccess"));
        },
        onError: (error: unknown) => {
            toast.error((error as Error)?.message || t("loadError"));
        },
    });

    // ── Toggle status (is_active) ─────────────────────────────────────────────
    const toggleMutation = useMutation({
        mutationFn: (id: number) => service.toggleStatus(id, { club_slug: clubSlug }),
        onSuccess: (res, id) => {
            if (!res.success) return;
            const saved = res.data;
            queryClient.setQueryData(
                queryKey,
                (old: PaginatedResponse<ClubInvite> | undefined) => {
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

    // ── Delete ────────────────────────────────────────────────────────────────
    const deleteMutation = useMutation({
        mutationFn: (id: number) => service.destroy(id, { club_slug: clubSlug }),
        onSuccess: (res, deletedId) => {
            if (!res.success) return;
            queryClient.setQueryData(queryKey, (old: PaginatedResponse<ClubInvite> | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    data: (old.data ?? []).filter((item) => item.id !== deletedId),
                    meta: { ...old.meta, total: Math.max(0, (old.meta?.total ?? 1) - 1) },
                };
            });
            toast.success(res.message || t("deleteSuccess"));
        },
        onError: (error: unknown) => {
            toast.error((error as Error)?.message || t("loadError"));
        },
    });

    const handleCreate = (payload: CreateInvitePayload) => createMutation.mutate(payload);
    const handleToggle = (id: number) => toggleMutation.mutate(id);
    const handleDeleteConfirm = (id: number) => deleteMutation.mutate(id);

    return {
        data,
        total,
        isLoading,
        isCreating: createMutation.isPending,
        isToggling: toggleMutation.isPending,
        isDeleting: deleteMutation.isPending,
        handleCreate,
        handleToggle,
        handleDeleteConfirm,
    };
}
