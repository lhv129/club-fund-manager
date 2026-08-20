# Next.js Frontend — Club Fund Manager
Stack: Next.js 16, React 19, TypeScript, Tailwind v4, next-intl, zustand, **@tanstack/react-query**

## 1. Cấu trúc thư mục
```
src/
├── app/
│   ├── layout.tsx                  # Root layout — <html>/<body> + fonts
│   ├── globals.css
│   ├── [locale]/                   # Locale prefix (vi/en)
│   │   ├── layout.tsx              # NextIntlClientProvider + QueryClientProvider
│   │   ├── not-found.tsx           # 404 → href "/" (root)
│   │   ├── page.tsx                # ⬅ Root landing — phân luồng theo role (xem §8)
│   │   ├── (auth)/                 # Route group — login/register
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   │
│   │   ├── admin/                  # ⬅ Admin workspace (system) — URL: /{locale}/admin/...
│   │   │   ├── layout.tsx          # Gate: superadmin | is_system_admin | có system permission
│   │   │   │                       #   → KHÔNG qua → redirect /{locale}/ (root phân luồng tiếp)
│   │   │   │                       #   → qua → render <AdminShell> (auth + profile hydrate)
│   │   │   └── (system)/           # Route group — system pages (gate chi tiết hơn)
│   │   │       ├── layout.tsx      # Gate: superadmin / is_system_admin / có system permission
│   │   │       │                   #   KHÔNG qua → redirect /{locale}/ (root)
│   │   │       ├── page.tsx        # /admin — dashboard hệ thống (stats)
│   │   │       ├── users/page.tsx
│   │   │       ├── roles/page.tsx
│   │   │       ├── permissions/page.tsx
│   │   │       └── settings/page.tsx
│   │   │
│   │   └── club/                   # ⬅ Club workspace — URL: /{locale}/club/{slug}/...
│   │       └── [slug]/
│   │           ├── layout.tsx      # Auth + fetch profile + fetch club by slug + canAccessClub gate
│   │           ├── dashboard/page.tsx
│   │           ├── members/page.tsx
│   │           ├── invites/page.tsx
│   │           └── settings/page.tsx
│   │
│   └── api/
│       ├── auth/                   # Route Handlers — quản lý httpOnly cookie
│       │   ├── login/route.ts      # Chỉ set cookie + return JSON { user } — KHÔNG redirect
│       │   ├── refresh/route.ts
│       │   └── logout/route.ts
│       └── proxy/[...path]/route.ts # Generic proxy — Client Component gọi API qua đây
│
├── domains/                        # Domain-driven — mirror backend
│   ├── auth/                       # types, services (server + client), stores, hooks
│   │   ├── types/index.ts          # Profile (is_superadmin, is_system_admin, permissions: PermissionMap)
│   │   ├── hooks/useAuth.ts       # hasPermission → can(); isSystemAdmin; canAccessClub; hasAnyClubPermission
│   │   ├── stores/authStore.ts    # zustand
│   │   ├── services/              # authService (client), authServiceServer
│   │   └── components/LoginForm.tsx  # Chỉ login + redirect "/" — root page lo phân luồng
│   ├── club/                       # types, services, stores, hooks
│   │   ├── types/index.ts          # Club, ClubMember, ClubInvite, Translation
│   │   ├── services/               # clubService (client), clubServiceServer, clubMemberService, clubInviteService
│   │   ├── stores/clubStore.ts     # zustand — club workspace hiện tại
│   │   ├── hooks/useClub.ts       # useClub() + useHydrateClub()
│   │   ├── ClubsPageClient.tsx    # Danh sách CLB (nhận prop clubs từ root) + nút "Mở workspace"
│   │   └── NoClubClient.tsx       # Trang "Chưa có CLB" — search/token join (render tại root)
│   ├── role/
│   ├── permission/
│   └── module/
│
components/
├── shared/
│   ├── ui/
│   ├── layout/
│   ├── forms/
│   │   ├── DeleteConfirmModal.tsx
│   │   ├── FormModal.tsx
│   │   └── FormModalWithMedia.tsx
│   ├── media/
│   │   ├── CustomImage.tsx
│   │   ├── MediaImage.tsx
│   │   └── MediaUploader.tsx
│   └── feedback/
│
├── admin/
│   ├── layout/
│   └── navigation/
│
├── club/
│   ├── layout/
│   └── navigation/
│
│
├── hooks/
│   └── useAdminListParams.ts       # Hook quản lý filter/sort/page/limit — generic theo module
│
├── lib/
│   ├── http/
│   │   ├── types.ts                # HttpAdapter interface
│   │   ├── queryString.ts          # buildQueryString
│   │   ├── serverAdapter.ts        # Server-only — cookie Bearer, AUTO-REFRESH 401
│   │   └── browserAdapter.ts      # Client-safe — gọi qua /api/proxy
│   ├── baseRepository.ts           # Abstract class — toàn bộ CRUD viết 1 lần
│   ├── permissions.ts              # ⬅ can(), canAccessClub(), hasAnyClubPermission(),
│   │                               #    hasAnySystemPermission(), systemPermissions(), ...
│   ├── cookies.ts                  # httpOnly cookie helpers (server-only)
│   ├── config.ts                   # API_URL, APP_URL
│   ├── errors.ts                   # ApiError
│   ├── locales.ts                  # Nguồn locale duy nhất — đọc config/locales.json
│   └── formTranslations.ts         # Parse lỗi validate + khởi tạo field đa ngôn ngữ
|   └── translations.ts             # ⬅ getTranslation, getTranslatedName, getTranslatedSlug,getTranslatedDescription — helpers đọc translations[] theo locale
│
├── config/
│   └── locales.json                # Danh sách locale — SỬA FILE NÀY khi thêm/bớt ngôn ngữ
│
├── i18n/
│   ├── routing.ts                  # locales + navigation (Link, useRouter, usePathname, ...)
│   └── request.ts                  # next-intl request config
│
├── messages/                       # i18m messages UI
│   ├── vi.json
│   └── en.json
│
├── types/api.ts                    # ApiResponse, PaginatedResponse, CursorResponse
├── constants/index.ts              # APP_ROUTES (home, admin, adminUsers, ..., club),
│                                   #   CLUB_SUBROUTES, clubRoute(), MODULE_SLUGS, ...
├── providers/index.ts              # QueryClientProvider bọc toàn bộ app (client-side)
└── utils/index.ts
```

