// src/domains/invites/hooks/useClubInvites.ts
"use client";

import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { getClubInviteService } from "@/domains/invites/services/ClubInviteService";

import type {
    CreateInvitePayload,
    ClubInvite,
    InviteFilters,
} from "@/domains/invites/types/invite";

import type { PaginatedResponse } from "@/types/api";

export function useClubInvites(
    params: InviteFilters & {
        page: number;
        limit: number;
        club_slug?: string | null;
    },
) {
    const clubSlug =
        params.club_slug as string | undefined;

    const queryClient = useQueryClient();

    const t = useTranslations("common");

    const service = getClubInviteService();

    const queryKey = [
        "club-invites",
        clubSlug,
        params,
    ] as const;

    const {
        data: listData,
        isLoading,
        isFetching,
    } = useQuery({
        queryKey,

        queryFn: () => {
            return service.list(params);
        },

        enabled: !!clubSlug,

        placeholderData: keepPreviousData,
    });

    const data = listData?.data ?? [];

    const total =
        listData?.meta?.total ?? 0;

    // Create
    const createMutation = useMutation({
        mutationFn: (
            payload: CreateInvitePayload,
        ) => {
            return service.create({
                ...payload,
                club_slug: clubSlug,
            });
        },

        onSuccess: (response) => {
            if (!response.success) {
                return;
            }

            queryClient.invalidateQueries({
                queryKey: [
                    "club-invites",
                    clubSlug,
                ],
            });

            toast.success(
                response.message ||
                t("createSuccess"),
            );
        },

        onError: (error: unknown) => {
            toast.error(
                (error as Error)?.message ||
                t("loadError"),
            );
        },
    });

    // Toggle status
    const toggleMutation = useMutation({
        mutationFn: (id: number) => {
            return service.toggleStatus(id, {
                club_slug: clubSlug,
            });
        },

        onSuccess: (response, id) => {
            if (!response.success) {
                return;
            }

            const saved = response.data;

            queryClient.setQueryData(
                queryKey,
                (
                    old:
                        | PaginatedResponse<ClubInvite>
                        | undefined,
                ) => {
                    if (!old) {
                        return old;
                    }

                    return {
                        ...old,

                        data: (
                            old.data ?? []
                        ).map((item) => {
                            if (item.id !== id) {
                                return item;
                            }

                            return saved
                                ? {
                                    ...item,
                                    ...saved,
                                }
                                : {
                                    ...item,
                                    is_active:
                                        !item.is_active,
                                };
                        }),
                    };
                },
            );
        },

        onError: (error: unknown) => {
            toast.error(
                (error as Error)?.message ||
                t("loadError"),
            );
        },
    });

    // Delete
    const deleteMutation = useMutation({
        mutationFn: (id: number) => {
            return service.destroy(id, {
                club_slug: clubSlug,
            });
        },

        onSuccess: (
            response,
            deletedId,
        ) => {
            if (!response.success) {
                return;
            }

            queryClient.setQueryData(
                queryKey,
                (
                    old:
                        | PaginatedResponse<ClubInvite>
                        | undefined,
                ) => {
                    if (!old) {
                        return old;
                    }

                    return {
                        ...old,

                        data: (
                            old.data ?? []
                        ).filter(
                            (item) =>
                                item.id !==
                                deletedId,
                        ),

                        meta: {
                            ...old.meta,

                            total: Math.max(
                                0,
                                (
                                    old.meta
                                        ?.total ?? 1
                                ) - 1,
                            ),
                        },
                    };
                },
            );

            toast.success(
                response.message ||
                t("deleteSuccess"),
            );
        },

        onError: (error: unknown) => {
            toast.error(
                (error as Error)?.message ||
                t("loadError"),
            );
        },
    });

    const handleCreate = (
        payload: CreateInvitePayload,
    ) => {
        createMutation.mutate(payload);
    };

    const handleToggle = (id: number) => {
        toggleMutation.mutate(id);
    };

    const handleDeleteConfirm = (
        id: number,
    ) => {
        deleteMutation.mutate(id);
    };

    return {
        data,
        total,

        // Skeleton lần đầu
        isLoading,

        // Loading khi đổi filter, sort, page
        isFetching,

        isCreating:
            createMutation.isPending,

        isToggling:
            toggleMutation.isPending,

        isDeleting:
            deleteMutation.isPending,

        handleCreate,
        handleToggle,
        handleDeleteConfirm,
    };
}