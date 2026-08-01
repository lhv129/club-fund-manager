// src/domains/club/hooks/useClubMembers.ts
"use client";

import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { getClubMemberService } from "@/domains/members/services/ClubMemberService";
import type { PaginatedResponse } from "@/types/api";
import type { ClubMember, MemberFilters, MemberHistoryFilters, RejectPayload } from "@/domains/members/types/member";

// ─── Members hook (tổng quan) ─────────────────────────────────────────────────

export function useClubMembers(
    clubSlug: string,
    params: MemberFilters & { page: number; limit: number },
    fixedParams?: Record<string, unknown>
) {
    const queryClient = useQueryClient();
    const t = useTranslations("common");
    const service = getClubMemberService(clubSlug);
    // fixedParams nằm trong queryKey để cache riêng theo từng bộ cố định
    const queryKey = ["club-members", clubSlug, params, fixedParams] as const;
    const mergedParams = fixedParams ? { ...params, ...fixedParams } : params;

    const { data: listData, isLoading } = useQuery({
        queryKey,
        queryFn: () => service.list(mergedParams),
        enabled: !!clubSlug,
    });

    const data = listData?.data ?? [];
    const total = listData?.meta?.total ?? 0;

    // ── Delete (thực chất là cập nhật trạng thái, API trả về member đã update) ─
    const deleteMutation = useMutation({
        mutationFn: (id: number) => service.destroy(id),
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
        isDeleting: deleteMutation.isPending,
        handleDeleteConfirm,
    };
}

// ─── Member History hook (đầy đủ: approve, reject, delete) ───────────────────

export function useClubMemberHistory(
    clubSlug: string,
    params: MemberHistoryFilters & { page: number; limit: number }
) {
    const queryClient = useQueryClient();
    const t = useTranslations("common");
    const service = getClubMemberService(clubSlug);
    const queryKey = ["club-members-history", clubSlug, params] as const;

    const { data: listData, isLoading } = useQuery({
        queryKey,
        queryFn: () => service.list(params),
        enabled: !!clubSlug,
    });

    const data = listData?.data ?? [];
    const total = listData?.meta?.total ?? 0;

    // ── Approve ───────────────────────────────────────────────────────────────
    const approveMutation = useMutation({
        mutationFn: (id: number) => service.approve(id),
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
            service.reject(id, payload),
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
        mutationFn: (id: number) => service.destroy(id),
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
        isApproving: approveMutation.isPending,
        isRejecting: rejectMutation.isPending,
        isDeleting: deleteMutation.isPending,
        handleApprove,
        handleReject,
        handleDeleteConfirm,
    };
}