## 2. Permission — 5 role & 2 scope (xem docs/permission-guide.md)
```
┌─────────────┬──────────────────┬──────────────────┬───────────────────────────────────────┐
│ Role        │ is_superadmin    │ is_system_admin  │ Shape permissions                     │
├─────────────┼──────────────────┼──────────────────┼───────────────────────────────────────┤
│ superadmin  │ true             │ false            │ ["*"]                                 │
│ admin       │ false            │ true             │ { module: [actions] }  (flat, system) │
│ owner       │ false            │ false            │ { "club_{id}": { module: [...] } }    │
│ manager     │ false            │ false            │ { "club_{id}": { module: [...] } }    │
│ member      │ false            │ false            │ { "club_{id}": { module: [...] } }    │
└─────────────┴──────────────────┴──────────────────┴───────────────────────────────────────┘
```
Hybrid: admin + member của club X → merge shape 2+3 (không collide vì module slug ≠ `club_{id}`).

- 2 scope: system (users/roles/permissions/...) | club (members/funds/transactions/...)
- 1 user thuộc nhiều club với role khác nhau per-club.
- Helper `can(perms, isSuperAdmin, module, action, clubId)` duy nhất — clubId null = system scope, number = club scope.
- KHÔNG fallback "any club" khi clubId null.

## 3. Routing — root landing phân luồng + 2 workspace
Mọi user đã login đều đến root "/" trước. Root page (Server Component) fetch profile +
clubs, rồi phân luồng:

