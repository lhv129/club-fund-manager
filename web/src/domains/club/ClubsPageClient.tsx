"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Eye, ImageOff, Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { AdminTable, ColumnDef } from "@/components/ui/AdminTable";
import { AdminFilterBar } from "@/components/ui/AdminFilterBar";
import { AdminPagination } from "@/components/ui/AdminPagination";
import {
    FormModalWithMedia,
    toInitialTranslations,
    type SubmitResult,
} from "@/components/FormModalWithMedia";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { TableActions } from "@/components/ui/TableActions";
import { TableActionItem } from "@/components/ui/TableActionItem";
import CustomImage from "@/components/CustomImage";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { useAdminListParams } from "@/hooks/useAdminListParams";
import { clubServiceClient } from "@/domains/club/services/clubService";
import type { Club, Translation } from "@/domains/club/types";
import type { ApiResponse } from "@/types/api";

type ClubFilters = {
    search: string;
    is_active: 0 | 1 | undefined;
};

export function ClubsPageClient() {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations("common");
    const tc = useTranslations("club");

    const tr = (translations?: Translation[]) =>
        translations?.find((item) => item.locale === locale) ?? translations?.[0];

    const { params, setPage, setLimit, updateMany, reset } =
        useAdminListParams<ClubFilters>({
            defaultFilters: { search: "", is_active: undefined },
            defaultSortBy: "created_at",
            defaultSortDir: "desc",
        });

    const [data, setData] = useState<Club[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Club | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<Club | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

    const sortOptions = [
        { value: "created_at", label: t("createdAt") },
        { value: "id", label: "ID" },
    ];

    // ─── Fetch — pattern giống Project 1 ─────────────────────────────────────────

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await clubServiceClient.list(params);
            if (res.success) {
                setData(res.data ?? []);
                setTotal(res.meta?.total ?? 0);
            }
        } catch (error: any) {
            toast.error(error?.message || t("loadError"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Navigation ──────────────────────────────────────────────────────────────

    const handleDetail = (row: Club) => {
        router.push(`/admin/clubs/${row.id}` as any);
    };

    // ─── Modal handlers ───────────────────────────────────────────────────────────

    const openCreate = () => { setEditing(null); setModalOpen(true); };
    const openEdit = (row: Club) => { setEditing(row); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditing(null); };

    const handleSubmit = async (formData: FormData): Promise<SubmitResult> => {
        setSubmitting(true);
        try {
            const raw = editing
                ? await clubServiceClient.update(editing.id, formData)
                : await clubServiceClient.create(formData);

            const res = raw as unknown as ApiResponse<Club>;

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
        } catch (error: any) {
            // Lỗi mạng / server 500 — modal vẫn mở, hiện toast lỗi
            toast.error(error?.message || t("loadError"));
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Toggle is_active — pattern giống Project 1 ───────────────────────────────

    const handleToggle = async (row: Club) => {
        if (togglingIds.has(row.id)) return;

        setTogglingIds((prev) => new Set(prev).add(row.id));
        try {
            const raw = await clubServiceClient.toggleStatus(row.id);
            const res = raw as unknown as ApiResponse<Club>;

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
        } catch (error: any) {
            toast.error(error?.message || t("loadError"));
        } finally {
            setTogglingIds((prev) => {
                const next = new Set(prev);
                next.delete(row.id);
                return next;
            });
        }
    };

    // ─── Delete — pattern giống Project 1 ────────────────────────────────────────

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;

        setDeleting(true);
        try {
            const raw = await clubServiceClient.destroy(deleteTarget.id);
            const res = raw as unknown as ApiResponse<never>;

            if (res.success) {
                setData((prev) => prev.filter((item) => item.id !== deleteTarget.id));
                setTotal((prev) => Math.max(0, prev - 1));
                toast.success(res.message || t("deleteSuccess"));
                setDeleteTarget(null);
            }
        } catch (error: any) {
            toast.error(error?.message || t("loadError"));
        } finally {
            setDeleting(false);
        }
    };

    // ─── Columns ─────────────────────────────────────────────────────────────────

    const columns: ColumnDef<Club>[] = [
        {
            key: "stt",
            label: t("no"),
            className: "w-12",
            render: (_row, index) => (
                <span className="text-gray-400 text-xs">
                    {(params.page - 1) * params.limit + index + 1}
                </span>
            ),
        },
        {
            key: "logo",
            label: t("logo"),
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
            key: "name",
            label: t("name"),
            render: (row) => tr(row.translations)?.name ?? "—",
        },
        {
            key: "description",
            label: t("description"),
            render: (row) => tr(row.translations)?.description ?? "—",
        },
        {
            key: "total_members",
            label: t("members"),
            render: (row) => row.total_members ?? 0,
        },
        // cột sort_order đã bỏ theo yêu cầu
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

    // ─── Action buttons — giống Project 1 ────────────────────────────────────────

    const renderRowActions = (row: Club) => (
        <TableActions>
            <TableActionItem
                icon={<Eye className="w-4 h-4" />}
                label={t("view")}
                onClick={() => handleDetail(row)}
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
    );

    // ─── Render ──────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {tc("title")}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {tc("totalCount", { count: total.toLocaleString() })}
                    </p>
                </div>

                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600
                        hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    {tc("create")}
                </button>
            </div>

            <div className="space-y-4">
                <AdminFilterBar
                    search={params.search}
                    isActive={params.is_active}
                    sortBy={params.sort_by}
                    sortDir={params.sort_dir}
                    sortOptions={sortOptions}
                    loading={loading}
                    onApply={(filters) => updateMany(filters as Partial<typeof params>)}
                    onReset={reset}
                />

                <AdminTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    keyExtractor={(row) => row.id}
                    renderActions={renderRowActions}
                    emptyText={tc("notFound")}
                />

                <AdminPagination
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
                submitting={submitting}
                fields={[
                    { name: "is_active", label: t("active"), type: "checkbox" },
                    // { name: "sort_order", label: t("sortOrder"), type: "number" },
                ]}
                initialValues={{
                    is_active: editing?.is_active ?? true,
                    // sort_order: editing?.sort_order ?? 0,
                }}
                imageFields={[
                    { name: "logo", label: t("logo"), initialUrl: editing?.logo ?? null },
                ]}
                translatableFields={[
                    { name: "name", label: t("name"), type: "text", required: true },
                    { name: "description", label: t("description"), type: "textarea" },
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
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteTarget(null)}
                loading={deleting}
            />
        </div>
    );
}
