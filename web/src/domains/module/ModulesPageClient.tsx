"use client";

import { useEffect, useMemo, useState } from "react";
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
import toast from "react-hot-toast";

import { Table, ColumnDef } from "@/components/shared/ui/Table";
import { FilterBar } from "@/components/shared/ui/FilterBar";
import { Pagination } from "@/components/shared/ui/Pagination";
import ToggleSwitch from "@/components/shared/ui/ToggleSwitch";
import {
    FormModal,
    type FormFieldDef,
    type TranslatableFieldDef,
    type TranslationEntry,
    type SubmitResult,
    type ServerErrorResponse,
} from "@/components/shared/forms/FormModal";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import { useListParams } from "@/hooks/useListParams";
import { moduleService } from "@/domains/module/services/moduleService";
import type { ApiResponse } from "@/types/api";
import type { Module, ModuleFilters } from "@/domains/module/types";

function getServerError(err: unknown): ServerErrorResponse | null {
    const responseData = (err as { response?: { data?: ServerErrorResponse } })
        ?.response?.data;
    if (responseData) return responseData;
    if (
        err &&
        typeof err === "object" &&
        "success" in err &&
        (err as ServerErrorResponse).success === false
    ) {
        return err as ServerErrorResponse;
    }
    return null;
}

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
        row.translations?.find((x) => x.locale === locale)?.name
        ?? row.translations?.[0]?.name
        ?? row.label
        ?? row.module
    );
}

