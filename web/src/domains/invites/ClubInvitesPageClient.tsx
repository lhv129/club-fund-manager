// src/app/[locale]/club/[slug]/invites/ClubInvitesPageClient.tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Plus, Trash2, ToggleLeft, ToggleRight, Copy, Check } from "lucide-react";

import { Table, type ColumnDef } from "@/components/shared/ui/Table";
import { FilterBar, type AppliedFilters } from "@/components/shared/ui/FilterBar";
import { Pagination } from "@/components/shared/ui/Pagination";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import { FormModal, type SubmitResult } from "@/components/shared/forms/FormModal";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import { CLUB_NAV_ITEMS } from "@/components/club/layout/club-nav-config";
import { Forbidden } from "@/components/shared/ui/Forbidden";
import { StatusDropdown } from "@/components/shared/ui/StatusDropdown";
import Select from "@/components/shared/ui/Select";
import { useListParams } from "@/hooks/useListParams";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { useClub } from "@/domains/club/hooks/useClub";
import { useClubInvites } from "@/domains/invites/hooks/useClubInvites";
import {
    getInviteDisplayStatus,
    type ClubInvite,
    type InviteFilters,
} from "@/domains/invites/types/invite";
import { APP_ROUTES, clubRoute } from "@/constants";
import { CopyLinkButton } from "@/domains/invites/components/CopyLinkButton";
// ─── Helpers ─────────────────────────────────────────────────────────────────
import { formatDate } from "@/utils";
import { buildJoinLink } from "@/lib/invites";




