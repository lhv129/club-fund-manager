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
import { clubRoute } from "@/constants";
import { Badge } from "@/components/shared/ui/Badge";
import { CLUB_NAV_ITEMS } from "@/components/club/layout/club-nav-config";


// ─── Helpers ──────────────────────────────────────────────────────────────────
import { formatDate } from "@/utils/index";

// ─── Component ────────────────────────────────────────────────────────────────

export function MembersPageClient() {
    const t = useTranslations("common");
    const tm = useTranslations("member");
    const tu = useTranslations("user");

    const router = useRouter();

    const { hasPermission, isSuperAdmin } = useAuth();
    const { club, slug } = useClub();

    const canView = isSuperAdmin || hasPermission("club_member", "view", club?.id);
    const canDelete = isSuperAdmin || hasPermission("club_member", "update", club?.id);

    const sortOptions = [
        { value: "joined_at", label: tm("joinedAt") },
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
    } = useClubMembers({ ...params, club_slug: slug }, { status: "approved" });

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
                    <span className="text-fg-muted text-xs truncate">{row.user.phone ?? "—"}</span>
                </div>
            ),
        },
        {
            key: "gender",
            label: tu("gender"),
            render: (row) => (
                <span className="text-sm text-fg">
                    {row.user.gender === "male"
                        ? tu("genderMale")
                        : row.user.gender === "female"
                            ? tu("genderFemale")
                            : row.user.gender === "other"
                                ? tu("genderOther")
                                : "—"}
                </span>
            ),
        },
        {
            key: "role",
            label: t("role"),
            render: (row) => {
                if (row.user.is_superadmin) {
                    return (
                        <Badge
                            variant="super_admin"
                            title={t("superAdmin")}
                            showDot={false}
                        />
                    );
                }

                if (row.user.is_system_admin) {
                    return (
                        <Badge
                            variant="admin"
                            title={t("systemAdmin")}
                            showDot={false}
                        />
                    );
                }

                if (!row.role) {
                    return (
                        <span className="text-sm text-fg-muted whitespace-nowrap">
                            —
                        </span>
                    );
                }

                return (
                    <Badge
                        variant="role"
                        title={row.role.translation?.name ?? "—"}
                        showDot={false}
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
            key: "is_active",
            label: t("status"),
            render: (row) => (
                <Badge
                    variant={row.is_active ? "active" : "inactive"}
                    title={row.is_active ? t("active") : t("inactive")}
                    showDot={false}
                />
            ),
        },
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <Breadcrumb
                navItems={CLUB_NAV_ITEMS(slug)}
                homeHref={clubRoute(slug)}
            //   extraItems={[{ label: tm("title") }]}
            />

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
