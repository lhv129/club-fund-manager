# Hướng dẫn thêm module mới
Ví dụ: module Example — có nội dung đa ngôn ngữ (translatable), dùng ở cả Server Component và Client Component.

## Bước 1: Tạo types
`src/domains/example/types/index.ts`

```ts
export interface Translation {
  locale: string;
  name: string; // hoặc title
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

> **Lưu ý quan trọng — Translation dùng `title` thay vì `name`:**
>
> Base `Translation` (`@/domains/club/types`) đã có `title?: string` (optional).
> Nếu entity BE trả về `title` trong translations (thay vì `name`), **không tạo custom type riêng** —
> dùng thẳng `Translation[]` từ `@/domains/club/types`:
>
> ```ts
> import type { Translation } from "@/domains/club/types";
>
> export interface FundPeriod {
>   // ...
>   translations?: Translation[]; // Translation đã có title?: string
> }
> ```
>
> Dùng `getTranslatedTitle(row.translations, locale)` từ `@/lib/translations` để đọc.
> **Không tạo hàm inline `getXxxTitle()` riêng cho từng module.**

---

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

---

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

---

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
import type { useListParams } from "@/hooks/useListParams";

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

        // Nếu translatable field dùng "name" (mặc định):
        formData.append(`translations[${entry.locale}][name]`, entry.name ?? "");

        // Nếu translatable field dùng "title" (ví dụ: FundPeriod):
        // const e = entry as Record<string, string>;
        // formData.append(`translations[${entry.locale}][title]`, e["title"] ?? "");

        formData.append(
            `translations[${entry.locale}][description]`,
            entry.description ?? ""
        );
    });
    return formData;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useExamples(
    // ✅ Dùng ReturnType — đồng bộ exact type với useListParams
    // Tránh lỗi: "sort_dir: string" không assignable to "asc" | "desc" | undefined
    params: ReturnType<typeof useListParams<ExampleFilters>>["params"]
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

### 4.1. Select hook — dropdown cho module khác

Khi BE có endpoint `GET /{resource}/select` (xem `BaseRepository.select()`), và entity này có thể được module khác dùng làm dropdown (vd: monthly-contribution cần fund-period / member / transaction làm dropdown), **thêm một standalone hook select** ngay trong cùng file `useExamples.ts`:

```ts
// ─── Select hook (dùng bởi module khác cần dropdown example) ──────────────────
export function useExampleSelect() {
    const query = useQuery({
        queryKey: ["examples-select"],
        queryFn: () =>
            exampleServiceClient.select() as Promise<ApiResponse<Example[]>>,
    });

    return {
        data: query.data?.data ?? [],
        isLoading: query.isLoading,
    };
}
```

> **Quy ước đặt tên:** `use{Entity}Select` — ví dụ `useModuleSelect`, `useRoleSelect`, `useUserSelect`, `useClubSelect`, `useMonthlyContributionSelect`, `useFundPeriodSelect`, `useTransactionSelect`, `useClubMemberSelect`.

> **Vị trí:** luôn đặt trong cùng file `use{Entity}s.ts` (KHÔNG tạo file `select.ts` riêng) để share query key/cache với inline select (nếu hook chính có fetch select inline).

#### Hai biến thể theo scope

**System module** (resource không phụ thuộc club — vd: module, role, user, club):
```ts
export function useExampleSelect() {
    const query = useQuery({
        queryKey: ["examples-select"],
        queryFn: () =>
            exampleServiceClient.select() as Promise<ApiResponse<Example[]>>,
    });
    return { data: query.data?.data ?? [], isLoading: query.isLoading };
}
```

**Club-scoped module** (resource nằm dưới `clubs/{slug}/...` — vd: monthly-contribution, fund-period, transaction, member):
```ts
export function useExampleSelect(clubSlug?: string | null) {
    const query = useQuery({
        queryKey: ["examples-select", clubSlug],
        queryFn: () => {
            if (!clubSlug) throw new Error("Club slug is required");
            return getExampleService(clubSlug).select();
        },
        enabled: Boolean(clubSlug),
    });
    return { data: query.data?.data ?? [], isLoading: query.isLoading };
}
```

#### Cách dùng ở PageClient khác module

```tsx
import { useExampleSelect } from "@/domains/example/hooks/useExamples";

