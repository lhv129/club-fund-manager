"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
    Check,
    X,
    Pencil,
    Plus,
    Trash2,
    Shield,
    Eye,
    FilePlus2,
    RefreshCw,
    Eraser,
} from "lucide-react";

import { Table, ColumnDef } from "@/components/shared/ui/Table";
import { FilterBar } from "@/components/shared/ui/FilterBar";
import { Pagination } from "@/components/shared/ui/Pagination";
import ToggleSwitch from "@/components/shared/ui/ToggleSwitch";
import {
    FormModal,
    type FormFieldDef,
    type TranslatableFieldDef,
} from "@/components/shared/forms/FormModal";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import { useListParams } from "@/hooks/useListParams";
import { useModules } from "@/domains/module/hooks/useModules";
import type { Module, ModuleFilters } from "@/domains/module/types";
import type { TranslationEntry } from "@/components/shared/forms/FormModal";
import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import { APP_ROUTES } from "@/constants";
import { useAuth } from "@/domains/auth/hooks/useAuth";


// ─── Helpers ──────────────────────────────────────────────────────────────────

function htmlToPreview(html?: string | null): string {
    if (!html) return "";
    return html
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function getTranslatedName(row: Module, locale: string): string {
    return (
        row.translations?.find((x) => x.locale === locale)?.name ??
        row.translations?.[0]?.name ??
        row.label ??
        row.module
    );
}

function getTranslatedDescription(row: Module, locale: string): string {
    return (
        row.translations?.find((x) => x.locale === locale)?.description ??
        row.translations?.[0]?.description ??
        row.description ??
        ""
    );
}

function toInitialTranslations(translations?: Module["translations"]) {
    if (!translations?.length) {
        return {
            vi: { locale: "vi", name: "", description: "" },
            en: { locale: "en", name: "", description: "" },
        };
    }
    return Object.fromEntries(
        translations.map(({ locale, ...rest }) => [locale, { locale, ...rest }])
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionBadge({ active }: { active?: boolean }) {
    return active ? (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20">
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        </span>
    ) : (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800">
            <X className="w-3.5 h-3.5 text-gray-400" />
        </span>
    );
}

type ActionPillProps = { label: string; active: boolean; icon: React.ReactNode };
function ActionPill({ label, active, icon }: ActionPillProps) {
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${active
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200/60 dark:ring-emerald-500/20"
                : "bg-gray-50 dark:bg-gray-800/60 text-gray-400 dark:text-gray-600"
                }`}
        >
            <span className="w-3 h-3 flex-shrink-0">{icon}</span>
            {label}
        </span>
    );
}

interface ModuleCardProps {
    module: Module;
    index: number;
    locale: string;
    onEdit: (m: Module) => void;
    onDelete: (m: Module) => void;
    onToggleStatus: (m: Module) => void;
    toggling: boolean;
}
function ModuleCard({
    module: r,
    index,
    locale,
    onEdit,
    onDelete,
    onToggleStatus,
    toggling,
}: ModuleCardProps) {
    const desc = htmlToPreview(getTranslatedDescription(r, locale));
    const t = useTranslations("common");
    const tm = useTranslations("module");
    const { hasPermission, isSuperAdmin } = useAuth();
    const canUpdate = isSuperAdmin || hasPermission("module", "update");
    const canDelete = isSuperAdmin || hasPermission("module", "delete");

    return (
        <div className="group relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden transition-all hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm">
            <div className="p-4">
                {/* Header: icon + name + actions */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            <Shield className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate block">
                                {getTranslatedName(r, locale)}
                            </span>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[10px] text-gray-400 dark:text-gray-600 tabular-nums">
                                    #{index + 1}
                                </span>
                                <span className="inline-block px-1.5 py-0.5 text-[11px] font-mono font-medium rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                    {r.module}
                                </span>
                                <span className="text-[11px] text-gray-400 dark:text-gray-600 tabular-nums">
                                    {tm("sortOrder")}: {r.sort_order}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {canUpdate && (
                            <button
                                onClick={() => onEdit(r)}
                                aria-label={t("edit")}
                                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={() => onDelete(r)}
                                aria-label={t("delete")}
                                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}

                    </div>
                </div>

                {/* Description */}
                {desc && (
                    <p className="mt-3 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                        {desc}
                    </p>
                )}

                {/* Is active */}
                <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {t("active")}
                    </span>
                    <ToggleSwitch
                        checked={!!r.is_active}
                        loading={toggling}
                        onChange={() => onToggleStatus(r)}
                        disabled={!canUpdate}
                    />
                </div>

                <div className="my-3 border-t border-gray-100 dark:border-gray-800" />

                {/* Permissions */}
                <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider">
                        {tm("permissions")}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        <ActionPill label={tm("action_view")} active={!!r.actions.view} icon={<Eye className="w-3 h-3" />} />
                        <ActionPill label={tm("action_create")} active={!!r.actions.create} icon={<FilePlus2 className="w-3 h-3" />} />
                        <ActionPill label={tm("action_update")} active={!!r.actions.update} icon={<RefreshCw className="w-3 h-3" />} />
                        <ActionPill label={tm("action_delete")} active={!!r.actions.delete} icon={<Eraser className="w-3 h-3" />} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ModulesPageClient() {
    const locale = useLocale();
    const t = useTranslations("common");
    const tm = useTranslations("module");
    const { hasPermission, isSuperAdmin } = useAuth();
    const canCreate = isSuperAdmin || hasPermission("module", "create");
    const canUpdate = isSuperAdmin || hasPermission("module", "update");
    const canDelete = isSuperAdmin || hasPermission("module", "delete");

    // ── Params ────────────────────────────────────────────────────────────────
    const { params, setPage, setLimit, updateMany, reset } =
        useListParams<ModuleFilters>({
            defaultFilters: { search: "", is_active: undefined },
            defaultSortBy: "sort_order",
            defaultSortDir: "asc",
        });

    // ── Custom hook — toàn bộ data + cache logic ──────────────────────────────
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
    } = useModules(params);

    // ── UI state (chỉ liên quan render, không liên quan cache) ───────────────
    const [modalOpen, setModalOpen] = useState(false);
    const [selected, setSelected] = useState<Module | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Module | null>(null);

    const openCreate = () => {
        setSelected(null);
        setModalOpen(true);
    };

    const openEdit = (m: Module) => {
        setSelected(m);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelected(null);
    };

    const handleSubmit = async (
        values: Record<string, string>,
        translations?: TranslationEntry[],
    ) => {
        const result = selected
            ? await handleEdit(selected.module_id, values, translations)
            : await handleCreate(values, translations);

        if (!result) {
            closeModal();
        }

        return result;
    };

    // ── Form config ───────────────────────────────────────────────────────────
    const sortOptions = [
        { value: "sort_order", label: tm("sortOrder") },
        { value: "created_at", label: t("createdAt") },
    ];

    const formFields: FormFieldDef[] = useMemo(
        () => [
            { name: "slug", label: tm("module"), type: "text", required: true, placeholder: "user" },
            { name: "sort_order", label: tm("sortOrder"), type: "number", required: true, placeholder: "1" },
            { name: "is_active", label: t("active"), type: "toggle" },
            { name: "action_view", label: tm("action_view"), type: "checkbox" },
            { name: "action_create", label: tm("action_create"), type: "checkbox" },
            { name: "action_update", label: tm("action_update"), type: "checkbox" },
            { name: "action_delete", label: tm("action_delete"), type: "checkbox" },
        ],
        [t, tm]
    );

    const translatableFields: TranslatableFieldDef[] = useMemo(
        () => [
            { name: "name", label: t("name"), type: "text", required: true, placeholder: tm("namePlaceholder") },
            { name: "description", label: t("description"), type: "richtext", placeholder: tm("descriptionPlaceholder") },
        ],
        [t, tm]
    );

    const createInitialValues = {
        slug: "", sort_order: "1", is_active: "1",
        action_view: "0", action_create: "0", action_update: "0", action_delete: "0",
    };

    const editInitialValues = selected ? {
        slug: selected.module ?? "",
        sort_order: String(selected.sort_order ?? 1),
        is_active: selected.is_active ? "1" : "0",
        action_view: selected.actions?.view ? "1" : "0",
        action_create: selected.actions?.create ? "1" : "0",
        action_update: selected.actions?.update ? "1" : "0",
        action_delete: selected.actions?.delete ? "1" : "0",
    } : undefined;

    // ── Columns (desktop) ─────────────────────────────────────────────────────
    const columns: ColumnDef<Module>[] = [
        {
            key: "stt", label: t("no"), className: "w-12",
            render: (_row, index) => (
                <span className="text-foreground-muted text-xs">
                    {(params.page - 1) * params.limit + index + 1}
                </span>
            ),
        },
        {
            key: "name", label: tm("label"),
            render: (row) => (
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                        <Shield className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        {getTranslatedName(row, locale)}
                    </span>
                </div>
            ),
        },
        {
            key: "module", label: tm("module"),
            render: (row) => (
                <span className="inline-block px-2 py-1 text-xs font-mono font-medium rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {row.module}
                </span>
            ),
        },
        {
            key: "description", label: t("description"),
            render: (row) => (
                <span className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 max-w-[320px] block">
                    {htmlToPreview(getTranslatedDescription(row, locale)) || "—"}
                </span>
            ),
        },
        {
            key: "sort_order", label: tm("sortOrder"), className: "text-center w-24",
            render: (row) => (
                <span className="text-sm text-foreground tabular-nums">{row.sort_order}</span>
            ),
        },
        {
            key: "is_active", label: t("status"), className: "text-center w-28",
            render: (row) => (
                <div className="flex justify-center">
                    <ToggleSwitch
                        checked={!!row.is_active}
                        loading={togglingIds.has(row.module_id)}
                        onChange={() => handleToggleStatus(row)}
                        disabled={!canUpdate}
                    />
                </div>
            ),
        },
        { key: "view", label: tm("action_view"), className: "text-center", render: (row) => <div className="flex justify-center"><ActionBadge active={row.actions.view} /></div> },
        { key: "create", label: tm("action_create"), className: "text-center", render: (row) => <div className="flex justify-center"><ActionBadge active={row.actions.create} /></div> },
        { key: "update", label: tm("action_update"), className: "text-center", render: (row) => <div className="flex justify-center"><ActionBadge active={row.actions.update} /></div> },
        { key: "delete", label: tm("action_delete"), className: "text-center", render: (row) => <div className="flex justify-center"><ActionBadge active={row.actions.delete} /></div> },
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <Breadcrumb homeHref={APP_ROUTES.admin} />
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">{tm("title")}</h1>
                    <p className="text-sm text-foreground-muted mt-0.5">
                        {tm("totalCount", { count: total.toLocaleString() })}
                    </p>
                </div>
                {canCreate && (
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        {tm("create")}
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
                    onApply={(filters) => updateMany(filters as Partial<typeof params>)}
                    onReset={reset}
                />

                {/* Mobile card view */}
                <div className="block lg:hidden">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
                                            <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                                        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-5/6" />
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        {Array.from({ length: 4 }).map((_, j) => (
                                            <div key={j} className="h-5 w-14 bg-gray-100 dark:bg-gray-800 rounded-full" />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
                            <Shield className="w-10 h-10 mb-3 opacity-40" />
                            <p className="text-sm">{tm("notFound")}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {data.map((m, i) => (
                                <ModuleCard
                                    key={m.module_id}
                                    module={m}
                                    index={(params.page - 1) * params.limit + i}
                                    locale={locale}
                                    onEdit={openEdit}
                                    onDelete={setDeleteTarget}
                                    onToggleStatus={handleToggleStatus}
                                    toggling={togglingIds.has(m.module_id)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Desktop table */}
                <div className="hidden lg:block">
                    <Table
                        columns={columns}
                        data={data}
                        loading={isLoading}
                        keyExtractor={(row) => row.module_id}
                        showActions={canUpdate || canDelete}
                        renderActions={(row) => (
                            <TableActions>
                                {canUpdate && (
                                    <TableActionItem icon={<Pencil className="w-4 h-4" />} label={t("edit")} onClick={() => openEdit(row)} />
                                )}
                                {canDelete && (
                                    <TableActionItem icon={<Trash2 className="w-4 h-4" />} label={t("delete")} variant="danger" onClick={() => setDeleteTarget(row)} />
                                )}
                            </TableActions>
                        )}
                        emptyText={tm("notFound")}
                    />
                </div>

                <Pagination
                    page={params.page}
                    limit={params.limit}
                    total={total}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                />

                <FormModal
                    isOpen={modalOpen}
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                    title={selected ? tm("edit") : tm("create")}
                    submitting={selected ? isUpdating : isCreating}
                    isEdit={!!selected}

                    fields={formFields}

                    initialValues={
                        selected
                            ? editInitialValues
                            : createInitialValues
                    }

                    translatableFields={translatableFields}

                    initialTranslations={
                        selected
                            ? toInitialTranslations(selected.translations)
                            : {
                                vi: { locale: "vi", name: "", description: "" },
                                en: { locale: "en", name: "", description: "" },
                            }
                    }
                />

                {/* Delete confirm */}
                <DeleteConfirmModal
                    isOpen={!!deleteTarget}
                    title={t("deleteConfirmTitle")}
                    description={t("deleteConfirmDesc")}
                    message={deleteTarget ? tm("deleteConfirmMsg", { name: getTranslatedName(deleteTarget, locale) }) : ""}
                    confirmText={t("delete")}
                    cancelText={t("cancel")}
                    onConfirm={() => { if (deleteTarget) { handleDeleteConfirm(deleteTarget.module_id); setDeleteTarget(null); } }}
                    onCancel={() => setDeleteTarget(null)}
                    loading={isDeleting}
                />
            </div>
        </div>
    );
}
