# Hướng dẫn thêm module mới
Ví dụ: module Example — có nội dung đa ngôn ngữ (translatable), dùng ở cả Server Component và Client Component.

## Bước 1: Tạo types
`src/domains/example/types/index.ts`

```ts
export interface Translation {
  locale: string;
  name: string;
  slug?: string;
  description?: string | null;
}

export interface Example {
  id: number;
  is_active: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
  translation?: Translation;    // list endpoint
  translations?: Translation[]; // show/edit endpoint
}

export type ExampleFilters = {
  search: string;
  is_active: 0 | 1 | undefined;
};
```

## Bước 2: Tạo service

**Server** (`src/domains/example/services/exampleServiceServer.ts`)
```ts
import "server-only";
import { BaseRepository } from "@/lib/baseRepository";
import { serverAdapter } from "@/lib/http/serverAdapter";
import type { Example } from "../types";
class ExampleServiceServer extends BaseRepository<Example> {
  protected resource = "examples";
  protected adapter = serverAdapter;
}
export const exampleServiceServer = new ExampleServiceServer();
```

**Client** (`src/domains/example/services/exampleService.ts`)
```ts
"use client";
import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { Example } from "../types";
class ExampleServiceClient extends BaseRepository<Example> {
  protected resource = "examples";
  protected adapter = browserAdapter;
}
export const exampleServiceClient = new ExampleServiceClient();
```

### BaseRepository — các method có sẵn

| Method | Mô tả | Response |
|--------|-------|----------|
| `list(params?)` | GET /examples | `PaginatedResponse<T>` |
| `show(id)` | GET /examples/:id | `ApiResponse<T>` |
| `showBySlug(slug)` | GET /examples/slug/:slug | `ApiResponse<T>` |
| `select(params?)` | GET /examples/select | `ApiResponse<T[]>` |
| `create(data)` | POST /examples | `ApiResponse<T>` |
| `update(id, data)` | PUT /examples/:id | `ApiResponse<T>` |
| `destroy(id)` | DELETE /examples/:id | `ApiResponse<{ success, message, data: [] }>` |
| `toggleStatus(id)` | POST /examples/:id/toggle-status | `ApiResponse<T>` |
| `updateStatus(id, status)` | PATCH /examples/:id/update-status | `ApiResponse<T>` |

> `toggleStatus` — cột `is_active` (boolean, BE tự đảo, không nhận payload).
> `updateStatus` — cột `status` (enum, caller truyền status mới muốn set).

## Bước 3: Tạo page (Server Component)

**System module** → `src/app/[locale]/admin/(system)/examples/page.tsx`
```tsx
import { setRequestLocale } from "next-intl/server";
import { ExamplesPageClient } from "./ExamplesPageClient";
export default async function AdminExamplesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ExamplesPageClient />;
}
```

**Club-scoped module** → `src/app/[locale]/club/[slug]/examples/page.tsx`
— params có thêm `slug`. Lấy club từ clubStore (đã hydrate ở layout).

## Bước 4: Tạo custom hook

`src/domains/example/hooks/useExamples.ts`