```
┌──────────────────┬──────────────────────────────────────────────────────────────┐
│ /{locale}/       │ Root landing (page.tsx) — phân luồng theo role:              │
│ (root)           │   1. Chưa login                     → /{locale}/login        │
│                  │   2. superadmin | is_system_admin   → /{locale}/admin       │
│                  │   3. 1 club truy cập được           → /{locale}/club/{slug}/│
│                  │                                       dashboard              │
│                  │   4. 2+ clubs                       → render <ClubsPageClient│
│                  │                                       clubs={...}/>           │
│                  │   5. 0 club                         → render <NoClubClient/> │
│                  │ Render trong <LandingShell> (Header, không sidebar).         │
├──────────────────┼──────────────────────────────────────────────────────────────┤
│ /{locale}/admin  │ Admin workspace (system: users, roles, permissions,          │
│                  │   settings, dashboard stats).                                 │
│                  │ Gate: superadmin | is_system_admin | có system permission.    │
│                  │ Hybrid admin cũng vào được (vì is_system_admin: true).        │
├──────────────────┼──────────────────────────────────────────────────────────────┤
│ /{locale}/club/  │ Club workspace (members, invites, funds, ...).               │
│   {slug}/...     │ Gate: canAccessClub(permissions, isSuperAdmin, club.id).     │
└──────────────────┴──────────────────────────────────────────────────────────────┘
```

KHÔNG còn route /admin/clubs và /admin/no-club — root "/" sở hữu danh sách CLB
và trang "Chưa có CLB".

## 4. Gate pattern 3 tầng
**Tầng 1 — Layout gate (Server Component):**
- `admin/layout.tsx` → auth + fetch profile + gate (superadmin | is_system_admin | hasAnySystemPermission). KHÔNG qua → redirect /{locale}/ (root phân luồng tiếp). Qua → `<AdminShell>`.
- `admin/(system)/layout.tsx` → superadmin | is_system_admin | có system permission. KHÔNG qua → redirect /{locale}/ (root).
- `club/[slug]/layout.tsx` → canAccessClub(permissions, isSuperAdmin, club.id). KHÔNG qua → notFound().

**Tầng 2 — Nav filter (Client Component):**
- `Sidebar.tsx` → filterNav(ADMIN_NAV_ITEMS, (m,a) => hasPermission(m, a), isSuperAdmin||isSystemAdmin) (clubId undefined → SYSTEM SCOPE)
- `ClubSidebar.tsx` → CLUB_NAV_ITEMS.filter(item => hasPermission(item.module, item.action, club.id)) (clubId = club.id → CLUB SCOPE). showBackToClubs = isSuperAdmin || hasAnyClubPermission(). Nút "← Quay lại danh sách CLB" → href "/" (root phân luồng lại)

**Tầng 3 — Page & Button gate (Client Component):**
- Page: `if (!hasPermission("member", "view", club.id)) return <Forbidden/>`
- Button: `{hasPermission("member", "create", club.id) && <Button/>}`
- System: `if (!isSuperAdmin && !hasPermission("user", "view")) return <Forbidden/>`

## 5. Data flow
```
SERVER (Server Component, Route Handler)
    page/layout.tsx
        ↓
    xxxServiceServer.ts   (extends BaseRepository, adapter = serverAdapter)
        ↓
    lib/baseRepository.ts
        ↓
    lib/http/serverAdapter.ts  ── cookie Bearer token ──▶  Laravel API
                                     ↑ 401? tự refresh + retry 1 lần (cookie set lại)

CLIENT (Client Component — "use client")
    XxxPageClient.tsx / FormModal / useAuth
        ↓
    xxxService.client.ts   (extends BaseRepository, adapter = browserAdapter)
        ↓
    lib/baseRepository.ts
        ↓
    lib/http/browserAdapter.ts  ── Accept-Language ──▶  /api/proxy/[...path]
                                                              ↓
                                                    createServerAdapter(locale)
                                                              ↓
                                                    lib/http/serverAdapter.ts ──▶ Laravel API
                                                    (401 cũng được auto-refresh tại đây)
```

