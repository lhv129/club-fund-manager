// src/app/[locale]/club/[slug]/history-member/MembershipsPageClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, XCircle, Trash2 } from "lucide-react";

import { Table, type ColumnDef } from "@/components/shared/ui/Table";
import { FilterBar, type AppliedFilters } from "@/components/shared/ui/FilterBar";
import { DataTable } from "@/components/shared/ui/DataTable";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import { FormModal, type SubmitResult } from "@/components/shared/forms/FormModal";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import { Forbidden } from "@/components/shared/ui/Forbidden";
import { StatusDropdown } from "@/components/shared/ui/StatusDropdown";
import Select from "@/components/shared/ui/Select";
import Avatar from "@/components/shared/ui/Avatar";
import { useListParams } from "@/hooks/useListParams";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { useClub } from "@/domains/club/hooks/useClub";
import { useClubMemberHistory } from "@/domains/members/hooks/useClubMembers";
import type {
    ClubMember,
    ClubMemberStatus,
    ClubMemberJoinType,
    MemberHistoryFilters,
} from "@/domains/members/types/member";
import { clubRoute } from "@/constants";
import { Badge } from "@/components/shared/ui/Badge";
import { CLUB_NAV_ITEMS } from "@/components/club/layout/club-nav-config";



// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
    if (!iso) return "—";
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(iso));
}