```ts
"use client";

import { useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { exampleServiceClient } from "@/domains/example/services/exampleService";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { Example, ExampleFilters } from "@/domains/example/types";
import type {
    TranslationEntry,
    SubmitResult,
    ServerErrorResponse,
} from "@/components/shared/forms/FormModal";

// ─── Private helpers ──────────────────────────────────────────────────────────

function getServerError(err: unknown): ServerErrorResponse | null {
    const responseData = (err as { response?: { data?: ServerErrorResponse } })
        ?.response?.data;
    if (responseData) return responseData;
    if (err && typeof err === "object" && "success" in err &&
        (err as ServerErrorResponse).success === false) {
        return err as ServerErrorResponse;
    }
    return null;
}

function buildPayload(
    values: Record<string, string>,
    translations?: TranslationEntry[]
): FormData {
    const formData = new FormData();
    formData.append("sort_order", values.sort_order ?? "1");
    formData.append(
        "is_active",
        values.is_active === "1" || values.is_active === "true" ? "1" : "0"
    );
    (translations ?? []).forEach((entry) => {
        formData.append(`translations[${entry.locale}][locale]`, entry.locale);
        formData.append(`translations[${entry.locale}][name]`, entry.name ?? "");
        formData.append(
            `translations[${entry.locale}][description]`,
            entry.description ?? ""
        );
    });
    return formData;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useExamples(
    params: ReturnType<typeof import("@/hooks/useListParams").useListParams<ExampleFilters>>["params"]
) {
    const queryClient = useQueryClient();
    const t = useTranslations("common");
    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

    const queryKey = ["examples", params] as const;

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const { data: listData, isLoading } = useQuery({
        queryKey,
        queryFn: () => exampleServiceClient.list(params),
    });

    const data  = listData?.data  ?? [];
    const total = listData?.meta?.total ?? 0;

    // ── Create → invalidateQueries ────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: (payload: FormData) => exampleServiceClient.create(payload),
    });

    // ── Update → invalidateQueries ────────────────────────────────────────────
    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FormData }) =>
            exampleServiceClient.update(id, payload),
    });

    // ── Delete → setQueryData ─────────────────────────────────────────────────
    const deleteMutation = useMutation({
        mutationFn: (id: number) => exampleServiceClient.destroy(id),
        onSuccess: (_, deletedId) => {
            queryClient.setQueryData(queryKey, (old: PaginatedResponse<Example> | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    data: (old.data ?? []).filter((item) => item.id !== deletedId),
                    meta: { ...old.meta, total: Math.max(0, (old.meta?.total ?? 1) - 1) },
                };
            });
            toast.success(t("deleteSuccess"));
        },
        onError: (error: unknown) => {
            toast.error((error as Error)?.message || t("loadError"));
        },
    });

    // ── Toggle → setQueryData ─────────────────────────────────────────────────
    const toggleMutation = useMutation({
        mutationFn: (id: number) =>
            exampleServiceClient.toggleStatus(id) as Promise<ApiResponse<Example>>,
        onSuccess: (res, id) => {
            if (!res.success) return;
            const saved = res.data;
            queryClient.setQueryData(queryKey, (old: PaginatedResponse<Example> | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    data: (old.data ?? []).map((item) =>
                        item.id !== id ? item
                        : saved ? { ...item, ...saved } : { ...item, is_active: !item.is_active }
                    ),
                };
            });
            toast.success(res.message || t("updateStatus"));
        },
        onError: (error: unknown) => {
            toast.error((error as Error)?.message || t("loadError"));
        },
    });

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleCreate = async (
        values: Record<string, string>,
        translations?: TranslationEntry[]
    ): Promise<SubmitResult> => {
        try {
            const raw = await createMutation.mutateAsync(buildPayload(values, translations));
            const res = raw as ApiResponse<Example>;
            if (!res.success) {
                return { success: false, message: res.message, errors: res.errors };
            }
            queryClient.invalidateQueries({ queryKey: ["examples"] });
            toast.success(res.message || t("saveSuccess"));
            return; // undefined → FormModal tự đóng
        } catch (error: unknown) {
            const serverErr = getServerError(error);
            if (serverErr) return serverErr;
            toast.error((error as Error)?.message || t("loadError"));
            return { success: false };
        }
    };

    const handleEdit = async (
        id: number,
        values: Record<string, string>,
        translations?: TranslationEntry[]
    ): Promise<SubmitResult> => {
        try {
            const raw = await updateMutation.mutateAsync({
                id,
                payload: buildPayload(values, translations),
            });
            const res = raw as ApiResponse<Example>;
            if (!res.success) {
                return { success: false, message: res.message, errors: res.errors };
            }
            queryClient.invalidateQueries({ queryKey: ["examples"] });
            toast.success(res.message || t("updateSuccess"));
            return; // undefined → FormModal tự đóng
        } catch (error: unknown) {
            const serverErr = getServerError(error);
            if (serverErr) return serverErr;
            toast.error((error as Error)?.message || t("loadError"));
            return { success: false };
        }
    };

    const handleDeleteConfirm = (id: number) => deleteMutation.mutate(id);

    const handleToggleStatus = (row: Example) => {
        if (togglingIds.has(row.id)) return;
        setTogglingIds((prev) => new Set(prev).add(row.id));
        toggleMutation.mutate(row.id, {
            onSettled: () => setTogglingIds((prev) => {
                const next = new Set(prev);
                next.delete(row.id);
                return next;
            }),
        });
    };

    return {
        data, total, isLoading, togglingIds,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        handleCreate, handleEdit, handleDeleteConfirm, handleToggleStatus,
    };
}
```

## Bước 5: Tạo Client Component

`src/app/[locale]/admin/(system)/examples/ExamplesPageClient.tsx`