### 5.1. BaseRepository — method CRUD & trạng thái
Toàn bộ CRUD viết 1 lần tại `lib/baseRepository.ts`. Mọi domain service kế thừa, chỉ khai báo
`resource` + `adapter`.

| Method | Mô tả | Response |
|--------|-------|----------|
| `list(params?)` | GET /{resource} — danh sách phân trang | `PaginatedResponse<T>` |
| `show(id)` | GET /{resource}/:id | `ApiResponse<T>` |
| `showBySlug(slug)` | GET /{resource}/slug/:slug | `ApiResponse<T>` |
| `select(params?)` | GET /{resource}/select | `ApiResponse<T[]>` |
| `create(data)` | POST /{resource} — Partial\<T\> \| FormData | `ApiResponse<T>` |
| `update(id, data)` | PUT /{resource}/:id — Partial\<T\> \| FormData | `ApiResponse<T>` |
| `destroy(id)` | DELETE /{resource}/:id | `ApiResponse<{ success, message, data: [] }>` |
| `toggleStatus(id)` | POST /{resource}/:id/toggle-status | `ApiResponse<T>` |
| `updateStatus(id, status)` | PATCH /{resource}/:id/update-status `{ status }` | `ApiResponse<T>` |

**Lưu ý quan trọng về `destroy`:**
- `destroy` trả về `ApiResponse` đơn giản `{ success, message, data: [] }` — **KHÔNG** trả `PaginatedResponse<T>` nữa.
- Caller **KHÔNG** dùng response để update list. Thay vào đó dùng một trong 2 cách:
  - **Cách 1 (khuyến nghị — TanStack):** `queryClient.setQueryData(queryKey, old => filter out deleted item)` — không fetch lại.
  - **Cách 2 (fallback):** `queryClient.invalidateQueries({ queryKey })` — fetch lại danh sách.
- **Một module có thể có cả `toggleStatus` (is_active) + `updateStatus` (status enum), hoặc chỉ 1, hoặc không có** — tùy BE có endpoint tương ứng không.

### 5.2. TanStack Query — chiến lược cache theo loại operation

> Tất cả `XxxPageClient` dùng TanStack Query (`@tanstack/react-query`) để quản lý data fetching và cache.
> `QueryClientProvider` đặt ở `src/[locale]/layout.tsx` (hoặc `providers/index.ts`).

```
┌────────────┬──────────────────────────────────────────────────────────────┐
│ Operation  │ Chiến lược TanStack                                           │
├────────────┼──────────────────────────────────────────────────────────────┤
│ list       │ useQuery({ queryKey: [resource, params], queryFn: list })     │
│ create     │ useMutation → onSuccess: invalidateQueries([resource])        │
│ update     │ useMutation → onSuccess: invalidateQueries([resource])        │
│ delete     │ useMutation → onSuccess: setQueryData (filter item ra)        │
│ toggle     │ useMutation → onSuccess: setQueryData (flip is_active)        │
└────────────┴──────────────────────────────────────────────────────────────┘
```

**Query key convention:**
```ts
// Dùng [resource, params] để mỗi bộ filter/page là cache riêng
const queryKey = ["modules", params] as const;

// Invalidate toàn bộ resource (không quan tâm params):
queryClient.invalidateQueries({ queryKey: ["modules"] });

// Update cache tại params hiện tại:
queryClient.setQueryData(["modules", params], (old) => ({ ... }));
```

### 5.3. Custom hook — tách TanStack logic ra khỏi PageClient

#### Scope dữ liệu bằng `club_slug`

Các resource dùng chung như members, invites, bank accounts, fund periods, monthly contributions, transactions, playing schedules và exchange sessions gọi endpoint phẳng:

```text
GET /playing-schedules                    # admin
GET /playing-schedules?club_slug=my-club  # club workspace
```

