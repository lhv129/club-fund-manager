# Hướng dẫn thêm module mới

Ví dụ: thêm module **Example**.

---

## Bước 1: Tạo types

`src/domains/example/types/index.ts`

```ts
export interface Example {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface ExampleListParams {
  search?: string;
  is_active?: 0 | 1;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  limit?: number;
  page?: number;
}
```

> Khớp với backend `ExampleResource`.

---

## Bước 2: Tạo service

`src/domains/example/services/exampleService.ts`

```ts
import { BaseService } from "@/lib/baseService";
import type { ApiResponse } from "@/types/api";
import type { Example } from "../types";

class ExampleService extends BaseService<Example> {
  protected resource = "examples";

  // Thêm method custom nếu cần — dùng this.get/post/put/delete
  // Ví dụ:
  // getBySlug(slug: string) {
  //   return this.get<ApiResponse<Example>>(`/examples/slug/${slug}`);
  // }
}

export const exampleService = new ExampleService();
```

> `BaseService` đã có sẵn: `list`, `show`, `create`, `update`, `destroy`, `toggleStatus`, `cursorList`, `select`.
> Chỉ thêm method custom khi endpoint đặc biệt.
> **Không khai báo lại `API_URL`** — đã có trong `lib/config.ts`.

---

## Bước 3: Tạo page

`src/app/[locale]/(dashboard)/examples/page.tsx`

```tsx
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";

export default async function ExamplesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("menu");
  const tCommon = await getTranslations("common");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">
        {t("examples")}
      </h1>
      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg text-zinc-400">{tCommon("comingSoon")}</p>
        </div>
      </Card>
    </div>
  );
}
```

---

## Bước 4: Thêm constants

`src/constants/index.ts` — thêm 2 chỗ:

```ts
// 1. APP_ROUTES
export const APP_ROUTES = {
  // ...existing
  examples: "/examples",
} as const;

// 2. MODULE_SLUGS
export const MODULE_SLUGS = {
  // ...existing
  example: "example",
} as const;
```

---

## Bước 5: Thêm nav item

`src/components/layout/Sidebar.tsx`

```ts
{ href: APP_ROUTES.examples, labelKey: "examples", module: MODULE_SLUGS.example, action: PERMISSION_ACTIONS.view, icon: "📦" },
```

> Nav item tự động ẩn/hiện theo permission — `hasPermission(module, action)`.
> Superadmin thấy tất cả.

---

## Bước 6: Thêm translation

`src/messages/vi.json`

```json
{
  "menu": {
    "examples": "Ví dụ"
  }
}
```

`src/messages/en.json`

```json
{
  "menu": {
    "examples": "Examples"
  }
}
```

---

## Tóm tắt

| File | Việc cần làm |
|---|---|
| `domains/example/types/index.ts` | Tạo interface khớp backend Resource |
| `domains/example/services/exampleService.ts` | Extend `BaseService<T>`, set `resource` |
| `app/[locale]/(dashboard)/examples/page.tsx` | Tạo page (Server Component) |
| `constants/index.ts` | Thêm route + module slug |
| `components/layout/Sidebar.tsx` | Thêm nav item |
| `messages/vi.json` + `en.json` | Thêm translation key |

**Không cần đụng**: `apiClient`, `baseService`, `middleware`, `cookies`, `config`.
