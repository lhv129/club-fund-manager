"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Table, ColumnDef } from "@/components/shared/ui/Table";
import { FilterBar } from "@/components/shared/ui/FilterBar";
import { Pagination } from "@/components/shared/ui/Pagination";
import { FormModal, type SubmitResult } from "@/components/shared/forms/FormModal";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import { useListParams } from "@/hooks/useListParams";
import { permissionService } from "@/domains/permission/services/permissionService";
import type { ApiResponse } from "@/types/api";
import type {
    Permission,
    PermissionFilters,
    PermissionTranslation,
} from "@/domains/permission/types";
import {
    SYSTEM_MODULES,
    PERMISSION_ACTIONS,
} from "@/domains/permission/types";

// Helper: toInitialTranslations — chuyển Translation[] → Record<locale, fields>
function toInitialTranslations(translations?: PermissionTranslation[]) {
    if (!translations?.length) return undefined;
    return Object.fromEntries(
        translations.map(({ locale, ...rest }) => [locale, rest])
    );
}

export function PermissionsPageClient() {
    const locale = useLocale();
    const t = useTranslations("common");
    const tp = useTranslations("permission");

    const getName = (row: Permission) =>
        row.translation?.name ??
        row.translations?.find((x) => x.locale === locale)?.name ??
        "—";

    const { params, setPage, setLimit, updateMany, reset } =
        useListParams<PermissionFilters>({
            defaultFilters: { search: "", module: undefined, is_active: undefined },
            defaultSortBy: "module",
            defaultSortDir: "asc",
        });

    // ─── State ────────────────────────────────────────────────────────────────
    const [data, setData] = useState<Permission[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Permission | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);
    const [deleting, setDeleting] = useState(false);

    const sortOptions = [
        { value: "module", label: tp("module") },
        { value: "action", label: tp("action") },
        { value: "created_at", label: t("createdAt") },
    ];

    const moduleOptions = [
        { label: t("all"), value: "" },
        ...SYSTEM_MODULES.map((m) => ({ label: m, value: m })),
    ];

    const actionSelectOptions = PERMISSION_ACTIONS.map((a) => ({
        label: tp(`action_${a}`),
        value: a,
    }));

    const moduleSelectOptions = SYSTEM_MODULES.map((m) => ({
        label: m,
        value: m,
    }));

    // ─── Fetch ────────────────────────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await permissionService.list(params);
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

    // ─── Modal ────────────────────────────────────────────────────────────────
    const openCreate = () => { setEditing(null); setModalOpen(true); };
    const openEdit = (row: Permission) => { setEditing(row); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditing(null); };

    const handleSubmit = async (
        values: Record<string, string>,
        translations?: { locale: string; name?: string; description?: string }[]
    ): Promise<SubmitResult> => {
        setSubmitting(true);
        try {
            const payload = { ...values, translations };
            const raw = editing
                ? await permissionService.update(editing.id, payload)
                : await permissionService.create(payload);
            const res = raw as unknown as ApiResponse<Permission>;
            if (!res.success) {
                return { success: false, message: res.message, errors: res.errors };
            }
            const saved = res.data;
            if (saved) {
                if (editing) {
                    setData((prev) =>
                        prev.map((item) => (item.id === saved.id ? saved : item))
                    );
                } else {
                    setData((prev) => [saved, ...prev]);
                    setTotal((prev) => prev + 1);
                }
            } else {
                await fetchData();
            }
            toast.success(res.message || t("saveSuccess"));
            closeModal();
        } catch (error: unknown) {
            toast.error((error as Error)?.message || t("loadError"));
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Delete ───────────────────────────────────────────────────────────────
    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await permissionService.destroy(deleteTarget.id, params);
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

    // ─── Columns ─────────────────────────────────────────────────────────────
    const columns: ColumnDef<Permission>[] = [
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
            key: "module",
            label: tp("module"),
            render: (row) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          bg-blue-500/10 text-blue-500 capitalize">
                    {row.module}
                </span>
            ),
        },
        {
            key: "action",
            label: tp("action"),
            render: (row) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          bg-background-muted text-foreground-muted">
                    {row.action}
                </span>
            ),
        },
        {
            key: "name",
            label: t("name"),
            render: (row) => (
                <span className="text-foreground">{getName(row)}</span>
            ),
        },
    ];

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">
                        {tp("title")}
                    </h1>
                    <p className="text-sm text-foreground-muted mt-0.5">
                        {tp("totalCount", { count: total.toLocaleString() })}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary
            hover:bg-primary-hover text-primary-foreground text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    {tp("create")}
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
                    extraFilters={
                        <select
                            value={params.module ?? ""}
                            onChange={(e) =>
                                updateMany({ module: e.target.value || undefined })
                            }
                            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700
                text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {moduleOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    }
                />

                <Table
                    columns={columns}
                    data={data}
                    loading={loading}
                    keyExtractor={(row) => row.id}
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
                    emptyText={tp("notFound")}
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
                title={editing ? tp("edit") : tp("create")}
                isEdit={!!editing}
                submitting={submitting}
                fields={[
                    {
                        name: "module",
                        label: tp("module"),
                        type: "select",
                        required: true,
                        options: moduleSelectOptions,
                    },
                    {
                        name: "action",
                        label: tp("action"),
                        type: "select",
                        required: true,
                        options: actionSelectOptions,
                    },
                ]}
                initialValues={{
                    module: editing?.module ?? "",
                    action: editing?.action ?? "",
                }}
                translatableFields={[
                    {
                        name: "name",
                        label: t("name"),
                        type: "text",
                        required: true,
                        placeholder: tp("namePlaceholder"),
                    },
                    {
                        name: "description",
                        label: t("description"),
                        type: "textarea",
                    },
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
                        ? tp("deleteConfirmMsg", {
                            name: getName(deleteTarget),
                        })
                        : ""
                }
                confirmText={t("delete")}
                cancelText={t("cancel")}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteTarget(null)}
                loading={deleting}
            />
        </div>
    );
}