Hook chỉ nhận `params`; workspace page merge `{ ...params, club_slug: slug }`, còn admin truyền params không có slug. Create/update truyền slug trong body/FormData; delete/toggle/complete truyền `{ club_slug }`. Service không dùng constructor `clubSlug` hoặc URL `/clubs/{slug}`.

Toàn bộ `useQuery` + `useMutation` + `setQueryData` / `invalidateQueries` + toast **không đặt trực tiếp trong PageClient** mà được tách vào một custom hook riêng theo domain:

```
domains/<module>/
└── hooks/
    └── use<Module>s.ts     # useQuery + useMutation + handlers
```

**Phân tầng trách nhiệm:**

```
PageClient           → render UI, quản lý modal/UI state (useState)
    ↓ gọi
use<Module>s(params) → useQuery, useMutation, setQueryData, invalidateQueries, toast
    ↓ gọi
<module>Service      → gọi HTTP (list, create, update, destroy, toggleStatus)
    ↓ kế thừa
BaseRepository       → wrapper fetch/axios thuần
```

**Cấu trúc hook:**
```ts
// domains/module/hooks/useModules.ts
export function useModules(params) {
  const queryClient = useQueryClient();
  const queryKey = ["modules", params] as const;

  // Data
  const { data: listData, isLoading } = useQuery({ queryKey, queryFn: () => moduleService.list(params) });

  // Mutations (logic cache nằm trong onSuccess của từng mutation)
  const createMutation = useMutation({ ... });
  const updateMutation = useMutation({ ... });
  const deleteMutation = useMutation({ onSuccess: () => setQueryData(...) });
  const toggleMutation = useMutation({ onSuccess: () => setQueryData(...) });

  // Handlers (wrap mutation + toast + trả SubmitResult cho FormModal)
  const handleCreate  = async (values, translations): Promise<SubmitResult> => { ... };
  const handleEdit    = async (id, values, translations): Promise<SubmitResult> => { ... };
  const handleDeleteConfirm  = (id: number) => deleteMutation.mutate(id);
  const handleToggleStatus   = (row: Module) => toggleMutation.mutate(row.module_id, ...);

  return { data, total, isLoading, togglingIds, isCreating, isUpdating, isDeleting,
           handleCreate, handleEdit, handleDeleteConfirm, handleToggleStatus };
}
```

**PageClient sau khi dùng hook — chỉ còn UI:**
```tsx
export function ModulesPageClient() {
  const { params, ... } = useListParams<ModuleFilters>({ ... });

  // Một dòng thay thế toàn bộ TanStack logic
  const { data, total, isLoading, handleCreate, handleEdit, ... } = useModules(params);

  // Chỉ còn useState cho modal/UI state
  const [createOpen, setCreateOpen] = useState(false);
  // ...render JSX
}
```

## 6. Auth — refresh token tự động
- Token trong httpOnly cookie (access_token 1h, refresh_token 7d).
- **Một flow refresh dùng chung** (`lib/http/tokenRefresh.ts`): single-flight dedupe
  theo refresh_token + grace period 30s cho token vừa rotate — mọi đường refresh
  (proxy auto-refresh, /api/auth/refresh, SSR recovery) cùng dùng module này để
  không bao giờ 2 request đánh cùng một refresh_token khi Laravel rotate single-use.
- **serverAdapter throw ApiError khi HTTP error** (!res.ok) — caller phân biệt được
  404/401/5xx. Proxy route catch ApiError và map về JSON envelope + đúng status.
- **Hai ngữ cảnh refresh khác nhau** (Next.js 16: Server Component không set cookie được):
  - **Route Handler (/api/proxy, /api/auth/refresh)**: `createServerAdapter(locale, { autoRefresh: true })` → request trả 401 tự refresh, set cookie mới, retry 1 lần.
  - **Server Component (SSR — page/layout)**: KHÔNG auto-refresh trong serverAdapter. Thay vào dùng `ensureProfile(locale, currentPath)`:
    1. access_token còn → gọi /auth/profile trực tiếp.
    2. access_token hết (401) hoặc thiếu → `redirect('/api/auth/refresh?next=<currentPath>')` rotate cookie rồi quay lại trang hiện tại.
    3. refresh thất bại do token invalid (401/403) → Route Handler redirect /login?redirect=<next> + clear cookie. Lỗi tạm thời (5xx/network) → trả 503, GIỮ cookie (không clear oan session đang tốt).
