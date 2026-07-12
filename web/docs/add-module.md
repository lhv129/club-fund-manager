Hướng dẫn thêm module mới
Ví dụ: module Example — có nội dung đa ngôn ngữ (translatable), dùng ở cả Server Component và Client Component.

Bước 1: Tạo types
src/domains/example/types/index.ts

/** Translation entry — chung cho mọi entity có bản dịch. */
export interface Translation {
  locale: string;
  name: string;
  slug?: string;
  description?: string | null;
}
/**
 * List API trả `translations` (số ít, theo locale hiện tại).
 * Detail/Edit API trả `translations` (mảng đầy đủ).
 */
export interface Example {
  id: number;
  is_active: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
  translation?: Translation;   // list endpoint
  translations?: Translation[]; // show/edit endpoint
}
/** Dùng type (không dùng interface) để thoả Record<string, FilterValue> trong useAdminListParams. */
export type ExampleFilters = {
  search: string;
  is_active: 0 | 1 | undefined;
};

Bước 2: Tạo service
Server Component (src/domains/example/services/exampleService.ts)
import "server-only";
import { BaseRepository } from "@/lib/baseRepository";
import { serverAdapter } from "@/lib/http/serverAdapter";
import type { Example } from "../types";
class ExampleService extends BaseRepository<Example> {
  protected resource = "examples";
  protected adapter = serverAdapter;
}
export const exampleService = new ExampleService();

Client Component (src/domains/example/services/exampleService.client.ts)
"use client";
import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { Example } from "../types";
import type { ApiResponse } from "@/types/api";
class ExampleServiceClient extends BaseRepository<Example> {
  protected resource = "examples";
  protected adapter = browserAdapter;
  // Method custom — ví dụ: cập nhật owner
  // updateOwner(id: number, userId: number): Promise<ApiResponse<Example>> {
  //   return this.put<ApiResponse<Example>>(`/examples/${id}/owner`, { user_id: userId });
  // }
}
export const exampleServiceClient = new ExampleServiceClient();

Lưu ý: Method custom thêm ở service nào phải mirror thủ công sang service kia (đánh đổi để giữ 2 luồng server/client tách biệt).

BaseRepository — các method có sẵn
Method	Mô tả
list(params?)	GET /examples → PaginatedResponse<T>
show(id)	GET /examples/:id → ApiResponse<T>
showBySlug(slug)	GET /examples/slug/:slug → ApiResponse<T>
select(params?)	GET /examples/select → ApiResponse<T[]>
create(data)	POST /examples — nhận Partial<T> hoặc FormData
update(id, data)	PUT /examples/:id — nhận Partial<T> hoặc FormData
destroy(id)	DELETE /examples/:id → ApiResponse<null>
toggleStatus(id)	POST /examples/:id/toggle-status — BE tự đảo trạng thái
Bước 3: Tạo page (Server Component)
src/app/[locale]/(dashboard)/examples/page.tsx

import { setRequestLocale, getTranslations } from "next-intl/server";
import { ExamplesPageClient } from "./ExamplesPageClient";
export default async function ExamplesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ExamplesPageClient />;
}

Server Component chỉ set locale. Title, i18n lấy trực tiếp trong Client Component qua useTranslations.

