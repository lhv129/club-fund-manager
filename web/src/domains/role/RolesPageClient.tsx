"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Table, ColumnDef } from "@/components/shared/ui/Table";
import { FilterBar } from "@/components/shared/ui/FilterBar";
import { Pagination } from "@/components/shared/ui/Pagination";
import { FormModal, type SubmitResult } from "@/components/shared/forms/FormModal";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import ToggleSwitch from "@/components/shared/ui/ToggleSwitch";
import { useListParams } from "@/hooks/useListParams";
import { roleService } from "@/domains/role/services/roleService";
import type { ApiResponse } from "@/types/api";
import type { Role, RoleFilters, RoleTranslation } from "@/domains/role/types";
import { APP_ROUTES } from "@/constants";

// Helper: chuyển Translation[] → Record<locale, fields> cho initialTranslations
function toInitialTranslations(translations?: RoleTranslation[]) {
    if (!translations?.length) return undefined;
    return Object.fromEntries(
        translations.map(({ locale, name, description }) => [
            locale,
            { name, description },
        ])
    );
}

export function RolesPageClient() {
    const locale = useLocale();
    const t = useTranslations("common");
    const tr = useTranslations("role");
    const router = useRouter();

    /** Lấy tên theo locale hiện tại, fallback về phần tử đầu. */
    const getName = (translations?: RoleTranslation[]) =>
        translations?.find((x) => x.locale === locale)?.name ??
        translations?.[0]?.name ??
        "—";

    const { params, setPage, setLimit, updateMany, reset } =
        useListParams<RoleFilters>({
            defaultFilters: { search: "", is_active: undefined },
            defaultSortBy: "sort_order",
            defaultSortDir: "asc",
        });

    // ─── State ────────────────────────────────────────────────────────────────
    const [data, setData] = useState<Role[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Role | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

    const sortOptions = [
        { value: "sort_order", label: t("sortOrder") },
        { value: "created_at", label: t("createdAt") },
    ];

    // ─── Fetch ────────────────────────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await roleService.list(params);
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
    const openEdit = (row: Role) => { setEditing(row); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditing(null); };

    const handleSubmit = async (
        values: Record<string, string>,
        translations?: { locale: string; name?: string; description?: string }[]
    ): Promise<SubmitResult> => {
        setSubmitting(true);
        try {
            const payload = { ...values, translations };
            const raw = editing
                ? await roleService.update(editing.id, payload)
                : await roleService.create(payload);
            const res = raw as unknown as ApiResponse<Role>;
            if (!res.success) {
                return { success: false, message: res.message, errors: res.errors };
            }
            const saved = res.data;
            if (saved) {
                if (editing) {
                    setData((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
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

    // ─── Toggle is_active ─────────────────────────────────────────────────────
    const handleToggle = async (row: Role) => {
        if (togglingIds.has(row.id)) return;
        setTogglingIds((prev) => new Set(prev).add(row.id));
        try {
            const raw = await roleService.toggleStatus(row.id);
            const res = raw as unknown as ApiResponse<Role>;
            if (res.success) {
                setData((prev) =>
                    prev.map((item) =>
                        item.id !== row.id
                            ? item
                            : res.data
                                ? { ...item, ...res.data }
                                : { ...item, is_active: !item.is_active }
                    )
                );
            }
        } catch (error: unknown) {
            toast.error((error as Error)?.message || t("loadError"));
        } finally {
            setTogglingIds((prev) => {
                const next = new Set(prev);
                next.delete(row.id);
                return next;
            });
        }
    };

    // ─── Delete ───────────────────────────────────────────────────────────────
    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await roleService.destroy(deleteTarget.id, params);
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
                <span className="font-medium text-foreground">
                    {getName(row.translations)}
                </span>
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
                    onChange={() => handleToggle(row)}
                />
            ),
        },
    ];

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">{tr("title")}</h1>
                    <p className="text-sm text-foreground-muted mt-0.5">
                        {tr("totalCount", { count: total.toLocaleString() })}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary
            hover:bg-primary-hover text-primary-foreground text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    {tr("create")}
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

                <Table
                    columns={columns}
                    data={data}
                    loading={loading}
                    keyExtractor={(row) => row.id}
                    renderActions={(row) => (
                        <TableActions>
                            <TableActionItem
                                icon={<ShieldCheck className="w-4 h-4" />}
                                label={tr("assignPermissions")}
                                onClick={() =>
                                    router.push(`${APP_ROUTES.adminRoles}/${row.slug}/permissions`)
                                }
                            />
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
                submitting={submitting}
                fields={[
                    {
                        name: "sort_order",
                        label: t("sortOrder"),
                        type: "number",
                        placeholder: "0",
                    },
                    {
                        name: "is_active",
                        label: t("active"),
                        type: "checkbox",
                    },
                ]}
                initialValues={{
                    sort_order: editing?.sort_order ?? 0,
                    is_active: editing?.is_active ?? true,
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
                        ? tr("deleteConfirmMsg", {
                            name: getName(deleteTarget.translations),
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
