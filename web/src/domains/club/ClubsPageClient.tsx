"use client";

import { useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { Plus, Building2, PlusCircle, Users, TrendingUp } from "lucide-react";

import {
    FormModalWithMedia,
    toInitialTranslations,
    type SubmitResult,
} from "@/components/shared/forms/FormModalWithMedia";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import { clubDashboardRoute, APP_ROUTES } from "@/constants";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { useListParams } from "@/hooks/useListParams";
import { useClubsQuery } from "@/domains/club/hooks/useClubsQuery";
import { getTranslation } from "@/lib/translations";
import type { Club, ClubFilters } from "@/domains/club/types";
import { ClubCard, type ClubCardLabels } from "@/domains/club/components/ClubCard";
import { LoadMoreButton } from "@/components/shared/ui/LoadMoreButton";
import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import { cn } from "@/utils";

const LIMIT = 10;

interface ClubsPageClientProps {
    clubs: Club[];
    total: number;
}

export function ClubsPageClient({ clubs: initialClubs, total: initialTotal }: ClubsPageClientProps) {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations("common");
    const tc = useTranslations("club");

    // ── Permissions ────────────────────────────────────────────────────────────
    const { isSuperAdmin, hasPermission } = useAuth();
    const canCreate = isSuperAdmin || hasPermission("club", "create");
    const canUpdateClub = useCallback(
        (clubId: number) => isSuperAdmin || hasPermission("club", "update", clubId),
        [isSuperAdmin, hasPermission],
    );
    const canDeleteClub = useCallback(
        (clubId: number) => isSuperAdmin || hasPermission("club", "delete", clubId),
        [isSuperAdmin, hasPermission],
    );

    // ── Params + data ──────────────────────────────────────────────────────────
    const { params, setLimit } = useListParams<ClubFilters>({
        defaultFilters: {},
        defaultSortBy: "sort_order",
        defaultSortDir: "asc",
        defaultLimit: LIMIT,
    });

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

    const allData = hookData.length > 0 ? hookData : initialClubs;
    const total = hookTotal > 0 ? hookTotal : initialTotal;
    const hasMore = allData.length < total;
    const remaining = total - allData.length;

    const handleLoadMore = () => {
        if (isLoading || !hasMore) return;
        setLimit(params.limit + LIMIT);
    };

    // ── Modal ──────────────────────────────────────────────────────────────────
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

    // ── Delete ─────────────────────────────────────────────────────────────────
    const [deleteTarget, setDeleteTarget] = useState<Club | null>(null);
    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        hookDeleteConfirm(deleteTarget.id);
        setDeleteTarget(null);
    };

    // ── Toggle ─────────────────────────────────────────────────────────────────
    const handleToggleById = (clubId: number) => {
        const club = allData.find((c) => c.id === clubId);
        if (club) handleToggle(club);
    };

    // ── Navigation ─────────────────────────────────────────────────────────────
    const handleOpen = (clubId: number) => {
        const club = allData.find((c) => c.id === clubId);
        if (!club) return;
        const slug = getTranslation(club.translations, locale)?.slug ?? String(club.id);
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

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">

            <Breadcrumb navItems={[]} homeHref="/" extraItems={[{ label: tc("breadcrumb") }]} />

            {/* ── Page header ──────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/25">
                        <Building2 className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-[18px] font-bold text-foreground tracking-tight leading-snug">
                            {tc("title")}
                        </h1>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <TrendingUp className="w-3.5 h-3.5 text-primary" />
                            <p className="text-sm text-foreground-muted">
                                {tc("totalCount", { count: total })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Tham gia CLB khác */}
                    <Link
                        href={APP_ROUTES.joinClub as never}
                        className={cn(
                            "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium",
                            "border border-border",
                            "bg-background",
                            "text-foreground",
                            "hover:border-primary/40",
                            "hover:text-primary hover:bg-primary/5",
                            "shadow-sm transition-all duration-150"
                        )}
                    >
                        <PlusCircle className="w-4 h-4" />
                        {tc("joinAnother")}
                    </Link>

                    {canCreate && (
                        <button
                            type="button"
                            onClick={openCreate}
                            className={cn(
                                "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold",
                                "bg-primary hover:bg-primary/90 active:bg-primary/80",
                                "text-primary-foreground shadow-sm shadow-primary/25",
                                "transition-all duration-150"
                            )}
                        >
                            <Plus className="w-4 h-4" />
                            {tc("create")}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Stats strip ──────────────────────────────────────────────── */}
            {total > 0 && (
                <div className="flex items-center gap-6 px-5 py-3.5 rounded-xl bg-background-muted border border-border">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm text-foreground-muted">
                            <span className="font-semibold text-foreground">{total}</span>
                            {" "}{tc("statsClubs")}
                        </span>
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-sm text-foreground-muted">
                            {tc("statsDesc")}
                        </span>
                    </div>
                </div>
            )}

            {/* ── Grid / empty state ───────────────────────────────────────── */}
            {allData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border bg-background-muted/50">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 ring-1 ring-primary/20">
                        <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-[15px] font-semibold text-foreground mb-1.5">
                        {tc("emptyTitle")}
                    </p>
                    <p className="text-sm text-foreground-muted mb-7 max-w-xs text-center leading-relaxed">
                        {tc("emptyDesc")}
                    </p>
                    {canCreate && (
                        <button
                            type="button"
                            onClick={openCreate}
                            className={cn(
                                "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold",
                                "bg-primary hover:bg-primary/90 active:bg-primary/80",
                                "text-primary-foreground shadow-sm shadow-primary/25",
                                "transition-all duration-150"
                            )}
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
                            const name = getTranslation(club.translations, locale)?.name ?? `Club #${club.id}`;
                            const description = getTranslation(club.translations, locale)?.description ?? null;
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
                                        const slug = getTranslation(c.translations, locale)?.slug ?? String(id);
                                        router.push(`/club/${slug}/members` as never);
                                    }}
                                    onSettings={(id) => {
                                        const c = allData.find((x) => x.id === id);
                                        if (!c) return;
                                        const slug = getTranslation(c.translations, locale)?.slug ?? String(id);
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

                    {hasMore ? (
                        <LoadMoreButton
                            onClick={handleLoadMore}
                            loading={isFetching}
                            label={tc("loadMore")}
                            loadingLabel={t("loading")}
                            remainingLabel={tc("loadMoreCount", { remaining })}
                        />
                    ) : (
                        allData.length > LIMIT && (
                            <p className="text-center text-xs text-foreground-muted py-2">
                                {tc("allLoaded")}
                            </p>
                        )
                    )}
                </>
            )}

            {/* ── Modals ────────────────────────────────────────────────────── */}
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

            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                title={tc("disbandConfirmTitle")}
                description={tc("disbandConfirmDesc")}
                message={
                    deleteTarget
                        ? tc("disbandConfirmMsg", {
                            name: getTranslation(deleteTarget.translations, locale)?.name ?? String(deleteTarget.id),
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