```tsx
"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Pencil, Trash2 } from "lucide-react";

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
import { useExamples } from "@/domains/example/hooks/useExamples";
import type { Example, ExampleFilters } from "@/domains/example/types";

export function ExamplesPageClient() {
    const locale = useLocale();
    const t  = useTranslations("common");
    const te = useTranslations("example");

    const { params, setPage, setLimit, updateMany, reset } =
        useListParams<ExampleFilters>({
            defaultFilters: { search: "", is_active: undefined },
            defaultSortBy: "created_at",
            defaultSortDir: "desc",
        });

    const {
        data, total, isLoading, togglingIds,
        isCreating, isUpdating, isDeleting,
        handleCreate, handleEdit, handleDeleteConfirm, handleToggleStatus,
    } = useExamples(params);

    // ── UI state ──────────────────────────────────────────────────────────────
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen]     = useState(false);
    const [selected, setSelected]     = useState<Example | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Example | null>(null);

    const openEdit = (row: Example) => { setSelected(row); setEditOpen(true); };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const getTranslatedName = (row: Example) =>
        row.translations?.find((x) => x.locale === locale)?.name ??
        row.translations?.[0]?.name ?? "";

    function toInitialTranslations(translations?: Example["translations"]) {
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

    // ── Form config ───────────────────────────────────────────────────────────
    const sortOptions = [
        { value: "created_at", label: t("createdAt") },
        { value: "id",         label: "ID" },
    ];

    const formFields: FormFieldDef[] = [
        { name: "sort_order", label: t("sortOrder"), type: "number", required: true, placeholder: "1" },
        { name: "is_active",  label: t("active"), type: "checkbox" },
    ];

    const translatableFields: TranslatableFieldDef[] = [
        { name: "name",        label: t("name"),        type: "text",     required: true },
        { name: "description", label: t("description"), type: "textarea" },
    ];

    const editInitialValues = selected ? {
        sort_order: String(selected.sort_order ?? 1),
        is_active:  selected.is_active ? "1" : "0",
    } : undefined;

    // ── Columns ───────────────────────────────────────────────────────────────
    const columns: ColumnDef<Example>[] = [
        { key: "stt", label: t("no"), className: "w-12",
          render: (_row, index) => (
              <span className="text-foreground-muted text-xs">
                  {(params.page - 1) * params.limit + index + 1}
              </span>
          )},
        { key: "name", label: t("name"),
          render: (row) => getTranslatedName(row) || "—" },
        { key: "is_active", label: t("status"), className: "text-center w-28",
          render: (row) => (
              <div className="flex justify-center">
                  <ToggleSwitch
                      checked={Boolean(row.is_active)}
                      loading={togglingIds.has(row.id)}
                      onChange={() => handleToggleStatus(row)}
                  />
              </div>
          )},
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">{te("title")}</h1>
                        <p className="text-sm text-foreground-muted mt-0.5">
                            {te("totalCount", { count: total.toLocaleString() })}
                        </p>
                    </div>
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />{te("create")}
                    </button>
                </div>

                <div className="space-y-4">
                    <FilterBar
                        search={params.search} isActive={params.is_active}
                        sortBy={params.sort_by} sortDir={params.sort_dir}
                        sortOptions={sortOptions} loading={isLoading}
                        onApply={(filters) => updateMany(filters as Partial<typeof params>)}
                        onReset={reset}
                    />
                    <Table
                        columns={columns} data={data} loading={isLoading}
                        keyExtractor={(row) => row.id}
                        renderActions={(row) => (
                            <TableActions>
                                <TableActionItem icon={<Pencil className="w-4 h-4" />} label={t("edit")} onClick={() => openEdit(row)} />
                                <TableActionItem icon={<Trash2 className="w-4 h-4" />} label={t("delete")} variant="danger" onClick={() => setDeleteTarget(row)} />
                            </TableActions>
                        )}
                        emptyText={te("notFound")}
                    />
                    <Pagination
                        page={params.page} limit={params.limit} total={total}
                        onPageChange={setPage} onLimitChange={setLimit}
                    />
                </div>
            </div>

            {/* Create modal */}
            <FormModal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                onSubmit={async (...args) => {
                    const result = await handleCreate(...args);
                    if (!result) setCreateOpen(false);
                    return result;
                }}
                title={te("create")}
                fields={formFields}
                initialValues={{ sort_order: "1", is_active: "1" }}
                translatableFields={translatableFields}
                initialTranslations={{ vi: { locale: "vi", name: "", description: "" }, en: { locale: "en", name: "", description: "" } }}
                submitting={isCreating}
            />

            {/* Edit modal */}
            {selected && (
                <FormModal
                    isOpen={editOpen}
                    onClose={() => { setEditOpen(false); setSelected(null); }}
                    onSubmit={async (values, translations) => {
                        const result = await handleEdit(selected.module_id, values, translations);
                        if (!result) { setEditOpen(false); setSelected(null); }
                        return result;
                    }}
                    title={te("edit")}
                    fields={formFields}
                    initialValues={editInitialValues}
                    translatableFields={translatableFields}
                    initialTranslations={toInitialTranslations(selected.translations)}
                    submitting={isUpdating}
                    isEdit
                />
            )}

            {/* Delete confirm */}
            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                title={t("deleteConfirmTitle")}
                description={t("deleteConfirmDesc")}
                message={deleteTarget ? te("deleteConfirmMsg", { name: getTranslatedName(deleteTarget) }) : ""}
                confirmText={t("delete")} cancelText={t("cancel")}
                onConfirm={() => { if (deleteTarget) { handleDeleteConfirm(deleteTarget.id); setDeleteTarget(null); } }}
                onCancel={() => setDeleteTarget(null)}
                loading={isDeleting}
            />
        </>
    );
}
```

