/**
 * ClubsPageClient — Next.js + next-intl
 * Copy sang: src/domains/club/ClubsPageClient.tsx
 *
 * Cache strategy:
 *   - useClubsQuery (useClubs.ts) cho toàn bộ CRUD + toggle — không có initialData option.
 *   - initialClubs / initialTotal từ SSR props dùng làm fallback hiển thị
 *     trong khi hook đang fetch lần đầu → không flicker.
 *   - Load more → tăng limit (10 → 20 → 30 → 40…) qua setLimit của useListParams.
 *     React Query tự refetch với queryKey mới, không cần extraClubs riêng.
 */

"use client";

import { useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Plus, Building2 } from "lucide-react";

import {
    FormModalWithMedia,
    toInitialTranslations,
    type SubmitResult,
} from "@/components/shared/forms/FormModalWithMedia";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import { clubDashboardRoute } from "@/constants";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { useListParams } from "@/hooks/useListParams";
import { useClubsQuery } from "@/domains/club/hooks/useClubsQuery";
import type { Club, ClubFilters, Translation } from "@/domains/club/types";
import { ClubCard, type ClubCardLabels } from "@/domains/club/components/ClubCard";
import { LoadMoreButton } from "@/components/shared/ui/LoadMoreButton";

// ─────────────────────────────────────────────────────────────────────────────

const LIMIT = 10;

interface ClubsPageClientProps {
    /** Danh sách CLB trang đầu (limit=10) từ Server Component. */
    clubs: Club[];
    /** Tổng số CLB từ meta.total. */
    total: number;
}

// ─────────────────────────────────────────────────────────────────────────────