- **currentPath lấy từ header `x-pathname`** do middleware inject (append vào
  x-middleware-override-headers của response next-intl) — sau refresh quay lại
  đúng sub-page đang đứng (vd /vi/admin/users), không phải /admin hay dashboard chung chung.
- Middleware không chặn sớm khi thiếu access_token nếu vẫn còn refresh_token.
- Middleware chặn auth route (login/register): chỉ cho phép vào khi **cả access_token và refresh_token đều không có**.
- **404 chỉ khi resource thật sự không tồn tại**: club layout gọi notFound() chỉ khi
  backend trả 404 hoặc club null; 401 → flow refresh; 5xx/network → throw lên error
  boundary. KHÔNG biến lỗi tạm thời thành 404 giả.
- Login route (POST /api/auth/login) CHỈ set cookie + return JSON { user }. KHÔNG có logic redirect ở server — LoginForm push về "/" và root page tự phân luồng.


## 7. Locale — nguồn duy nhất + dịch slug
- Chỉ sửa `src/config/locales.json` khi thêm/bớt ngôn ngữ.
- `lib/locales.ts` export: LOCALES, LOCALE_CODES, DEFAULT_LOCALE, FALLBACK_LOCALE.
- URL dùng slug theo locale: /vi/club/cau-lac-bo-ha-noi ↔ /en/club/hanoi-badminton-club
- Backend resolve club qua `club_translations.slug` + locale.
- LocaleSwitcher: khi đổi locale, nếu đang ở /club/{slug}/... → tìm slug mới trong club.translations (đã hydrate từ store) → đổi URL, KHÔNG gọi API.

## 8. Root landing — phân luồng sau login
Root page (`src/app/[locale]/page.tsx`) là Server Component, fetch profile + clubs rồi:
1. Chưa login → `/{locale}/login`
2. is_superadmin | is_system_admin → `/{locale}/admin`
3. Đúng 1 club truy cập được → `/{locale}/club/{slug}/dashboard`
4. 2+ clubs → render `<ClubsPageClient clubs={...}/>` (trong `<LandingShell>`)
5. 0 club / lỗi fetch → render `<NoClubClient/>` (trong `<LandingShell>`)

Login flow: LoginForm → login() → router.push("/") → root page tự phân luồng. KHÔNG còn logic redirect 4-case trong LoginForm — tập trung ở root để dễ bảo trì.

ClubsPageClient nhận prop `clubs: Club[]` (đã lọc "của tôi" ở Server Component), KHÔNG tự fetch. Vẫn giữ CRUD (create/edit/delete/toggle) — permission-gated qua `hasPermission("club", "create"|"update"|"delete")` (system scope).

## 9. Cheat sheet — hasPermission
```ts
const { hasPermission, isSuperAdmin, isSystemAdmin } = useAuth();

// SYSTEM SCOPE (admin pages: users, roles, permissions, settings) — KHÔNG truyền clubId
hasPermission("user", "view");          // admin có user.view?
hasPermission("role", "create");        // admin có role.create?

// CLUB SCOPE (club workspace: members, funds, invites) — TRUYỀN club.id
hasPermission("member", "view", club.id);   // user có member.view ở club này?
hasPermission("fund", "create", club.id);   // user có fund.create ở club này?

// SUPERADMIN BYPASS → hasPermission() luôn true. KHÔNG cần check chi tiết.

// ❌ SAI: hasPermission("member", "view", null)  // null = system, không phải "any club"
// ❌ SAI: hasPermission("user", "view", club.id) // user là system module, không có club scope
```
