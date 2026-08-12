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

import type { MemberFilters, MemberHistoryFilters, RejectPayload } from "@/domains/members/types/member";

// ─── Members hook (tổng quan) ─────────────────────────────────────────────────

export function useClubMembers(
    params: MemberFilters & { page: number; limit: number; club_slug?: string | null },
    fixedParams?: Record<string, unknown>
) {
    const clubSlug = params.club_slug as string | undefined;
    const queryClient = useQueryClient();
    const t = useTranslations("common");
    const service = getClubMemberService();
    // fixedParams nằm trong queryKey để cache riêng theo từng bộ cố định
    const queryKey = ["club-members", clubSlug, params, fixedParams] as const;
    const mergedParams = fixedParams ? { ...params, ...fixedParams } : params;

    const { data: listData, isLoading, isFetching } = useQuery({
        queryKey,
        queryFn: () => service.list(mergedParams),
        placeholderData: keepPreviousData,
        enabled: !!clubSlug,
    });

    const data = listData?.data ?? [];
    const total = listData?.meta?.total ?? 0;

    // ── Delete (thực chất là cập nhật trạng thái, API trả về member đã update) ─
    const deleteMutation = useMutation({
        mutationFn: (id: number) => service.destroy(id, { club_slug: clubSlug }),
        onSuccess: (res) => {
            if (!res.success) return;
            // Không filter xóa khỏi list — invalidate để refetch với trạng thái mới
            queryClient.invalidateQueries({ queryKey: ["club-members", clubSlug] });
            toast.success(res.message || t("updateSuccess"));
        },
        onError: (error: unknown) => {
            toast.error((error as Error)?.message || t("loadError"));
        },
    });

    const handleDeleteConfirm = (id: number) => deleteMutation.mutate(id);

    return {
        data,
        total,
        isLoading,
        isFetching,
        isDeleting: deleteMutation.isPending,
        handleDeleteConfirm,
    };
}

// ─── Member History hook (đầy đủ: approve, reject, delete) ───────────────────

export function useClubMemberHistory(
    params: MemberHistoryFilters & { page: number; limit: number; club_slug?: string | null }
) {
    const clubSlug = params.club_slug as string | undefined;
    const queryClient = useQueryClient();
    const t = useTranslations("common");
    const service = getClubMemberService();
    const queryKey = ["club-members-history", clubSlug, params] as const;

    const { data: listData, isLoading, isFetching } = useQuery({
        queryKey,
        queryFn: () => service.list(params),
        enabled: !!clubSlug,
    });

    const data = listData?.data ?? [];
    const total = listData?.meta?.total ?? 0;

    // ── Approve ───────────────────────────────────────────────────────────────
    const approveMutation = useMutation({
        mutationFn: (id: number) => service.approve(id, { club_slug: clubSlug }),
        onSuccess: (res) => {
            if (!res.success) return;
            queryClient.invalidateQueries({ queryKey: ["club-members-history", clubSlug] });
            toast.success(res.message || t("updateSuccess"));
        },
        onError: (error: unknown) => {
            toast.error((error as Error)?.message || t("loadError"));
        },
    });

    // ── Reject ────────────────────────────────────────────────────────────────
    const rejectMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: RejectPayload }) =>
            service.reject(id, { ...payload, club_slug: clubSlug }),
        onSuccess: (res) => {
            if (!res.success) return;
            queryClient.invalidateQueries({ queryKey: ["club-members-history", clubSlug] });
            toast.success(res.message || t("updateSuccess"));
        },
        onError: (error: unknown) => {
            toast.error((error as Error)?.message || t("loadError"));
        },
    });

    // ── Delete (thực chất là cập nhật trạng thái, API trả về member đã update) ─
    const deleteMutation = useMutation({
        mutationFn: (id: number) => service.destroy(id, { club_slug: clubSlug }),
        onSuccess: (res) => {
            if (!res.success) return;
            // Không filter xóa khỏi list — invalidate để refetch với trạng thái mới
            queryClient.invalidateQueries({ queryKey: ["club-members-history", clubSlug] });
            toast.success(res.message || t("updateSuccess"));
        },
        onError: (error: unknown) => {
            toast.error((error as Error)?.message || t("loadError"));
        },
    });

    const handleApprove = (id: number) => approveMutation.mutate(id);

    const handleReject = async (id: number, payload: RejectPayload) => {
        await rejectMutation.mutateAsync({ id, payload });
    };

    const handleDeleteConfirm = (id: number) => deleteMutation.mutate(id);

    return {
        data,
        total,
        isLoading,
        isFetching,
        isApproving: approveMutation.isPending,
        isRejecting: rejectMutation.isPending,
        isDeleting: deleteMutation.isPending,
        handleApprove,
        handleReject,
        handleDeleteConfirm,
    };
}

export function useClubMemberSelect(
    params?: Partial<MemberHistoryFilters> & { club_slug?: string | null }
) {
    const clubSlug = params?.club_slug as string | undefined;
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

        enabled: true,
    });

    return {
        data: query.data?.data ?? [],
        isLoading: query.isLoading,
    };
}
