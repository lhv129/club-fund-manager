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
 * List API trả `translations` (mảng đầy đủ) + `translation` (số ít, theo locale hiện tại).
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
/** Dùng type (không dùng interface) để thoả Record<string, FilterValue> trong useDashboardListParams. */
export type ExampleFilters = {
  search: string;
  is_active: 0 | 1 | undefined;
};

Bước 2: Tạo service
Server Component (src/domains/example/services/exampleServiceServer.ts)
import "server-only";
import { BaseRepository } from "@/lib/baseRepository";
import { serverAdapter } from "@/lib/http/serverAdapter";
import type { Example } from "../types";
class ExampleServiceServer extends BaseRepository<Example> {
  protected resource = "examples";
  protected adapter = serverAdapter;
}
export const exampleServiceServer = new ExampleServiceServer();

Client Component (src/domains/example/services/exampleService.ts)
"use client";
import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { Example } from "../types";
import type { ApiResponse } from "@/types/api";
class ExampleServiceClient extends BaseRepository<Example> {
  protected resource = "examples";
  protected adapter = browserAdapter;
}
export const exampleServiceClient = new ExampleServiceClient();

Lưu ý: Method custom thêm ở service nào phải mirror thủ công sang service kia.

BaseRepository — các method có sẵn
Method           Mô tả
list(params?)    GET /examples → PaginatedResponse<T>
show(id)         GET /examples/:id → ApiResponse<T>
showBySlug(slug) GET /examples/slug/:slug → ApiResponse<T>   ← dùng cho route /{slug}
select(params?)  GET /examples/select → ApiResponse<T[]>
create(data)     POST /examples — nhận Partial<T> hoặc FormData
update(id, data) PUT /examples/:id — nhận Partial<T> hoặc FormData
destroy(id)      DELETE /examples/:id → ApiResponse<null>
toggleStatus(id) POST /examples/:id/toggle-status — BE tự đảo trạng thái

Bước 3: Tạo page (Server Component)
System module → src/app/[locale]/dashboard/(system)/examples/page.tsx

import { setRequestLocale } from "next-intl/server";
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

Club-scoped module (nếu module thuộc workspace CLB) → src/app/[locale]/club/[slug]/examples/page.tsx
  — params có thêm `slug`. Lấy club từ clubStore (đã hydrate ở layout).
  — Service gọi kèm club_id nếu BE cần.

Server Component chỉ set locale. Toàn bộ UI/logic nằm trong Client Component.

Bước 4: Tạo Client Component
src/app/[locale]/dashboard/(system)/examples/ExamplesPageClient.tsx

"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Eye, ImageOff, Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { DashboardTable, ColumnDef } from "@/components/ui/DashboardTable";
import { DashboardFilterBar } from "@/components/ui/DashboardFilterBar";
import { DashboardPagination } from "@/components/ui/DashboardPagination";
import {
    FormModalWithMedia,
    toInitialTranslations,
    type SubmitResult,
} from "@/components/FormModalWithMedia";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { TableActions } from "@/components/ui/TableActions";
import { TableActionItem } from "@/components/ui/TableActionItem";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { useDashboardListParams } from "@/hooks/useDashboardListParams";
import { exampleServiceClient } from "@/domains/example/services/exampleService";
import type { ApiResponse } from "@/types/api";
import type { Example, ExampleFilters, Translation } from "@/domains/example/types";
export function ExamplesPageClient() {
    const router = useRouter();
    const locale = useLocale();
    const t  = useTranslations("common");
    const te = useTranslations("example");
    /** Lấy bản dịch theo locale hiện tại, fallback về phần tử đầu. */
    const tr = (translations?: Translation[]) =>
        translations?.find((item) => item.locale === locale) ?? translations?.[0];
    const { params, setPage, setLimit, updateMany, reset } =
        useDashboardListParams<ExampleFilters>({
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
    // ─── Modal ────────────────────────────────────────────────────────────────────
    const openCreate = () => { setEditing(null); setModalOpen(true); };
    const openEdit   = (row: Example) => { setEditing(row); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditing(null); };
    const handleSubmit = async (formData: FormData): Promise<SubmitResult> => {
        setSubmitting(true);
        try {
            const raw = editing
                ? await exampleServiceClient.update(editing.id, formData)
                : await exampleServiceClient.create(formData);
            const res = raw as unknown as ApiResponse<Example>;
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
            toast.error(error?.message || t("loadError"));
        } finally {
            setSubmitting(false);
        }
    };
    // ─── Toggle is_active ─────────────────────────────────────────────────────────
    const handleToggle = async (row: Example) => {
        if (togglingIds.has(row.id)) return;
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
        { key: "stt", label: t("no"), className: "w-12",
          render: (_row, index) => <span className="text-gray-400 text-xs">{(params.page - 1) * params.limit + index + 1}</span> },
        { key: "name", label: t("name"), render: (row) => row.translation?.name ?? "—" },
        { key: "description", label: t("description"), render: (row) => row.translation?.description ?? "—" },
        { key: "is_active", label: t("status"), render: (row) => (
            <ToggleSwitch checked={Boolean(row.is_active)} loading={togglingIds.has(row.id)} onChange={() => handleToggle(row)} />
        )},
    ];
    // ─── Render ───────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{te("title")}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{te("totalCount", { count: total.toLocaleString() })}</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors">
                    <Plus className="w-4 h-4" />{te("create")}
                </button>
            </div>
            <div className="space-y-4">
                <DashboardFilterBar search={params.search} isActive={params.is_active} sortBy={params.sort_by} sortDir={params.sort_dir}
                    sortOptions={sortOptions} loading={loading}
                    onApply={(filters) => updateMany(filters as Partial<typeof params>)} onReset={reset} />
                <DashboardTable columns={columns} data={data} loading={loading} keyExtractor={(row) => row.id}
                    renderActions={(row) => (
                        <TableActions>
                            <TableActionItem icon={<Pencil className="w-4 h-4" />} label={t("edit")} onClick={() => openEdit(row)} />
                            <TableActionItem icon={<Trash2 className="w-4 h-4" />} label={t("delete")} variant="danger" onClick={() => setDeleteTarget(row)} />
                        </TableActions>
                    )}
                    emptyText={te("notFound")} />
                <DashboardPagination page={params.page} limit={params.limit} total={total} onPageChange={setPage} onLimitChange={setLimit} />
            </div>
            <FormModalWithMedia isOpen={modalOpen} onClose={closeModal} onSubmit={handleSubmit}
                title={editing ? te("edit") : te("create")} isEdit={!!editing} submitting={submitting}
                fields={[ { name: "is_active", label: t("active"), type: "checkbox" } ]}
                initialValues={{ is_active: editing?.is_active ?? true }}
                translatableFields={[
                    { name: "name", label: t("name"), type: "text", required: true },
                    { name: "description", label: t("description"), type: "textarea" },
                ]}
                initialTranslations={toInitialTranslations(editing?.translations)} />
            <DeleteConfirmModal isOpen={!!deleteTarget} title={t("deleteConfirmTitle")} description={t("deleteConfirmDesc")}
                message={deleteTarget ? te("deleteConfirmMsg", { name: deleteTarget.translation?.name ?? String(deleteTarget.id) }) : ""}
                confirmText={t("delete")} cancelText={t("cancel")}
                onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} loading={deleting} />
        </div>
    );
}