// Club-scoped: truyền slug (lấy từ useParams)
const { data: examples, isLoading: examplesLoading } = useExampleSelect(slug);

// System: không truyền gì
const { data: examples, isLoading: examplesLoading } = useExampleSelect();
```

#### Khi nào cần thêm?

| Trường hợp | Có cần select hook? |
|---|---|
| BE có `/select` VÀ entity được module khác tham chiếu (dropdown/foreign key) | ✅ Thêm |
| BE có `/select` NHƯNG entity không bao giờ là dropdown (vd: setting) | Tùy — vẫn thêm cho đồng bộ, hoặc bỏ qua |
| BE KHÔNG có `/select` | ❌ Bỏ qua — `BaseRepository.select()` sẽ 404 |

> **Lưu ý:** nếu type select khác entity thường (vd: `TransactionSelect` chỉ `{id, label}` thay vì full `Transaction`), khai báo type riêng `XxxSelect` trong `types/index.ts` và cast:
> ```ts
> queryFn: () => service.select() as Promise<ApiResponse<TransactionSelect[]>>,
> ```

---

## Bước 5: Tạo Client Component

`src/app/[locale]/admin/(system)/examples/ExamplesPageClient.tsx`

> **Quy tắc chọn pattern:**
> - Nhìn vào type của entity — nếu có `translations?: Array<{locale, name, ...}>` → dùng **Pattern B (có translations)**
> - Nếu không có mảng `translations` → dùng **Pattern A (không có translations)**

---

### Pattern A — Không có translations

> Áp dụng khi entity lưu dữ liệu trực tiếp (không đa ngôn ngữ), ví dụ: User, Role, Permission.

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { Table, ColumnDef } from "@/components/shared/ui/Table";
import { FilterBar } from "@/components/shared/ui/FilterBar";
import { Pagination } from "@/components/shared/ui/Pagination";
import { FormModal, type SubmitResult } from "@/components/shared/forms/FormModal";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import { useListParams } from "@/hooks/useListParams";
import { useExamples } from "@/domains/example/hooks/useExamples";
import type { Example, ExampleFilters } from "@/domains/example/types";

export function ExamplesPageClient() {
    // ❌ KHÔNG cần useLocale()
    const t  = useTranslations("common");
    const te = useTranslations("example");

    const { params, setPage, setLimit, updateMany, reset } =
        useListParams<ExampleFilters>({
            defaultFilters: { search: "", status: undefined },
            defaultSortBy: "created_at",
            defaultSortDir: "desc",
        });

    const {
        data, total, isLoading,
        isCreating, isUpdating, isDeleting,
        handleCreate, handleEdit, handleDeleteConfirm,
    } = useExamples(params);

    // ── UI state ──────────────────────────────────────────────────────────────
    const [modalOpen, setModalOpen] = useState(false);
    const [selected, setSelected] = useState<Example | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Example | null>(null);

    const openCreate = () => { setSelected(null); setModalOpen(true); };
    const openEdit   = (m: Example) => { setSelected(m); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setSelected(null); };

    // handleSubmit chỉ nhận values — KHÔNG có translations
    const handleSubmit = async (
        values: Record<string, string>,
    ): Promise<SubmitResult> => {
        const result = selected
            ? await handleEdit(selected.id, values)
            : await handleCreate(values);

        if (!result) closeModal();
        return result;
    };

    // ── Form config ───────────────────────────────────────────────────────────
    const sortOptions = [
        { value: "created_at", label: t("createdAt") },
    ];

    // Tất cả fields đều nằm trong formFields (không có translatableFields)
    const formFields = [
        { name: "name",       label: t("name"),        type: "text" as const,   required: true },
        { name: "sort_order", label: t("sortOrder"),   type: "number" as const, required: true, placeholder: "1" },
        { name: "is_active",  label: t("active"),      type: "toggle" as const },
    ];

    const formInitialValues = {
        name:       selected?.name ?? "",
        sort_order: String(selected?.sort_order ?? 1),
        is_active:  selected?.is_active ? "1" : "0",
    };

    // ── Columns ───────────────────────────────────────────────────────────────
    const columns: ColumnDef<Example>[] = [
        {
            key: "stt", label: t("no"), className: "w-12",
            render: (_row, index) => (
                <span className="text-foreground-muted text-xs">
                    {(params.page - 1) * params.limit + index + 1}
                </span>
            ),
        },
        {
            key: "name", label: t("name"),
            // Đọc trực tiếp từ field, không qua getTranslatedName()
            render: (row) => <span className="text-sm text-foreground">{row.name || "—"}</span>,
        },
        {
            key: "is_active", label: t("status"), className: "text-center w-28",
            render: (row) => (
                <span className={`text-xs font-medium ${row.is_active ? "text-emerald-600" : "text-gray-400"}`}>
                    {row.is_active ? t("active") : t("inactive")}
                </span>
            ),
        },
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
                        onClick={openCreate}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />{te("create")}
                    </button>
                </div>

                <div className="space-y-4">
                    <FilterBar
                        search={params.search}
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
                                <TableActionItem icon={<Pencil className="w-4 h-4" />} label={t("edit")}   onClick={() => openEdit(row)} />
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

            {/* FormModal chỉ dùng fields + initialValues, KHÔNG có translatableFields */}
            <FormModal
                isOpen={modalOpen}
                onClose={closeModal}
                onSubmit={handleSubmit}
                title={selected ? te("edit") : te("create")}
                submitting={selected ? isUpdating : isCreating}
                isEdit={!!selected}
                fields={formFields}
                initialValues={formInitialValues}
            />

            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                title={t("deleteConfirmTitle")}
                description={t("deleteConfirmDesc")}
                message={deleteTarget ? te("deleteConfirmMsg", { name: deleteTarget.name }) : ""}
                confirmText={t("delete")}
                cancelText={t("cancel")}
                onConfirm={() => { if (deleteTarget) { handleDeleteConfirm(deleteTarget.id); setDeleteTarget(null); } }}
                onCancel={() => setDeleteTarget(null)}
                loading={isDeleting}
            />
        </>
    );
}
```

