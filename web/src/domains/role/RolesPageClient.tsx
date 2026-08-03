// @/domains/role/components/RolesPageClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";

import { Table, ColumnDef } from "@/components/shared/ui/Table";
import { FilterBar, type AppliedFilters } from "@/components/shared/ui/FilterBar";
import { Pagination } from "@/components/shared/ui/Pagination";
import { FormModal, type SubmitResult } from "@/components/shared/forms/FormModal";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import ToggleSwitch from "@/components/shared/ui/ToggleSwitch";
import Select from "@/components/shared/ui/Select";
import { Badge } from "@/components/shared/ui/Badge";
import { useListParams } from "@/hooks/useListParams";
import { useRoles } from "@/domains/role/hooks/useRoles";
import type { Role, RoleFilters, RoleTranslation } from "@/domains/role/types";
import { APP_ROUTES } from "@/constants";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import { getTranslatedName } from "@/lib/translations";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toInitialTranslations(translations?: RoleTranslation[]) {
    if (!translations?.length) {
        return {
            vi: { locale: "vi", name: "", description: "" },
            en: { locale: "en", name: "", description: "" },
        };
    }
    return Object.fromEntries(
        translations.map(({ locale, name, description }) => [
            locale,
            { locale, name: name ?? "", description: description ?? "" },
        ])
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RolesPageClient() {
    const locale = useLocale();
    const t = useTranslations("common");
    const tr = useTranslations("role");

    const { hasPermission, isSuperAdmin, user } = useAuth();

    const canCreate = isSuperAdmin || hasPermission("user", "create");
    const canUpdate = isSuperAdmin || hasPermission("user", "update");
    const canDelete = isSuperAdmin || hasPermission("user", "delete");
    const canViewModule = isSuperAdmin || hasPermission("module", "view");

    const router = useRouter();

    // ── Options ───────────────────────────────────────────────────────────────
    const scopeOptions = [
        { value: "global", label: tr("scopeGlobal") },
        { value: "club", label: tr("scopeClub") },
    ];

    const sortOptions = [
        { value: "sort_order", label: t("sortOrder") },
        { value: "created_at", label: t("createdAt") },
    ];

    // ── Params ────────────────────────────────────────────────────────────────
    const { params, setPage, setLimit, updateMany, reset } =
        useListParams<RoleFilters>({
            defaultFilters: { search: "", is_active: undefined, scope: undefined },
            defaultSortBy: "sort_order",
            defaultSortDir: "asc",
        });

    // Draft cho extraFilters (chỉ apply khi bấm "Tìm kiếm")
    const [draftScope, setDraftScope] = useState<"global" | "club" | undefined>(params.scope);

    useEffect(() => { setDraftScope(params.scope); }, [params.scope]);

    // ── Cache hook ────────────────────────────────────────────────────────────
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
        handleToggleStatus,
    } = useRoles(params);

    // ── UI state ──────────────────────────────────────────────────────────────
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Role | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

    const openCreate = () => { setEditing(null); setModalOpen(true); };
    const openEdit = (row: Role) => { setEditing(row); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditing(null); };

    // ── FilterBar handlers ────────────────────────────────────────────────────
    const handleApply = (filters: AppliedFilters) => {
        updateMany({
            ...filters,
            scope: draftScope,
        } as Partial<typeof params>);
    };

    const handleReset = () => {
        setDraftScope(undefined);
        reset();
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (
        values: Record<string, string>,
        translations?: { locale: string; name?: string; description?: string }[]
    ): Promise<SubmitResult> => {
        const result = editing
            ? await handleEdit(editing.id, values, translations)
            : await handleCreate(values, translations);

        if (!result) closeModal();
        return result;
    };

    // ── Columns ───────────────────────────────────────────────────────────────
    const columns: ColumnDef<Role>[] = [
        {
            key: "stt",
            label: t("no"),
            className: "w-12",
            render: (_row, index) => (
                <span className="text-foreground-muted text-xs">
                    {(params.page - 1) * params.limit + index + 1}
                </span>
            ),
        },
        {
            key: "name",
            label: t("name"),
            render: (row) => (
                <div className="flex flex-col min-w-0">
                    <span className="font-medium text-foreground">
                        {getTranslatedName(row.translations, locale) ?? "—"}
                    </span>
                    <span className="font-mono text-xs text-foreground-muted mt-0.5">
                        {row.slug}
                    </span>
                </div>
            ),
        },
        {
            key: "scope",
            label: tr("scope"),
            render: (row) => (
                <Badge
                    variant={row.scope === "global" ? "admin" : "role"}
                    title={row.scope === "global" ? tr("scopeGlobal") : tr("scopeClub")}
                    showDot={false}
                />
            ),
        },
        {
            key: "permissions_count",
            label: tr("permissionsCount"),
            render: (row) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    bg-primary-100 text-primary">
                    {row.permissions_count ?? 0}
                </span>
            ),
        },
        {
            key: "is_active",
            label: t("status"),
            render: (row) => (
                <ToggleSwitch
                    checked={Boolean(row.is_active)}
                    loading={togglingIds.has(row.id)}
                    onChange={() => handleToggleStatus(row)}
                    disabled={!canUpdate}
                />
            ),
        },
    ];

    // ── extraFilters ──────────────────────────────────────────────────────────
    const extraFilters = (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-foreground-muted">
                {tr("scope")}
            </span>
            <Select
                label={tr("scope")}
                options={scopeOptions}
                value={draftScope ?? ""}
                onChange={(v) =>
                    setDraftScope((v || undefined) as "global" | "club" | undefined)
                }
                placeholder={t("all")}
            />
        </div>
    );

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <Breadcrumb homeHref={APP_ROUTES.admin} />
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">{tr("title")}</h1>
                    <p className="text-sm text-foreground-muted mt-0.5">
                        {tr("totalCount", { count: total.toLocaleString() })}
                    </p>
                </div>
                {canCreate && (
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary
                        hover:bg-primary-hover text-primary-foreground text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        {tr("create")}
                    </button>
                )}
            </div>

            <div className="space-y-4">
                <FilterBar
                    search={params.search}
                    isActive={params.is_active}
                    sortBy={params.sort_by}
                    sortDir={params.sort_dir}
                    sortOptions={sortOptions}
                    loading={isLoading}
                    onApply={handleApply}
                    onReset={handleReset}
                    extraFilters={extraFilters}
                />

                <Table
                    columns={columns}
                    data={data}
                    loading={isLoading}
                    keyExtractor={(row) => row.id}
                    renderActions={(row) => (
                        <TableActions>
                            {canViewModule && (
                                <TableActionItem
                                    icon={<ShieldCheck className="w-4 h-4" />}
                                    label={tr("assignPermissions")}
                                    onClick={() =>
                                        router.push(`${APP_ROUTES.adminRoles}/${row.slug}/permissions`)
                                    }
                                />
                            )}
                            {canUpdate && (
                                <TableActionItem
                                    icon={<Pencil className="w-4 h-4" />}
                                    label={t("edit")}
                                    onClick={() => openEdit(row)}
                                />
                            )}
                            {canDelete && row.id !== user?.id && (
                                <TableActionItem
                                    icon={<Trash2 className="w-4 h-4" />}
                                    label={t("delete")}
                                    variant="danger"
                                    onClick={() => setDeleteTarget(row)}
                                />
                            )}
                        </TableActions>
                    )}
                    emptyText={tr("notFound")}
                />

                <Pagination
                    page={params.page}
                    limit={params.limit}
                    total={total}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                />
            </div>

            {/* Form Modal — Create / Edit */}
            <FormModal
                isOpen={modalOpen}
                onClose={closeModal}
                onSubmit={handleSubmit}
                title={editing ? tr("edit") : tr("create")}
                isEdit={!!editing}
                submitting={editing ? isUpdating : isCreating}
                fields={[
                    {
                        name: "slug",
                        label: tr("slug"),
                        type: "text",
                        required: true,
                        placeholder: "admin",
                    },
                    {
                        name: "sort_order",
                        label: t("sortOrder"),
                        type: "number",
                        placeholder: "1",
                    },
                    {
                        name: "is_active",
                        label: t("active"),
                        type: "toggle",
                    },
                ]}
                initialValues={{
                    slug: editing?.slug ?? "",
                    sort_order: String(editing?.sort_order ?? 1),
                    is_active: editing?.is_active ? "1" : "0",
                }}
                translatableFields={[
                    { name: "name", label: t("name"), type: "text", required: true },
                    { name: "description", label: t("description"), type: "textarea" },
                ]}
                initialTranslations={toInitialTranslations(editing?.translations)}
            />

            {/* Delete Confirm Modal */}
            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                title={t("deleteConfirmTitle")}
                description={t("deleteConfirmDesc")}
                message={
                    deleteTarget
                        ? tr("deleteConfirmMsg", { name: getTranslatedName(deleteTarget.translations, locale) })
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
