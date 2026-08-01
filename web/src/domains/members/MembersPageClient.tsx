// src/app/[locale]/club/[slug]/members/MembersPageClient.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/routing";

import { Table, type ColumnDef } from "@/components/shared/ui/Table";
import { FilterBar } from "@/components/shared/ui/FilterBar";
import { Pagination } from "@/components/shared/ui/Pagination";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import Avatar from "@/components/shared/ui/Avatar";
import { useListParams } from "@/hooks/useListParams";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { useClub } from "@/domains/club/hooks/useClub";
import { useClubMembers } from "@/domains/members/hooks/useClubMembers";
import type { ClubMember, MemberFilters } from "@/domains/members/types/member";
import { APP_ROUTES, clubRoute } from "@/constants";
import { Badge } from "@/components/shared/ui/Badge";

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

// ─── Component ────────────────────────────────────────────────────────────────

export function MembersPageClient() {
    const t = useTranslations("common");
    const tm = useTranslations("member");
    const router = useRouter();

    const { hasPermission, isSuperAdmin } = useAuth();
    const { club, slug } = useClub();

    const canView = isSuperAdmin || hasPermission("club_member", "view", club?.id);
    const canDelete = isSuperAdmin || hasPermission("club_member", "update", club?.id);

    const sortOptions = [
        { value: "joined_at", label: tm("joinedAt") },
        { value: "created_at", label: t("createdAt") },
        { value: "id", label: "ID" },
    ];

    // ── List params ───────────────────────────────────────────────────────────
    const { params, setPage, setLimit, updateMany, reset } =
        useListParams<MemberFilters>({
            defaultFilters: { search: "" },
            defaultSortBy: "joined_at",
            defaultSortDir: "desc",
        });

    // ── Data ──────────────────────────────────────────────────────────────────
    const {
        data,
        total,
        isLoading,
        isDeleting,
        handleDeleteConfirm,
    } = useClubMembers(slug ?? "", params, { status: "approved" });

    // ── UI state ──────────────────────────────────────────────────────────────
    const [deleteTarget, setDeleteTarget] = useState<ClubMember | null>(null);

    if (!club || !slug) {
        return null; // hoặc Skeleton
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
                    {row.user.role && (
                        <span className="text-fg-muted text-xs truncate">{row.user.role.name}</span>
                    )}
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
            key: "email",
            label: t("email"),
            render: (row) => (
                <span className="text-sm text-fg-muted whitespace-nowrap">
                    {row.user.email}
                </span>
            ),
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
            key: "is_active",
            label: t("status"),
            className: "min-w-[120px] text-center",
            render: (row) => (
                <Badge
                    variant={row.is_active ? "active" : "inactive"}
                    title={row.is_active ? t("active") : t("inactive")}
                />
            ),
        },
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <Breadcrumb homeHref={club ? clubRoute(slug) : APP_ROUTES.home} />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-fg">{tm("title")}</h1>
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
                    loading={isLoading}
                    onApply={(filters) => updateMany(filters as Partial<typeof params>)}
                    onReset={reset}
                />

                <Table
                    columns={columns}
                    data={data}
                    loading={isLoading}
                    keyExtractor={(row) => row.id}
                    showActions={canView || canDelete}
                    renderActions={(row) => {
                        if (!canView && !canDelete) return null;
                        return (
                            <TableActions>
                                {canView && (
                                    <TableActionItem
                                        icon={<Eye className="w-4 h-4" />}
                                        label={t("detail")}
                                        onClick={() =>
                                            router.push(
                                                `${clubRoute(slug ?? "")}/members/${row.id}` as never
                                            )
                                        }
                                    />
                                )}
                                {canDelete && (
                                    <TableActionItem
                                        icon={<Trash2 className="w-4 h-4" />}
                                        label={t("delete")}
                                        variant="danger"
                                        onClick={() => setDeleteTarget(row)}
                                    />
                                )}
                            </TableActions>
                        );
                    }}
                    emptyText={tm("notFound")}
                />

                <Pagination
                    page={params.page}
                    limit={params.limit}
                    total={total}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                />
            </div>

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
