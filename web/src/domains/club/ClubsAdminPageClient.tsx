// ══════════════════════════════════════════════════════════════════
// 4. @/domains/club/components/ClubsAdminPageClient.tsx
// ══════════════════════════════════════════════════════════════════
"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { ImageOff, Pencil, Plus, Trash2, ArrowRight } from "lucide-react";

import { Table, ColumnDef } from "@/components/shared/ui/Table";
import { FilterBar } from "@/components/shared/ui/FilterBar";
import { Pagination } from "@/components/shared/ui/Pagination";
import {
    FormModalWithMedia,
    toInitialTranslations,
    type SubmitResult,
} from "@/components/shared/forms/FormModalWithMedia";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import CustomImage from "@/components/shared/media/CustomImage";
import ToggleSwitch from "@/components/shared/ui/ToggleSwitch";
import { useListParams } from "@/hooks/useListParams";
import { useClubsQuery } from "@/domains/club/hooks/useClubsQuery";
import { clubDashboardRoute } from "@/constants";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import type { Club, ClubFilters, Translation } from "@/domains/club/types";

export function ClubsAdminPageClient() {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations("common");
    const tc = useTranslations("club");

    const tr = (translations?: Translation[]) =>
        translations?.find((item) => item.locale === locale) ?? translations?.[0];

    const { isSuperAdmin, hasPermission } = useAuth();
    const canCreate = isSuperAdmin || hasPermission("club", "create");
    const canUpdate = isSuperAdmin || hasPermission("club", "update");
    const canDelete = isSuperAdmin || hasPermission("club", "delete");

    const { params, setPage, setLimit, updateMany, reset } =
        useListParams<ClubFilters>({
            defaultFilters: { search: "", is_active: undefined },
            defaultSortBy: "sort_order",
            defaultSortDir: "asc",
            defaultLimit: 10,
        });

    // ── Cache hook — toàn bộ data + CRUD logic ────────────────────────────────
    const {
        data,
        total,
        isLoading,
        togglingIds,
        isCreating,
        isUpdating,
        isDeleting,
        handleCreate,
        handleEdit,
        handleDeleteConfirm,
        handleToggle,
    } = useClubsQuery(params);

    // ── UI state (chỉ liên quan render) ──────────────────────────────────────
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Club | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Club | null>(null);

    const openCreate = () => { setEditing(null); setModalOpen(true); };
    const openEdit = (row: Club) => { setEditing(row); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditing(null); };

    // FormModalWithMedia tự build FormData → chỉ cần delegate xuống hook
    const handleSubmit = async (formData: FormData): Promise<SubmitResult> => {
        const result = editing
            ? await handleEdit(editing.id, formData)
            : await handleCreate(formData);
        if (!result) closeModal();
        return result;
    };

    const sortOptions = [
        { value: "sort_order", label: t("sortOrder") },
        { value: "created_at", label: t("createdAt") },
    ];

    // ── Navigation ────────────────────────────────────────────────────────────
    const handleDetail = (row: Club) => {
        const slug = tr(row.translations)?.slug ?? String(row.id);
        router.push(clubDashboardRoute(slug) as never);
    };

    // ── Columns ───────────────────────────────────────────────────────────────
    const columns: ColumnDef<Club>[] = [
        {
            key: "stt", label: t("no"), className: "w-12",
            render: (_row, index) => (
                <span className="text-foreground-muted text-xs">
                    {(params.page - 1) * params.limit + index + 1}
                </span>
            ),
        },
        {
            key: "logo", label: t("logo"),
            render: (row) => (
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800
                    flex items-center justify-center shrink-0">
                    <CustomImage
                        src={row.logo}
                        alt={tr(row.translations)?.name ?? ""}
                        className="w-full h-full object-cover"
                        fallback={<ImageOff className="w-4 h-4 text-gray-400" />}
                        fallbackClassName="w-full h-full flex items-center justify-center"
                    />
                </div>
            ),
        },
        {
            key: "name", label: t("name"),
            render: (row) => (
                <span className="text-sm font-medium text-foreground">
                    {tr(row.translations)?.name ?? "—"}
                </span>
            ),
        },
        {
            key: "total_members", label: t("members"),
            render: (row) => <span className="text-sm text-foreground">{row.total_members ?? 0}</span>,
        },
        {
            key: "is_active", label: t("status"),
            render: (row) => (
                <ToggleSwitch
                    checked={Boolean(row.is_active)}
                    loading={togglingIds.has(row.id)}
                    onChange={() => handleToggle(row)}
                />
            ),
        },
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">{tc("title")}</h1>
                    <p className="text-sm text-foreground-muted mt-0.5">
                        {tc("totalCount", { count: total.toLocaleString() })}
                    </p>
                </div>
                {canCreate && (
                    <button onClick={openCreate}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary
                            hover:bg-primary-hover text-primary-foreground text-sm font-medium transition-colors">
                        <Plus className="w-4 h-4" />{tc("create")}
                    </button>
                )}
            </div>

            <div className="space-y-4">
                <FilterBar
                    search={params.search ?? ""}
                    isActive={params.is_active}
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
                    renderActions={(row) => (
                        <TableActions>
                            <TableActionItem
                                icon={<ArrowRight className="w-4 h-4" />}
                                label={t("openWorkspace")}
                                onClick={() => handleDetail(row)}
                            />
                            {canUpdate && (
                                <TableActionItem
                                    icon={<Pencil className="w-4 h-4" />}
                                    label={t("edit")}
                                    onClick={() => openEdit(row)}
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
                    )}
                    emptyText={tc("notFound")}
                />

                <Pagination
                    page={params.page}
                    limit={params.limit}
                    total={total}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                />
            </div>

            {/* Form modal */}
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
                initialValues={{
                    is_active: editing?.is_active ?? true,
                }}
                imageFields={[
                    { name: "logo", label: t("logo"), initialUrl: editing?.logo ?? null },
                ]}
                translatableFields={[
                    { name: "name", label: t("name"), type: "text", required: true, placeholder: tc("namePlaceholder") },
                    { name: "description", label: t("description"), type: "richtext", placeholder: tc("descriptionPlaceholder") },
                ]}
                initialTranslations={toInitialTranslations(editing?.translations)}
            />

            {/* Delete confirm */}
            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                title={t("deleteConfirmTitle")}
                description={t("deleteConfirmDesc")}
                message={
                    deleteTarget
                        ? tc("deleteConfirmMsg", {
                            name: tr(deleteTarget.translations)?.name ?? String(deleteTarget.id),
                        })
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