Bước 4: Tạo Client Component
src/app/[locale]/(dashboard)/examples/ExamplesPageClient.tsx

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
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { useAdminListParams } from "@/hooks/useAdminListParams";
import { exampleServiceClient } from "@/domains/example/services/exampleService.client";
import type { ApiResponse } from "@/types/api";
import type { Example, ExampleFilters, Translation } from "@/domains/example/types";
export function ExamplesPageClient() {
    const router = useRouter();
    const locale = useLocale();
    const t  = useTranslations("common");
    const te = useTranslations("example");
    /** Lấy bản dịch theo locale hiện tại, fallback về phần tử đầu tiên. */
    const tr = (translations?: Translation[]) =>
        translations?.find((item) => item.locale === locale) ?? translations?.[0];
    const { params, setPage, setLimit, updateMany, reset } =
        useAdminListParams<ExampleFilters>({
            defaultFilters: { search: "", is_active: undefined },
            defaultSortBy: "created_at",
            defaultSortDir: "desc",
        });
    // ─── State ────────────────────────────────────────────────────────────────────
    const [data, setData]       = useState<Example[]>([]);
    const [total, setTotal]     = useState(0);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen]   = useState(false);
    const [editing, setEditing]       = useState<Example | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Example | null>(null);
    const [deleting, setDeleting]         = useState(false);
    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
    const sortOptions = [
        { value: "created_at", label: t("createdAt") },
        { value: "id",         label: "ID" },
    ];
    // ─── Fetch ────────────────────────────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await exampleServiceClient.list(params);
            if (res.success) {
                setData(res.data ?? []);      // data là optional → fallback []
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
    // ─── Navigation ───────────────────────────────────────────────────────────────
    const handleDetail = (row: Example) => {
        router.push(`/admin/examples/${row.id}` as any);
    };
    // ─── Modal ────────────────────────────────────────────────────────────────────
    const openCreate = () => { setEditing(null); setModalOpen(true); };
    const openEdit   = (row: Example) => { setEditing(row); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditing(null); };
    /**
     * onSubmit của FormModalWithMedia — trả `Promise<SubmitResult>`.
     * - Khi lỗi validate: return { success: false, message, errors } → modal hiện lỗi.
     * - Khi thành công: toast + closeModal, không return gì (void).
     * - Khi lỗi mạng/500: toast.error, modal vẫn mở.
     */
    const handleSubmit = async (formData: FormData): Promise<SubmitResult> => {
        setSubmitting(true);
        try {
            const raw = editing
                ? await exampleServiceClient.update(editing.id, formData)
                : await exampleServiceClient.create(formData);
            const res = raw as unknown as ApiResponse<Example>;
            if (!res.success) {
                // Trả lỗi về modal — hiện field errors
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
                await fetchData(); // fallback nếu BE không trả về data
            }
            // QUAN TRỌNG: fallback phải có chữ — toast.success("") hiện nhưng vô hình
            toast.success(res.message || t("saveSuccess"));
            closeModal();
        } catch (error: any) {
            toast.error(error?.message || t("loadError")); // lỗi mạng / 500
        } finally {
            setSubmitting(false);
        }
    };
    // ─── Toggle is_active ─────────────────────────────────────────────────────────
    const handleToggle = async (row: Example) => {
        if (togglingIds.has(row.id)) return; // chống double-click
        setTogglingIds((prev) => new Set(prev).add(row.id));
        try {
            const raw = await exampleServiceClient.toggleStatus(row.id);
            const res = raw as unknown as ApiResponse<Example>;
            if (res.success) {
                setData((prev) =>
                    prev.map((item) =>
                        item.id !== row.id
                            ? item
                            : res.data
                                ? { ...item, ...res.data }           // dùng data từ BE
                                : { ...item, is_active: !item.is_active } // fallback local
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
    // ─── Delete ───────────────────────────────────────────────────────────────────
    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const raw = await exampleServiceClient.destroy(deleteTarget.id);
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
    const columns: ColumnDef<Example>[] = [
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
            key: "name",
            label: t("name"),
            // List endpoint trả translation (số ít) — dùng row.translation
            render: (row) => row.translation?.name ?? "—",
        },
        {
            key: "description",
            label: t("description"),
            render: (row) => row.translation?.description ?? "—",
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
    // ─── Actions ─────────────────────────────────────────────────────────────────
    const renderRowActions = (row: Example) => (
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
    // ─── Render ───────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header — title + nút thêm mới NGOÀI AdminTable */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {te("title")}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {te("totalCount", { count: total.toLocaleString() })}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600
                        hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    {te("create")}
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
                    emptyText={te("notFound")}
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
                title={editing ? te("edit") : te("create")}
                isEdit={!!editing}
                submitting={submitting}
                fields={[
                    { name: "is_active",  label: t("active"),    type: "checkbox" },
                    { name: "sort_order", label: t("sortOrder"),  type: "number"   },
                ]}
                initialValues={{
                    is_active:  editing?.is_active  ?? true,
                    sort_order: editing?.sort_order ?? 0,
                }}
                imageFields={[
                    // Bỏ nếu module không có ảnh
                    { name: "image", label: t("images"), initialUrl: null },
                ]}
                translatableFields={[
                    { name: "name",        label: t("name"),        type: "text",     required: true },
                    { name: "slug",        label: "Slug",           type: "text"   },
                    { name: "description", label: t("description"), type: "textarea"  },
                ]}
                // toInitialTranslations: chuyển Translation[] → Record<locale, Translation>
                initialTranslations={toInitialTranslations(editing?.translations)}
            />
            {/* Delete confirm */}
            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                title={t("deleteConfirmTitle")}
                description={t("deleteConfirmDesc")}
                message={
                    deleteTarget
                        ? te("deleteConfirmMsg", {
                              name: deleteTarget.translation?.name ?? String(deleteTarget.id),
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

Bước 5: TableActions + TableActionItem
src/components/ui/TableActions.tsx

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";
export function TableActions({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);
    return (
        <div className="relative inline-block" ref={ref}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
                <MoreHorizontal className="w-4 h-4" />
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg z-50">
                    {children}
                </div>
            )}
        </div>
    );
}

src/components/ui/TableActionItem.tsx

interface TableActionItemProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    variant?: "default" | "danger";
}
export function TableActionItem({ icon, label, onClick, variant = "default" }: TableActionItemProps) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl
                ${variant === "danger"
                    ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

Bước 6: Thêm i18n keys
Mỗi module cần thêm vào messages/vi.json và messages/en.json:

// vi.json
{
  "common": {
    "view":          "Xem",
    "saveSuccess":   "Lưu thành công",
    "deleteSuccess": "Đã xóa thành công",
    "loadError":     "Không thể tải dữ liệu"
  },
  "menu": {
    "examples": "Ví dụ"
  },
  "example": {
    "title":            "Danh sách ví dụ",
    "create":           "Thêm mới",
    "edit":             "Sửa",
    "notFound":         "Không tìm thấy dữ liệu nào",
    "totalCount":       "{count} mục",
    "deleteConfirmMsg": "Bạn có chắc chắn muốn xóa \"{name}\"?"
  }
}

// en.json
{
  "common": {
    "view":          "View",
    "saveSuccess":   "Saved successfully",
    "deleteSuccess": "Deleted successfully",
    "loadError":     "Failed to load data"
  },
  "menu": {
    "examples": "Examples"
  },
  "example": {
    "title":            "Examples",
    "create":           "Add new",
    "edit":             "Edit",
    "notFound":         "No records found",
    "totalCount":       "{count} records",
    "deleteConfirmMsg": "Are you sure you want to delete \"{name}\"?"
  }
}

common.view / saveSuccess / deleteSuccess / loadError chỉ cần thêm một lần — dùng chung cho mọi module.

Bước 7: Thêm constants
src/constants/index.ts

export const APP_ROUTES = {
  // ...existing
  examples: "/examples",
} as const;
export const MODULE_SLUGS = {
  // ...existing
  example: "example",
} as const;

Bước 8: Thêm nav item
src/components/layout/Sidebar.tsx

{ href: APP_ROUTES.examples, labelKey: "examples", module: MODULE_SLUGS.example, icon: "📦" },

Tóm tắt file cần tạo/sửa
File	Việc cần làm
domains/example/types/index.ts	Interface + ExampleFilters type
domains/example/services/exampleService.ts	Server — serverAdapter, import "server-only"
domains/example/services/exampleService.client.ts	Client — "use client", browserAdapter
app/[locale]/(dashboard)/examples/page.tsx	Server Component — chỉ set locale
app/[locale]/(dashboard)/examples/ExamplesPageClient.tsx	Client Component — toàn bộ UI/logic
components/ui/TableActions.tsx	Dropdown wrapper (dùng chung)
components/ui/TableActionItem.tsx	Item trong dropdown (dùng chung)
constants/index.ts	Thêm route + module slug
components/layout/Sidebar.tsx	Thêm nav item
messages/vi.json + messages/en.json	Thêm keys cho module mới
Checklist pattern quan trọng
 fetchData là async function với try/catch/finally + toast.error — không dùng .then() chains
 useEffect(() => { fetchData(); }, [params]) — gọi trực tiếp, không return cleanup
 handleSubmit trả Promise<SubmitResult> — lỗi BE trả { success: false, message, errors }, không throw
 toast.success(res.message || t("saveSuccess")) — không để fallback là "" (toast trống = vô hình)
 handleToggle + handleDelete đều có try/catch + toast.error
 setData(res.data ?? []) — data là optional trong ApiResponse, luôn fallback []
 Title + nút "Thêm mới" nằm ngoài AdminTable (trong header riêng)
 AdminTable chỉ nhận columns, data, loading, keyExtractor, renderActions, emptyText
 Action buttons dùng <TableActions> + <TableActionItem> — không dùng plain button
 Mọi string hiển thị đều qua t() / te() — không hardcode tiếng Việt trong code