Bước 5: Thêm i18n keys
Mỗi module cần thêm vào messages/vi.json và messages/en.json:

// vi.json
{
  "common": { ... }, // dùng chung
  "menu": { "examples": "Ví dụ" },
  "example": {
    "title": "Danh sách ví dụ",
    "create": "Thêm mới",
    "edit": "Sửa",
    "notFound": "Không tìm thấy dữ liệu nào",
    "totalCount": "{count} mục",
    "deleteConfirmMsg": "Bạn có chắc chắn muốn xóa \"{name}\"?"
  }
}

// en.json
{
  "common": { ... },
  "menu": { "examples": "Examples" },
  "example": {
    "title": "Examples",
    "create": "Add new",
    "edit": "Edit",
    "notFound": "No records found",
    "totalCount": "{count} records",
    "deleteConfirmMsg": "Are you sure you want to delete \"{name}\"?"
  }
}

Bước 6: Thêm constants
src/constants/index.ts

export const MODULE_SLUGS = {
  // ...existing
  example: "example",
} as const;
// Nếu module có route riêng (system): thêm vào APP_ROUTES
//   adminExamples: "/dashboard/examples",
// Nếu module thuộc club workspace: thêm vào CLUB_SUBROUTES
//   examples: "examples",

Bước 7: Thêm nav item
System module → src/components/layout/nav-config.ts (ADMIN_NAV_ITEMS)
{
    href: APP_ROUTES.adminExamples,
    labelKey: "examples",
    icon: ExampleIcon,
    module: MODULE_SLUGS.example,
    action: PERMISSION_ACTIONS.view,
},

Club-scoped module → src/components/layout/club-nav-config.ts (CLUB_NAV_ITEMS)
{
    sub: CLUB_SUBROUTES.examples,
    labelKey: "examples",
    module: MODULE_SLUGS.example,
    action: PERMISSION_ACTIONS.view,
    icon: ExampleIcon,
},
  // ClubSidebar tự ghép sub với slug → /club/{slug}/examples
  // Permission check truyền club.id: hasPermission(module, action, club.id)

Tóm tắt file cần tạo/sửa
File                                          Việc cần làm
domains/example/types/index.ts                Interface + ExampleFilters type
domains/example/services/exampleServiceServer.ts  Server — serverAdapter, import "server-only"
domains/example/services/exampleService.ts    Client — "use client", browserAdapter
app/[locale]/dashboard/(system)/examples/...      System module — page.tsx + ExamplesPageClient.tsx
app/[locale]/club/[slug]/examples/...         Club module — page.tsx + ExamplesPageClient.tsx
constants/index.ts                            Thêm MODULE_SLUGS (+ APP_ROUTES hoặc CLUB_SUBROUTES)
components/layout/nav-config.ts               Thêm vào ADMIN_NAV_ITEMS (system module)
components/layout/club-nav-config.ts          Thêm vào CLUB_NAV_ITEMS (club module)
messages/vi.json + messages/en.json           Thêm keys cho module mới

Checklist pattern quan trọng
  fetchData async + try/catch/finally + toast.error — không dùng .then() chains
  useEffect(() => { fetchData(); }, [params]) — gọi trực tiếp, không return cleanup
  handleSubmit trả Promise<SubmitResult> — lỗi BE trả { success: false, message, errors }, không throw
  toast.success(res.message || t("saveSuccess")) — không để fallback là "" (toast trống = vô hình)
  handleToggle + handleDelete đều có try/catch + toast.error
  setData(res.data ?? []) — data là optional trong ApiResponse, luôn fallback []
  Title + nút "Thêm mới" nằm ngoài DashboardTable (trong header riêng)
  DashboardTable chỉ nhận columns, data, loading, keyExtractor, renderActions, emptyText
  Action buttons dùng <TableActions> + <TableActionItem> — không dùng plain button
  Mọi string hiển thị đều qua t() / te() — không hardcode tiếng Việt trong code
  Club-scoped page: lấy club từ clubStore, permission check truyền club.id