---

### Pattern B — Có translations

> Áp dụng khi entity có mảng `translations: Array<{locale, name, description?, ...}>`, ví dụ: Module, Category, Tag, Post.

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { Table, ColumnDef } from "@/components/shared/ui/Table";
import { FilterBar, type AppliedFilters } from "@/components/shared/ui/FilterBar";
import { Pagination } from "@/components/shared/ui/Pagination";
import {
    FormModal,
    type FormFieldDef,
    type TranslatableFieldDef,
    type TranslationEntry,
} from "@/components/shared/forms/FormModal";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import Select from "@/components/shared/ui/Select";
import ToggleSwitch from "@/components/shared/ui/ToggleSwitch";
import { useListParams } from "@/hooks/useListParams";
import { useExamples } from "@/domains/example/hooks/useExamples";
import type { Example, ExampleFilters } from "@/domains/example/types";
import { getTranslatedName } from "@/lib/translations";


// Map translations array → object { vi: {...}, en: {...} } cho FormModal
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

// ── Component ─────────────────────────────────────────────────────────────────

export function ExamplesPageClient() {
    const locale = useLocale();   // cần để đọc đúng ngôn ngữ
    const t  = useTranslations("common");
    const te = useTranslations("example");

    const { params, setPage, setLimit, updateMany, reset } =
        useListParams<ExampleFilters>({
            defaultFilters: { search: "", is_active: undefined },
            defaultSortBy: "created_at",
            defaultSortDir: "desc",
        });

    // ── Draft state cho extra filters ─────────────────────────────────────────
    // Khai báo draft state riêng cho mỗi extra filter
    // KHÔNG bind Select.value trực tiếp vào params — dùng draft + sync qua useEffect
    const [draftIsActive, setDraftIsActive] = useState<0 | 1 | undefined>(params.is_active);
    useEffect(() => { setDraftIsActive(params.is_active); }, [params.is_active]);

    const {
        data, total, isLoading, togglingIds,
        isCreating, isUpdating, isDeleting,
        handleCreate, handleEdit, handleDeleteConfirm, handleToggleStatus,
    } = useExamples(params);

    // ── UI state ──────────────────────────────────────────────────────────────
    const [modalOpen, setModalOpen] = useState(false);
    const [selected, setSelected] = useState<Example | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Example | null>(null);

    const openCreate = () => { setSelected(null); setModalOpen(true); };
    const openEdit   = (m: Example) => { setSelected(m); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setSelected(null); };

    // handleSubmit nhận thêm translations
    const handleSubmit = async (
        values: Record<string, string>,
        translations?: TranslationEntry[],
    ) => {
        const result = selected
            ? await handleEdit(selected.id, values, translations)
            : await handleCreate(values, translations);

        if (!result) closeModal();
        return result;
    };

    // ── FilterBar handlers ────────────────────────────────────────────────────
    // Khi có extra filters: dùng custom handler thay vì onApply trực tiếp
    const handleApplyFilters = (filters: AppliedFilters) => {
        updateMany({
            search: filters.search,
            sort_by: filters.sort_by,
            sort_dir: filters.sort_dir,
            is_active: draftIsActive,   // inject draft values vào đây
            // thêm các draft khác nếu có
        });
    };

    const handleReset = () => {
        setDraftIsActive(undefined);    // reset tất cả draft
        reset();                        // reset params
    };

    // ── Form config ───────────────────────────────────────────────────────────
    const sortOptions = [
        { value: "created_at", label: t("createdAt") },
    ];

    // formFields: các field thường (không dịch) — sort_order, is_active, slug...
    const formFields: FormFieldDef[] = useMemo(() => [
        { name: "sort_order", label: t("sortOrder"), type: "number", required: true, placeholder: "1" },
        { name: "is_active",  label: t("active"),    type: "toggle" },
    ], [t]);

    // translatableFields: các field có nội dung đa ngôn ngữ — name, description...
    const translatableFields: TranslatableFieldDef[] = useMemo(() => [
        { name: "name",        label: t("name"),        type: "text",     required: true },
        { name: "description", label: t("description"), type: "textarea" },
    ], [t]);

    const editInitialValues = selected ? {
        sort_order: String(selected.sort_order ?? 1),
        is_active:  selected.is_active ? "1" : "0",
    } : undefined;

    const createInitialValues = {
        sort_order: "1",
        is_active:  "1",
    };

    // ── Extra filters JSX ─────────────────────────────────────────────────────
    // Render bằng <Select> từ @/components/shared/ui/Select
    // Truyền vào FilterBar qua prop extraFilters={extraFilters}
    const activeOptions = [
        { value: "1", label: t("active") },
        { value: "0", label: t("inactive") },
    ];

    const extraFilters = (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fg-muted">{t("status")}</span>
            <Select
                label={t("status")}
                options={activeOptions}
                value={draftIsActive !== undefined ? String(draftIsActive) : ""}
                onChange={(v) => setDraftIsActive(v === "" ? undefined : (Number(v) as 0 | 1))}
                placeholder={t("all")}
            />
        </div>
    );

    // ── Columns ───────────────────────────────────────────────────────────────
    const columns: ColumnDef<Example>[] = [
        {
            key: "stt", label: t("no"), className: "w-12",
            render: (_row, index) => (
                <span className="text-foreground-muted text-xs">
                    {(params.page - 1) * params.limit + index + 1}
                </span>
            ),
        },
        {
            key: "name", label: t("name"),
            // ✅ Phải dùng helper — KHÔNG đọc row.name trực tiếp
            render: (row) => <span className="text-sm text-foreground">{getTranslatedName(row.translations, locale) || "—"}</span>,
        },
        // Nếu entity dùng "title" (không phải "name"):
        // render: (row) => <span>{getTranslatedTitle(row.translations, locale) || "—"}</span>,
        {
            key: "is_active", label: t("status"), className: "text-center w-28",
            render: (row) => (
                <div className="flex justify-center">
                    <ToggleSwitch
                        checked={Boolean(row.is_active)}
                        loading={togglingIds.has(row.id)}
                        onChange={() => handleToggleStatus(row)}
                    />
                </div>
            ),
        },
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
                        onClick={openCreate}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />{te("create")}
                    </button>
                </div>

                <div className="space-y-4">
                    {/* ✅ Khi có extra filters: showStatusFilter={false} + custom handler + extraFilters */}
                    <FilterBar
                        search={params.search}
                        sortBy={params.sort_by}
                        sortDir={params.sort_dir}
                        sortOptions={sortOptions}
                        showStatusFilter={false}
                        loading={isLoading}
                        onApply={handleApplyFilters}
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
                                <TableActionItem icon={<Pencil className="w-4 h-4" />} label={t("edit")}   onClick={() => openEdit(row)} />
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

            {/* FormModal dùng đủ 5 props: fields, initialValues, translatableFields, initialTranslations */}
            <FormModal
                isOpen={modalOpen}
                onClose={closeModal}
                onSubmit={handleSubmit}
                title={selected ? te("edit") : te("create")}
                submitting={selected ? isUpdating : isCreating}
                isEdit={!!selected}
                fields={formFields}
                initialValues={selected ? editInitialValues : createInitialValues}
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

            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                title={t("deleteConfirmTitle")}
                description={t("deleteConfirmDesc")}
                message={deleteTarget ? te("deleteConfirmMsg", { name: getTranslatedName(deleteTarget.translations, locale) }) : ""}
                confirmText={t("delete")}
                cancelText={t("cancel")}
                onConfirm={() => { if (deleteTarget) { handleDeleteConfirm(deleteTarget.id); setDeleteTarget(null); } }}
                onCancel={() => setDeleteTarget(null)}
                loading={isDeleting}
            />
        </>
    );
}
```

---

### Bảng so sánh nhanh

| | **Pattern A** (không có translations) | **Pattern B** (có translations) |
|---|---|---|
| `useLocale()` | ❌ | ✅ |
| `getTranslatedName(row.translations, locale)` | ❌ — đọc `row.name` trực tiếp | ✅ bắt buộc |
| `getTranslatedTitle(row.translations, locale)` | ❌ | ✅ khi entity dùng `title` thay `name` |
| `toInitialTranslations()` | ❌ | ✅ |
| `handleSubmit` | `(values)` | `(values, translations?)` |
| `FormModal` | `fields` + `initialValues` | Thêm `translatableFields` + `initialTranslations` |
| Extra filters | `onApply` trực tiếp | Draft state + `handleApplyFilters` + `handleReset` |
| Columns | `row.name` trực tiếp | `getTranslatedName(row.translations, locale)` |

### Cách xác định nên dùng pattern nào?

```ts
// Nhìn vào type definition của entity:

// ❌ Không có translations[] → Pattern A
type Example = {
  id: string;
  name: string;        // lưu thẳng
  is_active: boolean;
}

// ✅ Có translations[] → Pattern B
type Example = {
  id: string;
  is_active: boolean;
  translations?: Array<{
    locale: string;    // 👈 có mảng này → Pattern B
    name: string;
    description?: string;
  }>;
}
```

---

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

---

## Bước 7: Thêm constants

```ts
// src/constants/index.ts
export const MODULE_SLUGS = {
  example: "example",
} as const;
// System module: thêm vào APP_ROUTES →  adminExamples: "/admin/examples"
// Club module:   thêm vào CLUB_SUBROUTES → examples: "examples"
```

---

## Bước 8: Thêm nav item

**System** → `src/components/layout/nav-config.ts`
```ts
{ href: APP_ROUTES.adminExamples, labelKey: "examples", icon: ExampleIcon, module: MODULE_SLUGS.example, action: PERMISSION_ACTIONS.view },
```

**Club** → `src/components/layout/club-nav-config.ts`
```ts
{ sub: CLUB_SUBROUTES.examples, labelKey: "examples", module: MODULE_SLUGS.example, action: PERMISSION_ACTIONS.view, icon: ExampleIcon },
```

---

## Tóm tắt file cần tạo/sửa

| File | Việc cần làm |
|------|-------------|
| `domains/example/types/index.ts` | Interface + ExampleFilters type |
| `domains/example/services/exampleServiceServer.ts` | Server service |
| `domains/example/services/exampleService.ts` | Client service |
| `domains/example/hooks/useExamples.ts` | Custom hook — TanStack Query **+ `useExampleSelect` (nếu có endpoint /select)** |
| `app/[locale]/admin/(system)/examples/page.tsx` | Server Component |
| `app/[locale]/admin/(system)/examples/ExamplesPageClient.tsx` | Client Component (UI only) |
| `constants/index.ts` | MODULE_SLUGS + APP_ROUTES / CLUB_SUBROUTES |
| `components/layout/nav-config.ts` | ADMIN_NAV_ITEMS |
| `components/layout/club-nav-config.ts` | CLUB_NAV_ITEMS |
| `messages/vi.json + messages/en.json` | i18n keys |

---

## Checklist

- Hook params type: dùng `ReturnType<typeof useListParams<Filters>>["params"]` — KHÔNG tự khai báo type thủ công
- `handleCreate`/`handleEdit` trả `undefined` khi thành công → `FormModal` tự đóng; trả `{ success: false, ... }` khi lỗi → modal giữ nguyên hiển thị lỗi
- `toast.success(res.message || t("saveSuccess"))` — không để fallback là `""` (toast trống = vô hình)
- `toast.error` trong mọi `onError` / catch
- `data = listData?.data ?? []` — luôn fallback `[]`
- Mọi string hiển thị đều qua `t()` — không hardcode tiếng Việt
- Club-scoped page: permission check truyền `club.id`
- `toggleStatus` cho cột `is_active`, `updateStatus` cho cột `status` enum — không nhầm
- Entity dùng `title` (không phải `name`) trong translations: dùng `getTranslatedTitle()` từ `@/lib/translations`, KHÔNG tạo hàm inline riêng
- Extra filters (year, month, status...): dùng draft state + `Select` component + `extraFilters` prop trên `FilterBar`
- `formatAmount(value)` — dùng từ `@/utils`, không khai báo lại trong component
- `buildPayload` với translatable field tên `"title"`: dùng `(entry as Record<string, string>)["title"]`
- Select hook: nếu BE có `GET /{resource}/select` → export `use{Entity}Select` trong cùng file `use{Entity}s.ts` (KHÔNG tạo file `select.ts` riêng); club-scoped thì nhận `clubSlug?` + `enabled: Boolean(clubSlug)`, system thì không cần

---

## Phụ lục: Utilities dùng chung (`src/utils/index.ts`)

```ts
/** Merge class names conditionally. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Format ISO date string to localized display. */
export function formatDate(iso: string | null | undefined, locale: string = "vi"): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