## Bước 6: Thêm i18n keys

```json
// vi.json
{
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
  "example": {
    "title": "Examples",
    "create": "Add new",
    "edit": "Edit",
    "notFound": "No records found",
    "totalCount": "{count} records",
    "deleteConfirmMsg": "Are you sure you want to delete \"{name}\"?"
  }
}
```

## Bước 7: Thêm constants

```ts
// src/constants/index.ts
export const MODULE_SLUGS = {
  example: "example",
} as const;
// System module: thêm vào APP_ROUTES →  adminExamples: "/admin/examples"
// Club module:   thêm vào CLUB_SUBROUTES → examples: "examples"
```

## Bước 8: Thêm nav item

**System** → `src/components/layout/nav-config.ts`
```ts
{ href: APP_ROUTES.adminExamples, labelKey: "examples", icon: ExampleIcon, module: MODULE_SLUGS.example, action: PERMISSION_ACTIONS.view },
```

**Club** → `src/components/layout/club-nav-config.ts`
```ts
{ sub: CLUB_SUBROUTES.examples, labelKey: "examples", module: MODULE_SLUGS.example, action: PERMISSION_ACTIONS.view, icon: ExampleIcon },
```

## Tóm tắt file cần tạo/sửa

| File | Việc cần làm |
|------|-------------|
| `domains/example/types/index.ts` | Interface + ExampleFilters type |
| `domains/example/services/exampleServiceServer.ts` | Server service |
| `domains/example/services/exampleService.ts` | Client service |
| `domains/example/hooks/useExamples.ts` | Custom hook — TanStack Query |
| `app/[locale]/admin/(system)/examples/page.tsx` | Server Component |
| `app/[locale]/admin/(system)/examples/ExamplesPageClient.tsx` | Client Component (UI only) |
| `constants/index.ts` | MODULE_SLUGS + APP_ROUTES / CLUB_SUBROUTES |
| `components/layout/nav-config.ts` | ADMIN_NAV_ITEMS |
| `components/layout/club-nav-config.ts` | CLUB_NAV_ITEMS |
| `messages/vi.json + messages/en.json` | i18n keys |

## Checklist

- Hook `handleCreate(values, translations)` và `handleEdit(id, values, translations)` — nhận values/translations, tự build FormData qua `buildPayload()`
- `handleCreate`/`handleEdit` trả `undefined` khi thành công → `FormModal` tự đóng; trả `{ success: false, ... }` khi lỗi → modal giữ nguyên hiển thị lỗi
- Hai modal riêng biệt: `createOpen` + `editOpen` (không dùng 1 modal chung)
- `toast.success(res.message || t("saveSuccess"))` — không để fallback là `""` (toast trống = vô hình)
- `toast.error` trong mọi `onError` / catch
- `data = listData?.data ?? []` — luôn fallback `[]`
- Mọi string hiển thị đều qua `t()` — không hardcode tiếng Việt
- Club-scoped page: permission check truyền `club.id`
- `toggleStatus` cho cột `is_active`, `updateStatus` cho cột `status` enum — không nhầm
