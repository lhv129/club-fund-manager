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
import { clubMemberRoleService } from "@/domains/clubMemberRole/services/clubMemberRoleService";

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

type ClubMemberListCache = PaginatedResponse<ClubMember>;

function updateMemberInCache(
    queryClient: ReturnType<typeof useQueryClient>,
    queryKey: readonly unknown[],
    memberId: number,
    updater: (member: ClubMember) => ClubMember,
    matchUserId = false
) {
    queryClient.setQueriesData<ClubMemberListCache>(
        { queryKey },
        (old) => {
            if (!old) return old;

            return {
                ...old,
                data: (old.data ?? []).map((member) =>
                    (matchUserId ? member.user.id : member.id) === memberId
                        ? updater(member)
                        : member
                ),
            };
        }
    );
}

export function useClubMembers(
    params: MemberFilters & {
        page: number;
        limit: number;
        club_slug?: string | null;
    },
    fixedParams?: Record<string, unknown>
) {
    const clubSlug = params.club_slug ?? "";
    const queryClient = useQueryClient();
    const t = useTranslations("common");
    const service = getClubMemberService();

    const queryKey = [
        "club-members",
        clubSlug,
        params,
        fixedParams,
    ] as const;

    const mergedParams = fixedParams
        ? { ...params, ...fixedParams }
        : params;

    const {
        data: listData,
        isLoading,
        isFetching,
    } = useQuery<PaginatedResponse<ClubMember>>({
        queryKey,
        queryFn: () =>
            service.list(mergedParams) as Promise<
                PaginatedResponse<ClubMember>
            >,
        placeholderData: keepPreviousData,
        enabled: Boolean(clubSlug),
    });

    const data = listData?.data ?? [];
    const total = listData?.meta?.total ?? 0;

    const deleteMutation = useMutation({
        mutationFn: async (id: number) =>
            service.destroy(id, { club_slug: clubSlug }),

        onSuccess: (result, deletedId) => {
            const response = result as ApiResponse<ClubMember>;

            if (!response.success) {
                toast.error(response.message || t("updateError"));
                return;
            }

            queryClient.setQueriesData<ClubMemberListCache>(
                { queryKey: ["club-members", clubSlug] },
                (old) => {
                    if (!old) return old;

                    return {
                        ...old,
                        data: (old.data ?? []).filter(
                            (item) => item.id !== deletedId
                        ),
                        meta: {
                            ...old.meta,
                            total: Math.max(
                                0,
                                (old.meta?.total ?? 1) - 1
                            ),
                        },
                    };
                }
            );

            toast.success(response.message || t("updateSuccess"));
        },

        onError: (error: unknown) => {
            toast.error(
                (error as Error)?.message || t("loadError")
            );
        },
    });

    const handleDeleteConfirm = (id: number) => {
        deleteMutation.mutate(id);
    };

    return {
        data,
        total,
        isLoading,
        isFetching,
        isDeleting: deleteMutation.isPending,
        handleDeleteConfirm,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Club member role sync
// ─────────────────────────────────────────────────────────────────────────────

type SyncClubMemberRolePayload = {
    user_id: number;
    role_slug: string;
    club_slug: string;
};

type SyncClubMemberRoleResponse = {
    success: boolean;
    message?: string;
    data?: {
        id: number;
        club_id: number;
        user_id: number;
        role?: ClubMember["role"];
        is_active?: boolean;
        sort_order?: number;
    };
};

function getClubRoleMutationErrorMessage(
    error: unknown,
    fallback: string
): string {
    const responseData = (
        error as {
            response?: {
                data?: {
                    message?: string;
                };
            };
        }
    )?.response?.data;

    if (responseData?.message) {
        return responseData.message;
    }

    if (error && typeof error === "object" && "message" in error) {
        const message = (error as { message?: unknown }).message;

        if (typeof message === "string" && message) {
            return message;
        }
    }

    return fallback;
}

/**
 * Cập nhật role trong club context.
 * Sau khi API thành công, cập nhật cache trực tiếp, không refetch.
 */
export function useSyncClubMemberRole(clubSlug?: string | null) {
    const normalizedClubSlug = clubSlug ?? "";
    const queryClient = useQueryClient();
    const t = useTranslations("common");

    const mutation = useMutation({
        mutationFn: (payload: SyncClubMemberRolePayload) =>
            clubMemberRoleService.syncMemberRole(
                payload as unknown as Parameters<
                    typeof clubMemberRoleService.syncMemberRole
                >[0]
            ),
    });

    const handleSyncClubMemberRole = async (
        userId: number,
        roleSlug: string,
        selectedRole: NonNullable<ClubMember["role"]>
    ): Promise<boolean> => {
        if (!normalizedClubSlug) {
            toast.error("Không tìm thấy club_slug của câu lạc bộ.");
            return false;
        }

        try {
            const payload: SyncClubMemberRolePayload = {
                user_id: userId,
                role_slug: roleSlug,
                club_slug: normalizedClubSlug,
            };

            const response =
                (await mutation.mutateAsync(
                    payload
                )) as SyncClubMemberRoleResponse;

            if (!response.success) {
                toast.error(response.message || t("loadError"));
                return false;
            }

            // Ưu tiên role từ API vì chứa translation.name chính xác.
            const syncedRole =
                response.data?.role ?? selectedRole;

            updateMemberInCache(
                queryClient,
                ["club-members", normalizedClubSlug],
                userId,
                (member) => ({
                    ...member,
                    role: syncedRole,
                }),
                true
            );

            updateMemberInCache(
                queryClient,
                ["club-members-history", normalizedClubSlug],
                userId,
                (member) => ({
                    ...member,
                    role: syncedRole,
                }),
                true
            );

            toast.success(response.message || t("saveSuccess"));
            return true;
        } catch (error: unknown) {
            toast.error(
                getClubRoleMutationErrorMessage(error, t("loadError"))
            );
            return false;
        }
    };

    return {
        handleSyncClubMemberRole,
        isSyncing: mutation.isPending,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Member History: approve / reject / remove / ban
// ─────────────────────────────────────────────────────────────────────────────

export function useClubMemberHistory(
    params: MemberHistoryFilters & {
        page: number;
        limit: number;
        club_slug?: string | null;
    }
) {
    const clubSlug = params.club_slug ?? "";
    const queryClient = useQueryClient();
    const t = useTranslations("common");
    const service = getClubMemberService();

    const queryKey = [
        "club-members-history",
        clubSlug,
        params,
    ] as const;

    const {
        data: listData,
        isLoading,
        isFetching,
    } = useQuery<PaginatedResponse<ClubMember>>({
        queryKey,
        queryFn: () =>
            service.list(params) as Promise<
                PaginatedResponse<ClubMember>
            >,
        placeholderData: keepPreviousData,
        enabled: Boolean(clubSlug),
    });

    const data = listData?.data ?? [];
    const total = listData?.meta?.total ?? 0;

    const approveMutation = useMutation({
        mutationFn: async (id: number) =>
            service.approve(id, { club_slug: clubSlug }),

        onSuccess: (result, memberId) => {
            const response = result as ApiResponse<ClubMember>;

            if (!response.success) {
                toast.error(response.message || t("updateError"));
                return;
            }

            const updatedMember = (member: ClubMember): ClubMember => ({
                ...member,
                ...(response.data ?? {}),
                status: response.data?.status ?? "approved",
                is_active: response.data?.is_active ?? true,
            });

            updateMemberInCache(
                queryClient,
                ["club-members-history", clubSlug],
                memberId,
                updatedMember
            );

            updateMemberInCache(
                queryClient,
                ["club-members", clubSlug],
                memberId,
                updatedMember
            );

            toast.success(response.message || t("updateSuccess"));
        },

        onError: (error: unknown) => {
            toast.error(
                (error as Error)?.message || t("loadError")
            );
        },
    });

    const rejectMutation = useMutation({
        mutationFn: async ({
            id,
            payload,
        }: {
            id: number;
            payload: RejectPayload;
        }) =>
            service.reject(id, {
                ...payload,
                club_slug: clubSlug,
            }),

        onSuccess: (result, variables) => {
            const response = result as ApiResponse<ClubMember>;

            if (!response.success) {
                toast.error(response.message || t("updateError"));
                return;
            }

            const memberId = variables.id;

            const updatedMember = (member: ClubMember): ClubMember => ({
                ...member,
                ...(response.data ?? {}),
                status: response.data?.status ?? "rejected",
                is_active: response.data?.is_active ?? false,
                rejected_reason:
                    response.data?.rejected_reason ??
                    variables.payload.rejected_reason ??
                    null,
            });

            updateMemberInCache(
                queryClient,
                ["club-members-history", clubSlug],
                memberId,
                updatedMember
            );

            updateMemberInCache(
                queryClient,
                ["club-members", clubSlug],
                memberId,
                updatedMember
            );

            toast.success(response.message || t("updateSuccess"));
        },

        onError: (error: unknown) => {
            toast.error(
                (error as Error)?.message || t("loadError")
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) =>
            service.destroy(id, { club_slug: clubSlug }),

        onSuccess: (result, memberId) => {
            const response = result as ApiResponse<ClubMember>;

            if (!response.success) {
                toast.error(response.message || t("updateError"));
                return;
            }

            updateMemberInCache(
                queryClient,
                ["club-members-history", clubSlug],
                memberId,
                (member) => ({
                    ...member,
                    ...(response.data ?? {}),
                    status: response.data?.status ?? "removed",
                    is_active: response.data?.is_active ?? false,
                    removed_at:
                        response.data?.removed_at ??
                        new Date().toISOString(),
                })
            );

            queryClient.setQueriesData<ClubMemberListCache>(
                { queryKey: ["club-members", clubSlug] },
                (old) => {
                    if (!old) return old;

                    return {
                        ...old,
                        data: (old.data ?? []).filter(
                            (item) => item.id !== memberId
                        ),
                        meta: {
                            ...old.meta,
                            total: Math.max(
                                0,
                                (old.meta?.total ?? 1) - 1
                            ),
                        },
                    };
                }
            );

            toast.success(response.message || t("updateSuccess"));
        },

        onError: (error: unknown) => {
            toast.error(
                (error as Error)?.message || t("loadError")
            );
        },
    });

    const banMutation = useMutation({
        mutationFn: async ({
            id,
            payload,
        }: {
            id: number;
            payload: BanMemberPayload;
        }) =>
            service.ban(id, {
                ...payload,
                club_slug: clubSlug,
            }),

        onSuccess: (result, variables) => {
            const response = result as ApiResponse<ClubMember>;

            if (!response.success) {
                toast.error(response.message || t("updateError"));
                return;
            }

            const memberId = variables.id;

            updateMemberInCache(
                queryClient,
                ["club-members-history", clubSlug],
                memberId,
                (member) => ({
                    ...member,
                    ...(response.data ?? {}),
                    status: response.data?.status ?? "banned",
                    is_active: response.data?.is_active ?? false,
                    banned_reason:
                        response.data?.banned_reason ??
                        variables.payload.banned_reason ??
                        member.banned_reason ??
                        null,
                    banned_at:
                        response.data?.banned_at ??
                        member.banned_at ??
                        new Date().toISOString(),
                })
            );

            queryClient.setQueriesData<ClubMemberListCache>(
                { queryKey: ["club-members", clubSlug] },
                (old) => {
                    if (!old) return old;

                    return {
                        ...old,
                        data: (old.data ?? []).filter(
                            (item) => item.id !== memberId
                        ),
                        meta: {
                            ...old.meta,
                            total: Math.max(
                                0,
                                (old.meta?.total ?? 1) - 1
                            ),
                        },
                    };
                }
            );

            toast.success(response.message || t("updateSuccess"));
        },

        onError: (error: unknown) => {
            toast.error(
                (error as Error)?.message || t("loadError")
            );
        },
    });

    const handleApprove = (id: number) => {
        if (!approveMutation.isPending) {
            approveMutation.mutate(id);
        }
    };

    const handleReject = async (
        id: number,
        payload: RejectPayload
    ) => {
        await rejectMutation.mutateAsync({ id, payload });
    };

    const handleDeleteConfirm = (id: number) => {
        if (!deleteMutation.isPending) {
            deleteMutation.mutate(id);
        }
    };

    const handleBan = async (
        id: number,
        payload: BanMemberPayload = {}
    ) => {
        if (!banMutation.isPending) {
            await banMutation.mutateAsync({ id, payload });
        }
    };

    return {
        data,
        total,
        isLoading,
        isFetching,
        isApproving: approveMutation.isPending,
        handleApprove,
        isRejecting: rejectMutation.isPending,
        handleReject,
        isDeleting: deleteMutation.isPending,
        handleDeleteConfirm,
        isBanning: banMutation.isPending,
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
    const clubSlug = params?.club_slug ?? "";

    const query = useQuery({
        queryKey: [
            "club-members-select",
            clubSlug,
            params,
        ],
        queryFn: () => {
            if (!clubSlug) {
                throw new Error("Club slug is required");
            }

            return getClubMemberService().select(params);
        },
        enabled: Boolean(clubSlug),
    });

    return {
        data: query.data?.data ?? [],
        isLoading: query.isLoading,
    };
}