export function ClubsPageClient({ clubs: initialClubs, total: initialTotal }: ClubsPageClientProps) {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations("common");
    const tc = useTranslations("club");

    /** Lấy translation theo locale hiện tại, fallback về phần tử đầu tiên. */
    const tr = (translations?: Translation[]) =>
        translations?.find((item) => item.locale === locale) ?? translations?.[0];

    // ── Permission helpers ─────────────────────────────────────────────────────
    const { isSuperAdmin, hasPermission } = useAuth();

    /** canCreate — system scope. */
    const canCreate = isSuperAdmin || hasPermission("club", "create");

    /**
     * Per-card helpers — CLUB SCOPE, truyền club.id.
     * Backend: { "club_2": { "club": ["update","delete"] } }
     * → Không truyền clubId = check system scope → luôn false với club-scoped user.
     */
    const canUpdateClub = useCallback(
        (clubId: number) => isSuperAdmin || hasPermission("club", "update", clubId),
        [isSuperAdmin, hasPermission],
    );
    const canDeleteClub = useCallback(
        (clubId: number) => isSuperAdmin || hasPermission("club", "delete", clubId),
        [isSuperAdmin, hasPermission],
    );

    // ── Params — setLimit dùng để tăng limit mỗi lần load more ─────────────────
    const { params, setLimit } = useListParams<ClubFilters>({
        defaultFilters: {},
        defaultSortBy: "sort_order",
        defaultSortDir: "asc",
        defaultLimit: LIMIT,
    });

    // ── Cache hook ─────────────────────────────────────────────────────────────
    const {
        data: hookData,
        total: hookTotal,
        isLoading,
        togglingIds,
        isCreating,
        isUpdating,
        isDeleting,
        handleCreate,
        handleEdit,
        handleDeleteConfirm: hookDeleteConfirm,
        handleToggle,
    } = useClubsQuery(params);

    /**
     * Fallback về SSR data trong khi hook đang fetch lần đầu (isLoading=true, hookData=[]).
     * Sau khi hook resolve, hookData thay thế hoàn toàn — không cần extraClubs.
     */
    const allData = hookData.length > 0 ? hookData : initialClubs;
    const total = hookTotal > 0 ? hookTotal : initialTotal;

    const hasMore = allData.length < total;
    const remaining = total - allData.length;

    // ── Load more — tăng limit mỗi lần bấm (10 → 20 → 30 → 40…) ─────────────
    const handleLoadMore = () => {
        if (isLoading || !hasMore) return;
        setLimit(params.limit + LIMIT);
    };

    // ── Modal state ────────────────────────────────────────────────────────────
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Club | null>(null);

    const openCreate = () => { setEditing(null); setModalOpen(true); };
    const openEdit = (clubId: number) => {
        const club = allData.find((c) => c.id === clubId);
        if (club) { setEditing(club); setModalOpen(true); }
    };
    const closeModal = () => { setModalOpen(false); setEditing(null); };

    const handleSubmit = async (formData: FormData): Promise<SubmitResult> => {
        const result = editing
            ? await handleEdit(editing.id, formData)
            : await handleCreate(formData);
        if (!result) closeModal();
        return result;
    };

    // ── Delete (Disband) ───────────────────────────────────────────────────────
    const [deleteTarget, setDeleteTarget] = useState<Club | null>(null);

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        hookDeleteConfirm(deleteTarget.id);
        setDeleteTarget(null);
    };

    // ── Toggle ─────────────────────────────────────────────────────────────────
    const handleToggleById = (clubId: number) => {
        const club = allData.find((c) => c.id === clubId);
        if (!club) return;
        handleToggle(club);
    };

    // ── Navigation ─────────────────────────────────────────────────────────────
    const handleOpen = (clubId: number) => {
        const club = allData.find((c) => c.id === clubId);
        if (!club) return;
        const slug = tr(club.translations)?.slug ?? String(club.id);
        router.push(clubDashboardRoute(slug) as never);
    };

    // ── Labels ─────────────────────────────────────────────────────────────────
    const baseLabels: ClubCardLabels = {
        active: t("active"),
        inactive: t("inactive"),
        members: t("members"),
        role: t("role"),
        openWorkspace: t("openWorkspace"),
        noDescription: t("noDescription"),
        toggleActive: t("toggleActive"),
        toggleInactive: t("toggleInactive"),
        menu: {
            edit: t("edit"),
            members: t("members_action"),
            settings: t("settings"),
            disband: tc("disband"),
        },
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
                        {tc("title")}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {tc("totalCount", { count: total })}
                    </p>
                </div>

                {canCreate && (
                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl shrink-0
                            bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
                            text-white text-sm font-medium transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        {tc("create")}
                    </button>
                )}
            </div>

            {/* Card grid / empty state */}
            {allData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40
                        flex items-center justify-center mb-5">
                        <Building2 className="w-6 h-6 text-indigo-400" />
                    </div>
                    <p className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1.5">
                        {tc("emptyTitle")}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs leading-relaxed">
                        {tc("emptyDesc")}
                    </p>
                    {canCreate && (
                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                                bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
                                text-white text-sm font-medium transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            {tc("create")}
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allData.map((club) => {
                            const name = tr(club.translations)?.name ?? `Club #${club.id}`;
                            const description = tr(club.translations)?.description ?? null;

                            const cardCanUpdate = canUpdateClub(club.id);
                            const cardCanDelete = canDeleteClub(club.id);

                            return (
                                <ClubCard
                                    key={club.id}
                                    club={{
                                        id: club.id,
                                        name,
                                        description,
                                        logo: club.logo ?? null,
                                        isActive: Boolean(club.is_active),
                                        memberCount: club.total_members ?? 0,
                                        role: club.role?.translation?.name,
                                    }}
                                    labels={baseLabels}
                                    canUpdate={cardCanUpdate}
                                    canDelete={cardCanDelete}
                                    isToggling={togglingIds.has(club.id)}
                                    onOpen={handleOpen}
                                    onEdit={cardCanUpdate ? openEdit : undefined}
                                    onToggle={cardCanUpdate ? handleToggleById : undefined}
                                    onMembers={(id) => {
                                        const c = allData.find((x) => x.id === id);
                                        if (!c) return;
                                        const slug = tr(c.translations)?.slug ?? String(id);
                                        router.push(`/club/${slug}/members` as never);
                                    }}
                                    onSettings={(id) => {
                                        const c = allData.find((x) => x.id === id);
                                        if (!c) return;
                                        const slug = tr(c.translations)?.slug ?? String(id);
                                        router.push(`/club/${slug}/settings` as never);
                                    }}
                                    onDisband={
                                        cardCanDelete
                                            ? (id) => setDeleteTarget(allData.find((c) => c.id === id) ?? null)
                                            : undefined
                                    }
                                />
                            );
                        })}
                    </div>

                    {/* Load more / all loaded indicator */}
                    {hasMore ? (
                        <LoadMoreButton
                            onClick={handleLoadMore}
                            loading={isLoading}
                            label={tc("loadMore")}
                            loadingLabel={t("loading")}
                            remainingLabel={tc("loadMoreCount", { remaining })}
                        />
                    ) : (
                        allData.length > LIMIT && (
                            <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-2">
                                {tc("allLoaded")}
                            </p>
                        )
                    )}
                </>
            )}

            {/* Form modal — create / edit */}
            <FormModalWithMedia
                isOpen={modalOpen}
                onClose={closeModal}
                onSubmit={handleSubmit}
                title={editing ? tc("edit") : tc("create")}
                isEdit={!!editing}
                submitting={editing ? isUpdating : isCreating}
                fields={[
                    { name: "is_active", label: t("active"), type: "checkbox" },
                ]}
                initialValues={{ is_active: editing?.is_active ?? true }}
                imageFields={[
                    { name: "logo", label: t("logo"), initialUrl: editing?.logo ?? null },
                ]}
                translatableFields={[
                    { name: "name", label: t("name"), type: "text", required: true, placeholder: tc("namePlaceholder") },
                    { name: "description", label: t("description"), type: "richtext", placeholder: tc("descriptionPlaceholder") },
                ]}
                initialTranslations={toInitialTranslations(editing?.translations)}
            />

            {/* Delete (Disband) confirm modal */}
            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                title={tc("disbandConfirmTitle")}
                description={tc("disbandConfirmDesc")}
                message={
                    deleteTarget
                        ? tc("disbandConfirmMsg", {
                            name: tr(deleteTarget.translations)?.name ?? String(deleteTarget.id),
                        })
                        : ""
                }
                confirmText={tc("disband")}
                cancelText={t("cancel")}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteTarget(null)}
                loading={isDeleting}
            />
        </div>
    );
}