/** Format ISO datetime to localized display. */
export function formatDateTime(iso: string | null | undefined, locale: string = "vi"): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/** Format số tiền sang dạng hiển thị, ví dụ: 250,000 đ */
export function formatAmount(
  value: string | number | null | undefined,
  currency: string = "đ",
  locale: string = "vi",
): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (isNaN(num)) return "—";
  return num.toLocaleString(locale === "vi" ? "vi-VN" : "en-US") + " " + currency;
}
```

---

## Phụ lục: Translation helpers (`src/lib/translations.ts`)

```ts
import type { Translation } from "@/domains/club/types";

/** Tìm translation theo locale hiện tại, fallback về phần tử đầu tiên. */
export function getTranslation<T extends Translation>(
    translations: T[] | undefined,
    locale: string
): T | undefined {
    return translations?.find((t) => t.locale === locale) ?? translations?.[0];
}

/** Lấy name theo locale */
export function getTranslatedName<T extends Translation>(
    translations: T[] | undefined,
    locale: string
): string {
    return getTranslation(translations, locale)?.name ?? "";
}

/** Lấy title theo locale — dùng khi entity translations có field "title" */
export function getTranslatedTitle<T extends Translation>(
    translations: T[] | undefined,
    locale: string
): string {
    return getTranslation(translations, locale)?.title ?? "";
}

/** Lấy slug theo locale */
export function getTranslatedSlug<T extends Translation>(
    translations: T[] | undefined,
    locale: string
): string | undefined {
    return getTranslation(translations, locale)?.slug;
}

/** Lấy description theo locale */
export function getTranslatedDescription<T extends Translation>(
    translations: T[] | undefined,
    locale: string
): string {
    return getTranslation(translations, locale)?.description ?? "";
}
```
