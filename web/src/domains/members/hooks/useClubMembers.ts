// src/domains/club/hooks/useClubMembers.ts
"use client";

import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { getClubMemberService } from "@/domains/members/services/ClubMemberService";

import type {
    MemberFilters,
    MemberHistoryFilters,
    RejectPayload,
    BanMemberPayload,
    ClubMember,
} from "@/domains/members/types/member";

import type {
    ApiResponse,
    PaginatedResponse,
} from "@/types/api";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ClubMemberListCache =
    PaginatedResponse<ClubMember>;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function updateMemberInCache(
    queryClient: ReturnType<typeof useQueryClient>,
    queryKey: readonly unknown[],
    memberId: number,
    updater: (
        member: ClubMember
    ) => ClubMember
) {
    queryClient.setQueriesData<ClubMemberListCache>(
        {
            queryKey,
        },
        (old) => {
            if (!old) {
                return old;
            }

            return {
                ...old,

                data: (old.data ?? []).map(
                    (member) =>
                        member.id === memberId
                            ? updater(member)
                            : member
                ),
            };
        }
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Members hook
// ─────────────────────────────────────────────────────────────────────────────

export function useClubMembers(
    params: MemberFilters & {
        page: number;
        limit: number;
        club_slug?: string | null;
    },
    fixedParams?: Record<string, unknown>
) {
    /**
     * Normalize về string để không còn lỗi:
     *
     * Type 'string | undefined' is not assignable to type 'string'
     */
    const clubSlug =
        params.club_slug ?? "";

    const queryClient =
        useQueryClient();

    const t =
        useTranslations("common");

    const service =
        getClubMemberService();

    const queryKey = [
        "club-members",
        clubSlug,
        params,
        fixedParams,
    ] as const;

    const mergedParams =
        fixedParams
            ? {
                ...params,
                ...fixedParams,
            }
            : params;

    const {
        data: listData,
        isLoading,
        isFetching,
    } = useQuery<
        PaginatedResponse<ClubMember>
    >({
        queryKey,

        queryFn: () =>
            service.list(
                mergedParams
            ) as Promise<
                PaginatedResponse<ClubMember>
            >,

        placeholderData:
            keepPreviousData,

        enabled: Boolean(clubSlug),
    });

    const data =
        listData?.data ?? [];

    const total =
        listData?.meta?.total ?? 0;

    // ─────────────────────────────────────────────────────────────────────────
    // Remove
    // ─────────────────────────────────────────────────────────────────────────

    const deleteMutation =
        useMutation({
            mutationFn: async (
                id: number
            ) => {
                return service.destroy(id, {
                    club_slug:
                        clubSlug,
                });
            },

            onSuccess: (
                result,
                deletedId
            ) => {
                const response =
                    result as ApiResponse<ClubMember>;

                if (!response.success) {
                    toast.error(
                        response.message ||
                        t(
                            "updateError"
                        )
                    );

                    return;
                }

                /**
                 * Không fetch lại.
                 *
                 * Remove row trực tiếp khỏi
                 * cache hiện tại.
                 */
                queryClient.setQueriesData<ClubMemberListCache>(
                    {
                        queryKey: [
                            "club-members",
                            clubSlug,
                        ],
                    },
                    (old) => {
                        if (!old) {
                            return old;
                        }

                        return {
                            ...old,

                            data: (
                                old.data ??
                                []
                            ).filter(
                                (item) =>
                                    item.id !==
                                    deletedId
                            ),

                            meta: {
                                ...old.meta,

                                total: Math.max(
                                    0,
                                    (old.meta
                                        ?.total ??
                                        1) - 1
                                ),
                            },
                        };
                    }
                );

                toast.success(
                    response.message ||
                    t(
                        "updateSuccess"
                    )
                );
            },

            onError: (
                error: unknown
            ) => {
                toast.error(
                    (error as Error)
                        ?.message ||
                    t(
                        "loadError"
                    )
                );
            },
        });

    const handleDeleteConfirm = (
        id: number
    ) => {
        deleteMutation.mutate(id);
    };

    return {
        data,
        total,

        isLoading,
        isFetching,

        isDeleting:
            deleteMutation.isPending,

        handleDeleteConfirm,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Member History
// approve / reject / remove / ban
// ─────────────────────────────────────────────────────────────────────────────

export function useClubMemberHistory(
    params: MemberHistoryFilters & {
        page: number;
        limit: number;
        club_slug?: string | null;
    }
) {
    /**
     * Normalize string.
     *
     * Không còn:
     * Type 'string | undefined' is not assignable to type 'string'
     */
    const clubSlug =
        params.club_slug ?? "";

    const queryClient =
        useQueryClient();

    const t =
        useTranslations("common");

    const service =
        getClubMemberService();

    const queryKey = [
        "club-members-history",
        clubSlug,
        params,
    ] as const;

    // ─────────────────────────────────────────────────────────────────────────
    // Get list
    // ─────────────────────────────────────────────────────────────────────────

    const {
        data: listData,
        isLoading,
        isFetching,
    } = useQuery<
        PaginatedResponse<ClubMember>
    >({
        queryKey,

        queryFn: () =>
            service.list(
                params
            ) as Promise<
                PaginatedResponse<ClubMember>
            >,

        placeholderData:
            keepPreviousData,

        enabled: Boolean(clubSlug),
    });

    const data =
        listData?.data ?? [];

    const total =
        listData?.meta?.total ?? 0;

    // ─────────────────────────────────────────────────────────────────────────
    // Approve
    // ─────────────────────────────────────────────────────────────────────────

    const approveMutation =
        useMutation({
            mutationFn: async (
                id: number
            ) => {
                return service.approve(
                    id,
                    {
                        club_slug:
                            clubSlug,
                    }
                );
            },

            onSuccess: (
                result,
                memberId
            ) => {
                const response =
                    result as ApiResponse<ClubMember>;

                if (!response.success) {
                    toast.error(
                        response.message ||
                        t(
                            "updateError"
                        )
                    );

                    return;
                }

                /**
                 * Update history cache.
                 *
                 * Nếu backend trả data thì dùng
                 * data backend.
                 * Nếu không thì tự update status.
                 */
                updateMemberInCache(
                    queryClient,
                    [
                        "club-members-history",
                        clubSlug,
                    ],
                    memberId,
                    (member) => ({
                        ...member,

                        ...(response.data ??
                            {}),

                        status:
                            response.data
                                ?.status ??
                            "approved",

                        is_active:
                            response.data
                                ?.is_active ??
                            true,
                    })
                );

                /**
                 * Update current members cache
                 * luôn, nhưng không fetch.
                 */
                updateMemberInCache(
                    queryClient,
                    [
                        "club-members",
                        clubSlug,
                    ],
                    memberId,
                    (member) => ({
                        ...member,

                        ...(response.data ??
                            {}),

                        status:
                            response.data
                                ?.status ??
                            "approved",

                        is_active:
                            response.data
                                ?.is_active ??
                            true,
                    })
                );

                toast.success(
                    response.message ||
                    t(
                        "updateSuccess"
                    )
                );
            },

            onError: (
                error: unknown
            ) => {
                toast.error(
                    (error as Error)
                        ?.message ||
                    t(
                        "loadError"
                    )
                );
            },
        });

    // ─────────────────────────────────────────────────────────────────────────
    // Reject
    // ─────────────────────────────────────────────────────────────────────────

    const rejectMutation =
        useMutation({
            mutationFn: async ({
                id,
                payload,
            }: {
                id: number;
                payload: RejectPayload;
            }) => {
                return service.reject(
                    id,
                    {
                        ...payload,

                        club_slug:
                            clubSlug,
                    }
                );
            },

            onSuccess: (
                result,
                variables
            ) => {
                const response =
                    result as ApiResponse<ClubMember>;

                if (!response.success) {
                    toast.error(
                        response.message ||
                        t(
                            "updateError"
                        )
                    );

                    return;
                }

                const memberId =
                    variables.id;

                updateMemberInCache(
                    queryClient,
                    [
                        "club-members-history",
                        clubSlug,
                    ],
                    memberId,
                    (member) => ({
                        ...member,

                        ...(response.data ??
                            {}),

                        status:
                            response.data
                                ?.status ??
                            "rejected",

                        is_active:
                            response.data
                                ?.is_active ??
                            false,

                        rejected_reason:
                            response.data
                                ?.rejected_reason ??
                            variables.payload
                                .rejected_reason ??
                            null,
                    })
                );

                updateMemberInCache(
                    queryClient,
                    [
                        "club-members",
                        clubSlug,
                    ],
                    memberId,
                    (member) => ({
                        ...member,

                        ...(response.data ??
                            {}),

                        status:
                            response.data
                                ?.status ??
                            "rejected",

                        is_active:
                            response.data
                                ?.is_active ??
                            false,

                        rejected_reason:
                            response.data
                                ?.rejected_reason ??
                            variables.payload
                                .rejected_reason ??
                            null,
                    })
                );

                toast.success(
                    response.message ||
                    t(
                        "updateSuccess"
                    )
                );
            },

            onError: (
                error: unknown
            ) => {
                toast.error(
                    (error as Error)
                        ?.message ||
                    t(
                        "loadError"
                    )
                );
            },
        });

    // ─────────────────────────────────────────────────────────────────────────
    // Remove
    // ─────────────────────────────────────────────────────────────────────────

    const deleteMutation =
        useMutation({
            mutationFn: async (
                id: number
            ) => {
                return service.destroy(
                    id,
                    {
                        club_slug:
                            clubSlug,
                    }
                );
            },

            onSuccess: (
                result,
                memberId
            ) => {
                const response =
                    result as ApiResponse<ClubMember>;

                if (!response.success) {
                    toast.error(
                        response.message ||
                        t(
                            "updateError"
                        )
                    );

                    return;
                }

                /**
                 * History:
                 *
                 * Không remove row.
                 * Chỉ chuyển:
                 *
                 * approved -> removed
                 */
                updateMemberInCache(
                    queryClient,
                    [
                        "club-members-history",
                        clubSlug,
                    ],
                    memberId,
                    (member) => ({
                        ...member,

                        ...(response.data ??
                            {}),

                        status:
                            response.data
                                ?.status ??
                            "removed",

                        is_active:
                            response.data
                                ?.is_active ??
                            false,

                        removed_at:
                            response.data
                                ?.removed_at ??
                            new Date().toISOString(),
                    })
                );

                /**
                 * Current members:
                 *
                 * Member vừa bị remove không còn
                 * nằm trong danh sách active members.
                 */
                queryClient.setQueriesData<ClubMemberListCache>(
                    {
                        queryKey: [
                            "club-members",
                            clubSlug,
                        ],
                    },
                    (old) => {
                        if (!old) {
                            return old;
                        }

                        return {
                            ...old,

                            data: (
                                old.data ??
                                []
                            ).filter(
                                (item) =>
                                    item.id !==
                                    memberId
                            ),

                            meta: {
                                ...old.meta,

                                total: Math.max(
                                    0,
                                    (old.meta
                                        ?.total ??
                                        1) - 1
                                ),
                            },
                        };
                    }
                );

                toast.success(
                    response.message ||
                    t(
                        "updateSuccess"
                    )
                );
            },

            onError: (
                error: unknown
            ) => {
                toast.error(
                    (error as Error)
                        ?.message ||
                    t(
                        "loadError"
                    )
                );
            },
        });

    // ─────────────────────────────────────────────────────────────────────────
    // Ban
    // ─────────────────────────────────────────────────────────────────────────

    const banMutation =
        useMutation({
            mutationFn: async ({
                id,
                payload,
            }: {
                id: number;
                payload: BanMemberPayload;
            }) => {
                return service.ban(
                    id,
                    {
                        ...payload,

                        club_slug:
                            clubSlug,
                    }
                );
            },

            onSuccess: (
                result,
                variables
            ) => {
                const response =
                    result as ApiResponse<ClubMember>;

                if (!response.success) {
                    toast.error(
                        response.message ||
                        t(
                            "updateError"
                        )
                    );

                    return;
                }

                const memberId =
                    variables.id;

                updateMemberInCache(
                    queryClient,
                    [
                        "club-members-history",
                        clubSlug,
                    ],
                    memberId,
                    (member) => ({
                        ...member,

                        ...(response.data ??
                            {}),

                        status:
                            response.data
                                ?.status ??
                            "banned",

                        is_active:
                            response.data
                                ?.is_active ??
                            false,

                        banned_reason:
                            response.data
                                ?.banned_reason ??
                            variables.payload
                                .banned_reason ??
                            member.banned_reason ??
                            null,

                        banned_at:
                            response.data
                                ?.banned_at ??
                            member.banned_at ??
                            new Date().toISOString(),
                    })
                );

                /**
                 * Banned member không còn nằm
                 * trong current members.
                 */
                queryClient.setQueriesData<ClubMemberListCache>(
                    {
                        queryKey: [
                            "club-members",
                            clubSlug,
                        ],
                    },
                    (old) => {
                        if (!old) {
                            return old;
                        }

                        return {
                            ...old,

                            data: (
                                old.data ??
                                []
                            ).filter(
                                (item) =>
                                    item.id !==
                                    memberId
                            ),

                            meta: {
                                ...old.meta,

                                total: Math.max(
                                    0,
                                    (old.meta
                                        ?.total ??
                                        1) - 1
                                ),
                            },
                        };
                    }
                );

                toast.success(
                    response.message ||
                    t(
                        "updateSuccess"
                    )
                );
            },

            onError: (
                error: unknown
            ) => {
                toast.error(
                    (error as Error)
                        ?.message ||
                    t(
                        "loadError"
                    )
                );
            },
        });

    // ─────────────────────────────────────────────────────────────────────────
    // Handlers
    // ─────────────────────────────────────────────────────────────────────────

    const handleApprove = (
        id: number
    ) => {
        if (
            approveMutation.isPending
        ) {
            return;
        }

        approveMutation.mutate(id);
    };

    const handleReject = async (
        id: number,
        payload: RejectPayload
    ) => {
        await rejectMutation.mutateAsync(
            {
                id,
                payload,
            }
        );
    };

    const handleDeleteConfirm = (
        id: number
    ) => {
        if (
            deleteMutation.isPending
        ) {
            return;
        }

        deleteMutation.mutate(id);
    };

    const handleBan = async (
        id: number,
        payload: BanMemberPayload = {}
    ) => {
        if (
            banMutation.isPending
        ) {
            return;
        }

        await banMutation.mutateAsync(
            {
                id,
                payload,
            }
        );
    };

    return {
        data,
        total,

        isLoading,
        isFetching,

        // Approve
        isApproving:
            approveMutation.isPending,
        handleApprove,

        // Reject
        isRejecting:
            rejectMutation.isPending,
        handleReject,

        // Remove
        isDeleting:
            deleteMutation.isPending,
        handleDeleteConfirm,

        // Ban
        isBanning:
            banMutation.isPending,
        handleBan,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Member Select
// ─────────────────────────────────────────────────────────────────────────────

export function useClubMemberSelect(
    params?: Partial<MemberHistoryFilters> & {
        club_slug?: string | null;
    }
) {
    const clubSlug =
        params?.club_slug ?? "";

    const query = useQuery({
        queryKey: [
            "club-members-select",
            clubSlug,
            params,
        ],

        queryFn: () => {
            if (!clubSlug) {
                throw new Error(
                    "Club slug is required"
                );
            }

            return getClubMemberService().select(
                params
            );
        },

        enabled: Boolean(clubSlug),
    });

    return {
        data:
            query.data?.data ?? [],

        isLoading:
            query.isLoading,
    };
}