function ActorCell({ actor }: { actor: { id: number; fullname: string } | null | undefined }) {
    if (!actor) return <span className="text-fg-muted text-xs">—</span>;
    return <span className="text-sm text-fg">{actor.fullname}</span>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MembershipsPageClient() {
    const t = useTranslations("common");
    const tm = useTranslations("member");

    const { hasPermission, isSuperAdmin } = useAuth();
    const { club, slug } = useClub();

    // ── Permission gates (club scope — luôn truyền club.id) ───────────────────
    const canView = isSuperAdmin || hasPermission("club_member", "view", club?.id);
    const canUpdate = isSuperAdmin || hasPermission("club_member", "update", club?.id);
    const canDelete = isSuperAdmin || hasPermission("club_member", "delete", club?.id);

    // ── Filter options ────────────────────────────────────────────────────────
    const statusOptions = [
        { value: "pending", label: tm("statusPending"), variant: "pending" as const },
        { value: "approved", label: tm("statusApproved"), variant: "active" as const },
        { value: "rejected", label: tm("statusRejected"), variant: "locked" as const },
        { value: "removed", label: tm("statusRemoved"), variant: "inactive" as const },
    ];

    const statusSelectOptions = statusOptions.map((o) => ({
        value: o.value,
        label: o.label,
    }));

    const joinTypeOptions = [
        { value: "request", label: tm("joinTypeRequest") },
        { value: "invite", label: tm("joinTypeInvite") },
    ];

    const activeOptions = [
        { value: "1", label: t("active") },
        { value: "0", label: t("inactive") },
    ];

    const sortOptions = [
        { value: "joined_at", label: tm("joinedAt") },
        { value: "created_at", label: t("createdAt") },
        { value: "id", label: "ID" },
    ];

    // ── List params ───────────────────────────────────────────────────────────
    const { params, setPage, setLimit, updateMany, reset } =
        useListParams<MemberHistoryFilters>({
            defaultFilters: {
                search: "",
                status: undefined,
                join_type: undefined,
                is_active: undefined,
            },
            defaultSortBy: "created_at",
            defaultSortDir: "desc",
        });

    // Draft state cho extra filters
    const [draftStatus, setDraftStatus] = useState<ClubMemberStatus | undefined>(params.status);
    const [draftJoinType, setDraftJoinType] = useState<ClubMemberJoinType | undefined>(params.join_type);
    const [draftIsActive, setDraftIsActive] = useState<0 | 1 | undefined>(params.is_active);

    useEffect(() => { setDraftStatus(params.status); }, [params.status]);
    useEffect(() => { setDraftJoinType(params.join_type); }, [params.join_type]);
    useEffect(() => { setDraftIsActive(params.is_active); }, [params.is_active]);

    // ── Data ──────────────────────────────────────────────────────────────────
    const {
        data,
        total,
        isLoading,
        isFetching,
        isRejecting,
        isDeleting,
        handleApprove,
        handleReject,
        handleDeleteConfirm,
    } = useClubMemberHistory({ ...params, club_slug: slug });

    // ── UI state ──────────────────────────────────────────────────────────────
    const [deleteTarget, setDeleteTarget] = useState<ClubMember | null>(null);
    const [rejectTarget, setRejectTarget] = useState<ClubMember | null>(null);

    // ── FilterBar handlers ────────────────────────────────────────────────────
    const handleApplyFilters = (filters: AppliedFilters) => {
        updateMany({
            search: filters.search,
            sort_by: filters.sort_by,
            sort_dir: filters.sort_dir,
            status: draftStatus,
            join_type: draftJoinType,
            is_active: draftIsActive,
        });
    };

    const handleReset = () => {
        setDraftStatus(undefined);
        setDraftJoinType(undefined);
        setDraftIsActive(undefined);
        reset();
    };

    // ── Reject submit (via FormModal) ─────────────────────────────────────────
    const handleRejectSubmit = async (
        values: Record<string, string>
    ): Promise<SubmitResult> => {
        if (!rejectTarget) return { success: false };
        try {
            await handleReject(rejectTarget.id, {
                rejected_reason: values.rejected_reason ?? "",
            });
            setRejectTarget(null);
            return undefined; // FormModal tự đóng
        } catch (error: unknown) {
            return { success: false, message: (error as Error)?.message || t("loadError") };
        }
    };

    // ── Guards ────────────────────────────────────────────────────────────────
    if (!club || !slug) {
        return null; // hoặc Skeleton
    }

    // Tầng 3 — page gate: không có quyền view → trả Forbidden
    if (!canView) {
        return <Forbidden description={tm('forbidden_description')} />;
    }

    // ── Columns ───────────────────────────────────────────────────────────────
    const columns: ColumnDef<ClubMember>[] = [
        {
            key: "stt",
            label: t("no"),
            className: "w-12",
            render: (_row, index) => (
                <span className="text-fg-muted text-xs">
                    {(params.page - 1) * params.limit + index + 1}
                </span>
            ),
        },
        {
            key: "avatar",
            label: tm("avatar"),
            className: "w-14",
            render: (row) => (
                <div className="w-10 h-10 rounded-full overflow-hidden bg-background-muted flex items-center justify-center shrink-0">
                    <Avatar
                        imgUrl={row.user.avatar}
                        userName={row.user.fullname}
                        sizeClass="w-full h-full object-cover"
                    />
                </div>
            ),
        },
        {
            key: "fullname",
            label: t("name"),
            render: (row) => (
                <div className="flex flex-col min-w-0">
                    <span className="text-fg font-medium truncate">{row.user.fullname}</span>
                    <span className="text-fg-muted text-xs truncate">{row.user.email}</span>
                </div>
            ),
        },
        {
            key: "phone",
            label: tm("phone"),
            render: (row) => (
                <span className="text-sm text-fg whitespace-nowrap">
                    {row.user.phone ?? "—"}
                </span>
            ),
        },
        {
            key: "join_type",
            label: tm("joinType"),
            render: (row) => (
                <Badge
                    variant={row.join_type}
                    title={
                        row.join_type === "invite"
                            ? tm("joinTypeInvite")
                            : tm("joinTypeRequest")
                    }
                    showDot={false}
                />
            ),
        },
        {
            key: "status",
            label: t("status"),
            render: (row) => {
                if (!row.status) {
                    return (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-background-muted text-fg-muted">
                            —
                        </span>
                    );
                }
                return (
                    <StatusDropdown
                        value={row.status}
                        options={statusOptions}
                    />
                );
            },
        },
        {
            key: "joined_at",
            label: tm("joinedAt"),
            render: (row) => (
                <span className="text-xs text-fg-muted whitespace-nowrap">
                    {formatDate(row.joined_at)}
                </span>
            ),
        },
        {
            key: "reviewedBy",
            label: tm("reviewedBy"),
            render: (row) => <ActorCell actor={row.reviewedBy} />,
        },
        {
            key: "invitedBy",
            label: tm("invitedBy"),
            render: (row) => <ActorCell actor={row.invitedBy} />,
        },
        {
            key: "removed_at",
            label: tm("removedAt"),
            render: (row) => (
                <span className="text-xs text-fg-muted whitespace-nowrap">
                    {row.removed_at ? formatDate(row.removed_at) : "—"}
                </span>
            ),
        },
        {
            key: "rejected_reason",
            label: tm("rejectedReason"),
            render: (row) => (
                <span className="text-xs text-red-500 max-w-[160px] truncate block" title={row.rejected_reason ?? ""}>
                    {row.rejected_reason ?? "—"}
                </span>
            ),
        },
    ];

    // ── Extra filters ─────────────────────────────────────────────────────────
    const extraFilters = (
        <>
            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-fg-muted">{t("status")}</span>
                <Select
                    label={t("status")}
                    options={statusSelectOptions}
                    value={draftStatus ?? ""}
                    onChange={(v) =>
                        setDraftStatus((v || undefined) as ClubMemberStatus | undefined)
                    }
                    placeholder={t("all")}
                />
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-fg-muted">{tm("joinType")}</span>
                <Select
                    label={tm("joinType")}
                    options={joinTypeOptions}
                    value={draftJoinType ?? ""}
                    onChange={(v) =>
                        setDraftJoinType((v || undefined) as ClubMemberJoinType | undefined)
                    }
                    placeholder={t("all")}
                />
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-fg-muted">{t("active")}</span>
                <Select
                    label={t("active")}
                    options={activeOptions}
                    value={draftIsActive !== undefined ? String(draftIsActive) : ""}
                    onChange={(v) =>
                        setDraftIsActive(v === "" ? undefined : (Number(v) as 0 | 1))
                    }
                    placeholder={t("all")}
                />
            </div>
        </>
    );

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <Breadcrumb
                navItems={CLUB_NAV_ITEMS(slug)}
                homeHref={clubRoute(slug)}
            />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-fg">{tm("historyTitle")}</h1>
                    <p className="text-sm text-fg-muted mt-0.5">
                        {tm("totalCount", { count: total.toLocaleString() })}
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <FilterBar
                    search={params.search}
                    sortBy={params.sort_by}
                    sortDir={params.sort_dir}
                    sortOptions={sortOptions}
                    showStatusFilter={false}
                    loading={isFetching}
                    onApply={handleApplyFilters}
                    onReset={handleReset}
                    extraFilters={extraFilters}
                />

                <DataTable
                    table={{ columns, data, loading: isLoading, fetching: isFetching,
                    keyExtractor: (row) => row.id,
                    showActions: canUpdate || canDelete,
                    renderActions: (row) => {
                        const isPending = row.status === "pending";

                        const showApprove = canUpdate && isPending;
                        const showReject = canUpdate && isPending;
                        const showDelete = canDelete;

                        if (!showApprove && !showReject && !showDelete) return null;

                        return (
                            <TableActions>
                                {showApprove && (
                                    <TableActionItem
                                        icon={<CheckCircle className="w-4 h-4" />}
                                        label={tm("approve")}
                                        onClick={() => handleApprove(row.id)}
                                    />
                                )}
                                {showReject && (
                                    <TableActionItem
                                        icon={<XCircle className="w-4 h-4" />}
                                        label={tm("reject")}
                                        variant="danger"
                                        onClick={() => setRejectTarget(row)}
                                    />
                                )}
                                {showDelete && (
                                    <TableActionItem
                                        icon={<Trash2 className="w-4 h-4" />}
                                        label={t("delete")}
                                        variant="danger"
                                        onClick={() => setDeleteTarget(row)}
                                    />
                                )}
                            </TableActions>
                        );
                    }, emptyText: tm("notFound") }}
                    pagination={{ page: params.page, limit: params.limit, total, onPageChange: setPage, onLimitChange: setLimit }}
                />
            </div>

            {/* ── Reject modal (cần lý do) ────────────────────────────────────── */}
            <FormModal
                isOpen={!!rejectTarget}
                onClose={() => setRejectTarget(null)}
                onSubmit={handleRejectSubmit}
                title={tm("rejectTitle")}
                submitting={isRejecting}
                isEdit={false}
                fields={[
                    {
                        name: "rejected_reason",
                        label: tm("rejectedReason"),
                        type: "textarea" as const,
                        required: false,
                        placeholder: tm("rejectedReasonPlaceholder"),
                    },
                ]}
                initialValues={{ rejected_reason: "" }}
            />

            {/* ── Delete (status change) confirm modal ────────────────────────── */}
            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                title={t("deleteConfirmTitle")}
                description={t("deleteConfirmDesc")}
                message={
                    deleteTarget
                        ? tm("deleteConfirmMsg", { name: deleteTarget.user.fullname })
                        : ""
                }
                confirmText={t("delete")}
                cancelText={t("cancel")}
                onConfirm={() => {
                    if (deleteTarget) {
                        handleDeleteConfirm(deleteTarget.id);
                        setDeleteTarget(null);
                    }
                }}
                onCancel={() => setDeleteTarget(null)}
                loading={isDeleting}
            />
        </div>
    );
}