export function ClubInvitesPageClient() {
    const t = useTranslations("common");
    const ti = useTranslations("invite");
    const locale = useLocale();

    const { hasPermission, isSuperAdmin } = useAuth();
    const { club, slug } = useClub();

    // ── Permission gates (club scope) ─────────────────────────────────────────
    const canView = isSuperAdmin || hasPermission("club_invite", "view", club?.id);
    const canUpdate = isSuperAdmin || hasPermission("club_invite", "update", club?.id);

    // ── Status options (derived từ is_active + is_expired) ────────────────────
    const statusOptions = [
        { value: "active", label: ti("statusActive"), variant: "active" as const },
        { value: "inactive", label: ti("statusInactive"), variant: "inactive" as const },
        { value: "expired", label: ti("statusExpired"), variant: "locked" as const },
    ];

    // ── Sort options (chỉ những field backend chấp nhận) ─────────────────────
    const sortOptions = [
        { value: "created_at", label: t("createdAt") },
        { value: "expires_at", label: ti("expiresAt") },
    ];

    // ── is_active filter options ──────────────────────────────────────────────
    const activeOptions = [
        { value: "1", label: ti("statusActive") },
        { value: "0", label: ti("statusInactive") },
    ];

    // ── List params ─────────────────
    const { params, setPage, setLimit, updateMany, reset } =
        useListParams<InviteFilters>({
            defaultFilters: {
                search: "",
                is_active: undefined,
            },
            defaultSortBy: "created_at",
            defaultSortDir: "desc",
        });

    const [draftIsActive, setDraftIsActive] = useState<0 | 1 | undefined>(params.is_active);

    // ── Data ──────────────────────────────────────────────────────────────────
    const {
        data,
        total,
        isLoading,
        isCreating,
        isDeleting,
        handleCreate,
        handleToggle,
        handleDeleteConfirm,
    } = useClubInvites({ ...params, club_slug: slug });

    // ── UI state ──────────────────────────────────────────────────────────────
    const [deleteTarget, setDeleteTarget] = useState<ClubInvite | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    // ── FilterBar handlers ────────────────────────────────────────────────────
    const handleApplyFilters = (filters: AppliedFilters) => {
        updateMany({
            search: filters.search,
            is_active: draftIsActive,
        });
    };

    const handleReset = () => {
        setDraftIsActive(undefined);
        reset();
    };

    // ── Create submit ─────────────────────────────────────────────────────────
    const handleCreateSubmit = async (
        values: Record<string, string>
    ): Promise<SubmitResult> => {
        try {
            handleCreate({
                max_uses: values.max_uses ? Number(values.max_uses) : null,
                expires_at: values.expires_at ? values.expires_at : null,
            });
            setShowCreate(false);
            return undefined;
        } catch (error: unknown) {
            return { success: false, message: (error as Error)?.message || t("loadError") };
        }
    };

    // ── Guards ────────────────────────────────────────────────────────────────
    if (!club || !slug) return null;
    if (!canView) return <Forbidden />;

    // ── Columns ───────────────────────────────────────────────────────────────
    const columns: ColumnDef<ClubInvite>[] = [
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
            key: "invite_code",
            label: ti("code"),
            render: (row) => (
                <span className="font-mono text-sm text-fg tracking-wider">
                    {row.invite_code}
                </span>
            ),
        },
        {
            key: "join_link",
            label: ti("joinLink"),
            render: (row) => {
                const link = buildJoinLink(locale, row.club.slug, row.invite_code);
                return (
                    <span
                        className="text-xs text-fg-muted truncate max-w-[220px] block"
                        title={link}
                    >
                        {link}
                    </span>
                );
            },
        },
        {
            key: "status",
            label: t("status"),
            render: (row) => (
                <StatusDropdown
                    value={getInviteDisplayStatus(row)}
                    options={statusOptions}
                />
            ),
        },
        {
            key: "used_count",
            label: ti("usedCount"),
            render: (row) => (
                <span className="text-sm text-fg">{row.used_count}</span>
            ),
        },
        {
            key: "expires_at",
            label: ti("expiresAt"),
            render: (row) => (
                <span className="text-xs text-fg-muted whitespace-nowrap">
                    {row.expires_at ? formatDate(row.expires_at) : "—"}
                </span>
            ),
        },
        {
            key: "created_at",
            label: t("createdAt"),
            render: (row) => (
                <span className="text-xs text-fg-muted whitespace-nowrap">
                    {formatDate(row.created_at)}
                </span>
            ),
        },
        {
            key: "created_by",
            label: ti("createdBy"),
            render: (row) =>
                row.created_by
                    ? <span className="text-sm text-fg">{row.created_by.fullname}</span>
                    : <span className="text-fg-muted text-xs">—</span>,
        },
    ];

    // ── Extra filters ─────────────────────────────────────────────────────────
    const extraFilters = (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fg-muted">{t("active")}</span>
            <Select
                label={t("active")}
                options={activeOptions}
                value={draftIsActive !== undefined ? String(draftIsActive) : ""}
                onChange={(v) => {
                    if (v === "") {
                        setDraftIsActive(undefined);
                    } else {
                        setDraftIsActive(v === "1" ? 1 : 0);
                    }
                }}
                placeholder={t("all")}
            />
        </div>
    );

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <Breadcrumb
                navItems={CLUB_NAV_ITEMS(slug)}
                homeHref={club ? clubRoute(slug) : APP_ROUTES.home}
            />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-fg">{ti("title")}</h1>
                    <p className="text-sm text-fg-muted mt-0.5">
                        {ti("totalCount", { count: total.toLocaleString() })}
                    </p>
                </div>
                {canUpdate && (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-color2 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                    >
                        <Plus className="w-4 h-4" />
                        {ti("create")}
                    </button>
                )}
            </div>

            <div className="space-y-4">
                <FilterBar
                    search={params.search}
                    sortBy={params.sort_by}
                    sortDir={params.sort_dir}
                    sortOptions={sortOptions}
                    showStatusFilter={false}
                    loading={isLoading}
                    onApply={handleApplyFilters}
                    onReset={handleReset}
                    extraFilters={extraFilters}
                />

                <Table
                    columns={columns}
                    data={data}
                    loading={isLoading}
                    keyExtractor={(row) => row.id}
                    showActions={canUpdate}
                    renderActions={(row) => {
                        const joinLink = buildJoinLink(locale, row.club.slug, row.invite_code);
                        const displayStatus = getInviteDisplayStatus(row);

                        return (
                            <TableActions>
                                {/* Copy join link — luôn hiển thị */}
                                <CopyLinkButton link={joinLink} />

                                {/* Toggle active/inactive — chỉ khi chưa expired */}
                                {displayStatus !== "expired" && (
                                    <TableActionItem
                                        icon={
                                            row.is_active
                                                ? <ToggleRight className="w-4 h-4" />
                                                : <ToggleLeft className="w-4 h-4" />
                                        }
                                        label={row.is_active ? ti("deactivate") : ti("activate")}
                                        onClick={() => handleToggle(row.id)}
                                    />
                                )}

                                {/* Delete */}
                                <TableActionItem
                                    icon={<Trash2 className="w-4 h-4" />}
                                    label={t("delete")}
                                    variant="danger"
                                    onClick={() => setDeleteTarget(row)}
                                />
                            </TableActions>
                        );
                    }}
                    emptyText={ti("notFound")}
                />

                <Pagination
                    page={params.page}
                    limit={params.limit}
                    total={total}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                />
            </div>

            {/* ── Create modal ─────────────────────────────────────────────── */}
            <FormModal
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                onSubmit={handleCreateSubmit}
                title={ti("create")}
                submitting={isCreating}
                isEdit={false}
                fields={[
                    {
                        name: "max_uses",
                        label: ti("maxUses"),
                        type: "number" as const,
                        required: false,
                        placeholder: ti("maxUsesPlaceholder"),
                    },
                    {
                        name: "expires_at",
                        label: ti("expiresAt"),
                        type: "datepicker" as const,
                        required: false,
                    },
                ]}
                initialValues={{ max_uses: "", expires_at: "" }}
            />

            {/* ── Delete confirm modal ─────────────────────────────────────── */}
            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                title={t("deleteConfirmTitle")}
                description={t("deleteConfirmDesc")}
                message={
                    deleteTarget
                        ? ti("deleteConfirmMsg", { code: deleteTarget.invite_code })
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