function getTranslatedDescription(row: Module, locale: string): string {
    return (
        row.translations?.find((x) => x.locale === locale)?.description
        ?? row.translations?.[0]?.description
        ?? row.description
        ?? ""
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

function buildPayload(values: Record<string, string>, translations?: TranslationEntry[]) {
    const formData = new FormData();

    formData.append("slug", values.slug ?? "");
    formData.append("sort_order", values.sort_order ?? "1");
    formData.append("is_active", (values.is_active === "1" || values.is_active === "true") ? "1" : "0");

    if (values.action_view === "1" || values.action_view === "true") {
        formData.append("actions[]", "view");
    }
    if (values.action_create === "1" || values.action_create === "true") {
        formData.append("actions[]", "create");
    }
    if (values.action_update === "1" || values.action_update === "true") {
        formData.append("actions[]", "update");
    }
    if (values.action_delete === "1" || values.action_delete === "true") {
        formData.append("actions[]", "delete");
    }

    (translations ?? []).forEach((entry) => {
        formData.append(`translations[${entry.locale}][locale]`, entry.locale);
        formData.append(`translations[${entry.locale}][name]`, entry.name ?? "");
        formData.append(`translations[${entry.locale}][description]`, entry.description ?? "");
    });

    return formData;
}

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
                ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-500/30"
                : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600"
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

function ModuleCard({ module: r, index, locale, onEdit, onDelete, onToggleStatus, toggling }: ModuleCardProps) {
    const desc = htmlToPreview(getTranslatedDescription(r, locale));

    return (
        <div className="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden transition-shadow hover:shadow-md">
            <div className="h-0.5 w-full bg-gradient-to-r from-indigo-400 to-violet-400" />
            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-100 dark:bg-indigo-500/20">
                            <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate block">
                                {getTranslatedName(r, locale)}
                            </span>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">#{index + 1}</span>
                                <span className="inline-block px-2 py-0.5 text-[11px] font-mono font-medium rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                                    {r.module}
                                </span>
                                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                    sort: {r.sort_order}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                            onClick={() => onEdit(r)}
                            className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => onDelete(r)}
                            className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {desc && (
                    <p className="mt-3 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                        {desc}
                    </p>
                )}

                <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Trạng thái</span>
                    <ToggleSwitch
                        checked={!!r.is_active}
                        loading={toggling}
                        onChange={() => onToggleStatus(r)}
                    />
                </div>

                <div className="my-3 border-t border-gray-100 dark:border-gray-800" />

                <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Quyền thông thường
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        <ActionPill label="Xem" active={!!r.actions.view} icon={<Eye className="w-3 h-3" />} />
                        <ActionPill label="Thêm" active={!!r.actions.create} icon={<FilePlus2 className="w-3 h-3" />} />
                        <ActionPill label="Sửa" active={!!r.actions.update} icon={<RefreshCw className="w-3 h-3" />} />
                        <ActionPill label="Xóa" active={!!r.actions.delete} icon={<Eraser className="w-3 h-3" />} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ModulesPageClient() {
    const locale = useLocale();
    const t = useTranslations("common");
    const tm = useTranslations("module");

    const { params, setPage, setLimit, updateMany, reset } =
        useListParams<ModuleFilters>({
            defaultFilters: { search: "", is_active: undefined },
            defaultSortBy: "sort_order",
            defaultSortDir: "asc",
        });

    const [data, setData] = useState<Module[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [togglingId, setTogglingId] = useState<number | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [selected, setSelected] = useState<Module | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Module | null>(null);

    const sortOptions = [
        { value: "sort_order", label: tm("sortOrder") },
        { value: "created_at", label: t("createdAt") },
    ];

    const formFields: FormFieldDef[] = useMemo(() => [
        {
            name: "slug",
            label: tm("module"),
            type: "text",
            required: true,
            placeholder: "user",
        },
        {
            name: "sort_order",
            label: tm("sortOrder"),
            type: "number",
            required: true,
            placeholder: "1",
        },
        {
            name: "is_active",
            label: t("active"),
            type: "checkbox",
        },
        {
            name: "action_view",
            label: `${tm("action_view")} (view)`,
            type: "checkbox",
        },
        {
            name: "action_create",
            label: `${tm("action_create")} (create)`,
            type: "checkbox",
        },
        {
            name: "action_update",
            label: `${tm("action_update")} (update)`,
            type: "checkbox",
        },
        {
            name: "action_delete",
            label: `${tm("action_delete")} (delete)`,
            type: "checkbox",
        },
    ], [t, tm]);

    const translatableFields: TranslatableFieldDef[] = useMemo(() => [
        {
            name: "name",
            label: t("name"),
            type: "text",
            required: true,
            placeholder: tm("namePlaceholder"),
        },
        {
            name: "description",
            label: t("description"),
            type: "richtext",
            placeholder: tm("descriptionPlaceholder"),
        },
    ], [t, tm]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await moduleService.list(params);
            if (res.success) {
                setData(res.data ?? []);
                setTotal(res.meta?.total ?? 0);
            }
        } catch (error: unknown) {
            toast.error((error as Error)?.message || t("loadError"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

    const openEdit = (m: Module) => {
        setSelected(m);
        setEditOpen(true);
    };

    const handleToggleStatus = async (row: Module) => {
        setTogglingId(row.module_id);
        try {
            const res = await moduleService.toggleStatus(row.module_id) as ApiResponse<Module>;
            if (!res.success) throw new Error(res.message);

            const saved = res.data;
            if (saved) {
                setData((prev) =>
                    prev.map((item) =>
                        item.module_id === saved.module_id ? saved : item
                    )
                );
            } else {
                setData((prev) =>
                    prev.map((item) =>
                        item.module_id === row.module_id
                            ? { ...item, is_active: !item.is_active }
                            : item
                    )
                );
            }

            toast.success(res.message || t("updateStatus"));
        } catch (error: unknown) {
            toast.error((error as Error)?.message || t("loadError"));
        } finally {
            setTogglingId(null);
        }
    };

    const handleCreate = async (
        values: Record<string, string>,
        translations?: TranslationEntry[]
    ): Promise<SubmitResult> => {
        setSubmitting(true);
        try {
            const raw = await moduleService.create(buildPayload(values, translations));
            const res = raw as ApiResponse<Module>;
            if (!res.success) {
                return { success: false, message: res.message, errors: res.errors };
            }

            const saved = res.data;
            if (saved) {
                setData((prev) => [saved, ...prev]);
                setTotal((prev) => prev + 1);
            } else {
                await fetchData();
            }

            toast.success(res.message || t("saveSuccess"));
            setCreateOpen(false);
        } catch (error: unknown) {
            const serverErr = getServerError(error);
            if (serverErr) return serverErr;
            toast.error((error as Error)?.message || t("loadError"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = async (
        values: Record<string, string>,
        translations?: TranslationEntry[]
    ): Promise<SubmitResult> => {
        if (!selected) return;
        setSubmitting(true);
        try {
            const raw = await moduleService.update(
                selected.module_id,
                buildPayload(values, translations)
            );
            const res = raw as ApiResponse<Module>;
            if (!res.success) {
                return { success: false, message: res.message, errors: res.errors };
            }

            const saved = res.data;
            if (saved) {
                setData((prev) =>
                    prev.map((item) =>
                        item.module_id === saved.module_id ? saved : item
                    )
                );
            } else {
                await fetchData();
            }

            toast.success(res.message || t("updateSuccess"));
            setEditOpen(false);
            setSelected(null);
        } catch (error: unknown) {
            const serverErr = getServerError(error);
            if (serverErr) return serverErr;
            toast.error((error as Error)?.message || t("loadError"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await moduleService.destroy(deleteTarget.module_id, params);
            setData(res.data ?? []);
            setTotal(res.meta?.total ?? 0);
            toast.success(res.message || t("deleteSuccess"));
            setDeleteTarget(null);
        } catch (error: unknown) {
            toast.error((error as Error)?.message || t("loadError"));
        } finally {
            setDeleting(false);
        }
    };

    const columns: ColumnDef<Module>[] = [
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
            label: tm("label"),
            render: (row) => (
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-100 dark:bg-indigo-500/20">
                        <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        {getTranslatedName(row, locale)}
                    </span>
                </div>
            ),
        },
        {
            key: "module",
            label: tm("module"),
            render: (row) => (
                <span className="inline-block px-2 py-1 text-xs font-mono font-medium rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                    {row.module}
                </span>
            ),
        },
        {
            key: "sort_order",
            label: tm("sortOrder"),
            className: "text-center w-24",
            render: (row) => (
                <span className="text-sm text-foreground tabular-nums">{row.sort_order}</span>
            ),
        },
        {
            key: "is_active",
            label: t("status"),
            className: "text-center w-28",
            render: (row) => (
                <div className="flex justify-center">
                    <ToggleSwitch
                        checked={!!row.is_active}
                        loading={togglingId === row.module_id}
                        onChange={() => handleToggleStatus(row)}
                    />
                </div>
            ),
        },
        {
            key: "description",
            label: t("description"),
            render: (row) => (
                <span className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 max-w-[320px] block">
                    {htmlToPreview(getTranslatedDescription(row, locale)) || "—"}
                </span>
            ),
        },
        {
            key: "view",
            label: tm("action_view"),
            className: "text-center",
            render: (row) => <div className="flex justify-center"><ActionBadge active={row.actions.view} /></div>,
        },
        {
            key: "create",
            label: tm("action_create"),
            className: "text-center",
            render: (row) => <div className="flex justify-center"><ActionBadge active={row.actions.create} /></div>,
        },
        {
            key: "update",
            label: tm("action_update"),
            className: "text-center",
            render: (row) => <div className="flex justify-center"><ActionBadge active={row.actions.update} /></div>,
        },
        {
            key: "delete",
            label: tm("action_delete"),
            className: "text-center",
            render: (row) => <div className="flex justify-center"><ActionBadge active={row.actions.delete} /></div>,
        },
    ];

    const createInitialValues = {
        slug: "",
        sort_order: "1",
        is_active: "1",
        action_view: "0",
        action_create: "0",
        action_update: "0",
        action_delete: "0",
    };

    const editInitialValues = selected
        ? {
            slug: selected.module ?? "",
            sort_order: String(selected.sort_order ?? 1),
            is_active: selected.is_active ? "1" : "0",
            action_view: selected.actions?.view ? "1" : "0",
            action_create: selected.actions?.create ? "1" : "0",
            action_update: selected.actions?.update ? "1" : "0",
            action_delete: selected.actions?.delete ? "1" : "0",
        }
        : undefined;

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">{tm("title")}</h1>
                        <p className="text-sm text-foreground-muted mt-0.5">
                            {tm("totalCount", { count: total.toLocaleString() })}
                        </p>
                    </div>
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        {tm("create")}
                    </button>
                </div>

                <div className="space-y-4">
                    <FilterBar
                        search={params.search}
                        isActive={params.is_active}
                        sortBy={params.sort_by}
                        sortDir={params.sort_dir}
                        sortOptions={sortOptions}
                        loading={loading}
                        onApply={(filters) => updateMany(filters as Partial<typeof params>)}
                        onReset={reset}
                    />

                    <div className="block lg:hidden">
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 animate-pulse">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800" />
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
                                        toggling={togglingId === m.module_id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="hidden lg:block">
                        <Table
                            columns={columns}
                            data={data}
                            loading={loading}
                            keyExtractor={(row) => row.module_id}
                            renderActions={(row) => (
                                <TableActions>
                                    <TableActionItem
                                        icon={<Pencil className="w-4 h-4" />}
                                        label={t("edit")}
                                        onClick={() => openEdit(row)}
                                    />
                                    <TableActionItem
                                        icon={<Trash2 className="w-4 h-4" />}
                                        label={t("delete")}
                                        variant="danger"
                                        onClick={() => setDeleteTarget(row)}
                                    />
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
                </div>
            </div>

            <FormModal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                onSubmit={handleCreate}
                title={tm("create")}
                fields={formFields}
                initialValues={createInitialValues}
                translatableFields={translatableFields}
                initialTranslations={{
                    vi: { locale: "vi", name: "", description: "" },
                    en: { locale: "en", name: "", description: "" },
                }}
                submitting={submitting}
            />

            {selected && (
                <FormModal
                    isOpen={editOpen}
                    onClose={() => {
                        setEditOpen(false);
                        setSelected(null);
                    }}
                    onSubmit={handleEdit}
                    title={tm("edit")}
                    fields={formFields}
                    initialValues={editInitialValues}
                    translatableFields={translatableFields}
                    initialTranslations={toInitialTranslations(selected.translations)}
                    submitting={submitting}
                    isEdit
                />
            )}

            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                title={t("deleteConfirmTitle")}
                description={t("deleteConfirmDesc")}
                message={
                    deleteTarget
                        ? tm("deleteConfirmMsg", { name: getTranslatedName(deleteTarget, locale) })
                        : ""
                }
                confirmText={t("delete")}
                cancelText={t("cancel")}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteTarget(null)}
                loading={deleting}
            />
        </>
    );
}
